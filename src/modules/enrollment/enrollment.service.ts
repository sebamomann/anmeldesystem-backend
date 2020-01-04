import {Injectable} from '@nestjs/common';
import {Enrollment} from "./enrollment.entity";
import {getConnection, getRepository, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Appointment} from "../appointment/appointment.entity";
import {AppointmentService} from "../appointment/appointment.service";
import {AdditionService} from "../addition/addition.service";
import {Addition} from "../addition/addition.entity";
import {Driver} from "./driver/driver.entity";
import {Passenger} from "./passenger/passenger.entity";
import {EmptyFieldsException} from "../../exceptions/EmptyFieldsException";
import {DuplicateValueException} from "../../exceptions/DuplicateValueException";
import {User} from "../user/user.entity";
import {Key} from "./key/key.entity";

@Injectable()
export class EnrollmentService {
    constructor(@InjectRepository(Enrollment)
                private readonly enrollmentRepository: Repository<Enrollment>,
                private readonly appointmentService: AppointmentService,
                private readonly additionService: AdditionService,
                @InjectRepository(Driver)
                private readonly driverRepository: Repository<Driver>,
                @InjectRepository(Passenger)
                private readonly passengerRepository: Repository<Passenger>,
                @InjectRepository(Key)
                private readonly keyRepository: Repository<Key>) {

    }

    async find(id: string) {
        return getRepository(Enrollment)
            .createQueryBuilder("enrollment")
            .where("enrollment.id = :id", {id: id['id']})
            .leftJoinAndSelect("enrollment.appointment", "appointment")
            .leftJoinAndSelect("appointment.administrators", "appointment_administrators")
            .leftJoinAndSelect("enrollment.creator", "enrollment_creator")
            .leftJoinAndSelect("enrollment.key", "enrollment_key")
            .leftJoinAndSelect("enrollment.additions", "enrollment_additions")
            .leftJoinAndSelect("appointment.creator", "appointment_creator")
            .select(["enrollment", "enrollment_creator", "enrollment_key",
                "appointment", "appointment_administrators.mail",
                "appointment_creator.id", "enrollment_additions"])
            .getOne();
    }

    async create(enrollment: Enrollment, link: string, user: User) {
        const appointment: Appointment = await this.appointmentService.find(link);

        let emptyValues = [];
        if (enrollment.name === "" || enrollment.name === null) {
            emptyValues.push('name');
        }
        if (!!user === false && (enrollment.editKey == "" || enrollment.editKey == null)) {
            emptyValues.push('key');
        }
        if (emptyValues.length > 0) {
            throw  new EmptyFieldsException('EMPTY_FIELDS', 'Please specify following values', emptyValues);
        }

        if (await this.existsByName(enrollment.name, appointment)) {
            throw new DuplicateValueException('DUPLICATE_ENTRY', 'Following values are already taken', ['name']);
        }


        let enrollmentToDb = new Enrollment();
        enrollmentToDb.name = enrollment.name;
        enrollmentToDb.comment = enrollment.comment === "" ? null : enrollment.comment;

        enrollmentToDb.additions = [];

        for (const fAddition of enrollment.additions) {
            const addition: Addition = await this.additionService.findById(fAddition.id);
            if (addition !== null) {
                enrollmentToDb.additions.push(addition);
            }
        }

        /* Needed due to malicious comparison fo tinyint to boolean */
        if (!!appointment.driverAddition === true) {
            if (enrollment.driver !== null) {
                let driver: Driver = new Driver();
                driver.seats = enrollment.driver.seats;
                driver.service = enrollment.driver.service;

                enrollmentToDb.driver = await this.driverRepository.save(driver);
            } else {
                let passenger: Passenger = new Passenger();
                passenger.requirement = enrollment.passenger.requirement;

                enrollmentToDb.passenger = await this.passengerRepository.save(passenger);
            }
        }

        // If user is set
        if (!!user !== false) {
            enrollmentToDb.creator = user;
        } else {
            const key = new Key();
            key.key = enrollment.editKey;
            enrollmentToDb.key = await this.keyRepository.save(key);
        }

        enrollmentToDb.appointment = appointment;

        return this.enrollmentRepository.save(await enrollmentToDb)
    }

    async delete(id: string, key: string, user: User) {
        const enrollment: Enrollment = await this.find(id);

        if (user !== null && user !== undefined) {
            if (!(user.id === enrollment.appointment.creator.id
                || enrollment.appointment.administrators.some(iAdministrators => {
                    return iAdministrators.mail === user.mail
                }))
                && (enrollment.key !== null
                    && key !== enrollment.key.key)
                && enrollment.creator.id !== user.id) {
                throw new Error();
            }
        }

        await getConnection()
            .createQueryBuilder()
            .delete()
            .from(Enrollment)
            .where("id = :id", {id: id['id']})
            .execute();
    }

    private async existsByName(name: string, appointment: Appointment) {
        return await this.enrollmentRepository.findOne({where: {name: name, appointment: appointment}}) !== undefined;
    }
}
