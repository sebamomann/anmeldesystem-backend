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

@Injectable()
export class EnrollmentService {
    constructor(@InjectRepository(Enrollment)
                private readonly enrollmentRepository: Repository<Enrollment>,
                private readonly appointmentService: AppointmentService,
                private readonly additionService: AdditionService,
                @InjectRepository(Driver)
                private readonly driverRepository: Repository<Driver>,
                @InjectRepository(Passenger)
                private readonly passengerRepository: Repository<Passenger>) {

    }

    async find(id: string) {
        return getRepository(Enrollment)
            .createQueryBuilder("enrollment")
            .where("enrollment.id = :id", {id: id['id']})
            .leftJoinAndSelect("enrollment.appointment", "appointment")
            .leftJoinAndSelect("appointment.administrators", "appointment_administrators")
            .leftJoinAndSelect("enrollment.additions", "enrollment_additions")
            .leftJoinAndSelect("appointment.creator", "appointment_creator")
            .select(["enrollment", "appointment", "appointment_administrators.mail", "appointment_creator.id", "enrollment_additions"])
            .getOne();
    }

    async create(enrollment: Enrollment, link: string) {
        const appointment: Appointment = await this.appointmentService.find(link);

        let enrollmentToDb = new Enrollment();

        if (enrollment.name === "" || enrollment.name === null) {
            throw new EmptyFieldsException('EMPTY_FIELDS', 'Please specify following values', ['name']);
        }

        if (await this.existsByName(enrollment.name, appointment)) {
            throw new EmptyFieldsException('DUPLICATE_ENTRY', 'Following values are already taken', ['name']);
        }

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

        enrollmentToDb.appointment = appointment;

        return this.enrollmentRepository.save(await enrollmentToDb)
    }

    async delete(id: string) {
        await getConnection()
            .createQueryBuilder()
            .delete()
            .from(Enrollment)
            .where("id = :id", {id: id['id']})
            .execute();
    }

    clear(enrollment: Enrollment) {
        if (enrollment.passenger !== null && enrollment.passenger !== undefined) {
            getConnection()
                .createQueryBuilder()
                .delete()
                .from(Passenger)
                .where("id = :id", {id: enrollment.passenger.id})
                .execute();
        }

        if (enrollment.driver !== null && enrollment.driver !== undefined) {
            getConnection()
                .createQueryBuilder()
                .delete()
                .from(Driver)
                .where("id = :id", {id: enrollment.driver.id})
                .execute();
        }
    }

    private async existsByName(name: string, appointment: Appointment) {
        return await this.enrollmentRepository.findOne({where: {name: name, appointment: appointment}}) !== undefined;
    }
}
