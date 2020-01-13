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
import {PassengerService} from "./passenger/passenger.service";
import {DriverService} from "./driver/driver.service";

@Injectable()
export class EnrollmentService {
    constructor(@InjectRepository(Enrollment)
                private readonly enrollmentRepository: Repository<Enrollment>,
                private readonly appointmentService: AppointmentService,
                private readonly additionService: AdditionService,
                private readonly passengerService: PassengerService,
                private readonly driverService: DriverService,
                @InjectRepository(Driver)
                private readonly driverRepository: Repository<Driver>,
                @InjectRepository(Passenger)
                private readonly passengerRepository: Repository<Passenger>,
                @InjectRepository(Key)
                private readonly keyRepository: Repository<Key>) {

    }

    private static checkForEmptyValues(enrollment: Enrollment, user: User) {
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
    }

    async find(id: string) {
        return getRepository(Enrollment)
            .createQueryBuilder("enrollment")
            .where("enrollment.id = :id", {id: id['id']})
            .leftJoinAndSelect("enrollment.appointment", "appointment")
            .leftJoinAndSelect("enrollment.creator", "enrollment_creator")
            .leftJoinAndSelect("enrollment.key", "enrollment_key")
            .leftJoinAndSelect("enrollment.additions", "enrollment_additions")
            .leftJoinAndSelect("appointment.administrators", "appointment_administrators")
            .leftJoinAndSelect("appointment.additions", "appointment_additions")
            .leftJoinAndSelect("appointment.creator", "appointment_creator")
            .select(["enrollment", "enrollment_creator", "enrollment_key",
                "appointment", "appointment_administrators.mail",
                "appointment_creator.id", "enrollment_additions", "appointment_additions"])
            .getOne();
    }

    async create(enrollment: Enrollment, link: string, user: User) {
        const appointment: Appointment = await this.appointmentService.find(link);

        try {
            EnrollmentService.checkForEmptyValues(enrollment, user);
        } catch (e) {
            throw e;
        }

        if (await this.existsByName(enrollment.name, appointment)) {
            throw new DuplicateValueException('DUPLICATE_ENTRY', 'Following values are already taken', ['name']);
        }

        let enrollmentToDb = await this.createEnrollmentObjectForDB(enrollment, appointment);

        // If user is not set
        if (enrollment.editKey != null && enrollment.editKey != "") {
            const key = new Key();
            key.key = enrollment.editKey;
            enrollmentToDb.key = await this.keyRepository.save(key);
        } else if (!!user === false) {
            enrollmentToDb.creator = user;
        } else {
            throw  new EmptyFieldsException('EMPTY_FIELDS', 'Please specify following values', ['key']);
        }

        enrollmentToDb.appointment = appointment;

        return this.enrollmentRepository.save(await enrollmentToDb)
    }

    private async createEnrollmentObjectForDB(enrollment: Enrollment, appointment: Appointment) {
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
            if (enrollment.driver !== null && enrollment.driver !== undefined) {
                enrollmentToDb.driver = await this.handleDriverRelation(enrollment);
                enrollmentToDb.passenger = null;
            } else {
                enrollmentToDb.passenger = await this.handlePassengerRelation(enrollment);
                enrollmentToDb.driver = null;
            }
        }

        return enrollmentToDb;
    }

    private async handlePassengerRelation(enrollment: Enrollment) {
        let passenger: Passenger = new Passenger();
        const _passenger = await this.passengerService.findByEnrollment(enrollment);
        if (_passenger !== undefined) {
            passenger = _passenger;
        }

        passenger.requirement = enrollment.passenger.requirement;

        return await this.passengerRepository.save(passenger);
    }

    private async handleDriverRelation(enrollment: Enrollment) {
        let driver: Driver = new Driver();
        const _driver = await this.driverService.findByEnrollment(enrollment);
        if (_driver !== undefined) {
            driver = _driver;
        }

        driver.seats = enrollment.driver.seats;
        driver.service = enrollment.driver.service;

        return await this.driverRepository.save(driver);
    }

    private async existsByName(name: string, appointment: Appointment) {
        return await this.enrollmentRepository.findOne({
            where:
                {
                    name: name,
                    appointment: appointment
                }
        }) !== undefined;
    }

    async delete(id: string, key: string, user: User) {
        const enrollment: Enrollment = await this.find(id);

        if (!EnrollmentService.allowedToEdit(enrollment, user, key)) {
            throw new Error();
        }

        await getConnection()
            .createQueryBuilder()
            .delete()
            .from(Enrollment)
            .where("id = :id", {id: id['id']})
            .execute();
    }

    async update(id: string, enrollment: Enrollment, user: User) {
        try {
            EnrollmentService.checkForEmptyValues(enrollment, user);
        } catch (e) {
            console.log("Empty Values");
            throw e;
        }

        const enrollmentFromDb: Enrollment = await this.find(id);
        const appointment: Appointment = enrollmentFromDb.appointment;

        if (!EnrollmentService.allowedToEdit(enrollmentFromDb, user, enrollment.editKey)) {
            console.log("No edit allowed");
            throw new Error();
        }

        if (enrollmentFromDb.name != enrollment.name) {
            if (await this.existsByName(enrollment.name, appointment)) {
                throw new DuplicateValueException('DUPLICATE_ENTRY',
                    'Following values are already taken',
                    ['name']);
            }
        }


        let enrollmentToDb = await this.createEnrollmentObjectForDB(enrollment, appointment);
        enrollmentToDb.id = enrollmentFromDb.id;
        if (enrollmentFromDb.creator != null) {
            enrollmentToDb.creator = enrollmentFromDb.creator;
        }
        if (enrollmentFromDb.key != null) {
            enrollmentToDb.key = enrollmentFromDb.key;
        }

        await this.enrollmentRepository.save(enrollmentToDb);
    }


    public static allowEditByKey(enrollment: Enrollment, key: string) {
        return enrollment.key !== null && key !== undefined
            && (key === enrollment.key.key);
    }

    public static allowEditByUserId(enrollment: Enrollment, user: User) {
        console.log(enrollment);
        let isAppointmentCreator = (enrollment.appointment.creator !== null
            && user.id === enrollment.appointment.creator.id);
        console.log(enrollment.appointment.administrators);
        let isAppointmentAdministrator = (enrollment.appointment.administrators !== null
            && enrollment.appointment.administrators.some(iAdministrators => {
                return iAdministrators.mail === user.mail
            }));
        let isEnrollmentCreator = (enrollment.creator !== null
            && enrollment.creator.id === user.id);

        return isAppointmentCreator || isAppointmentAdministrator || isEnrollmentCreator;
    }

    // UTIL
    private static allowedToEdit(enrollment: Enrollment, user: User, key: string) {
        let allowEditByUserId = EnrollmentService.allowEditByUserId(enrollment, user);
        let isAllowedByKey = EnrollmentService.allowEditByKey(enrollment, key);

        return (allowEditByUserId
            || isAllowedByKey)
    }
}
