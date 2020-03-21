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
import {Mail} from "./mail/mail.entity";
import {MailerService} from "@nest-modules/mailer";
import {InvalidValueException} from "../../exceptions/InvalidValueException";

const crypto = require("crypto");

@Injectable()
export class EnrollmentService {
    constructor(@InjectRepository(Enrollment)
                private readonly enrollmentRepository: Repository<Enrollment>,
                private readonly appointmentService: AppointmentService,
                private readonly additionService: AdditionService,
                private readonly passengerService: PassengerService,
                private readonly driverService: DriverService,
                private readonly mailerService: MailerService,
                @InjectRepository(Driver)
                private readonly driverRepository: Repository<Driver>,
                @InjectRepository(Passenger)
                private readonly passengerRepository: Repository<Passenger>,
                @InjectRepository(Key)
                private readonly keyRepository: Repository<Key>,
                @InjectRepository(Mail)
                private readonly mailRepository: Repository<Mail>) {

    }

    public static allowEditByToken(enrollment: Enrollment, token: string) {
        const check = crypto.createHash('sha256')
            .update(enrollment.id + process.env.SALT_ENROLLMENT)
            .digest('hex');

        return enrollment.token !== null && (token.replace(" ", "+") === check);
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

    private static checkForEmptyValues(enrollment: Enrollment, user: User, isEdit = false) {
        let emptyValues = [];
        if (enrollment.name === "" || enrollment.name === null) {
            emptyValues.push('name');
        }
        if (!!user === false && ((enrollment.editMail == "" || enrollment.editMail == null) && !isEdit)) {
            emptyValues.push('mail');
        }
        if (emptyValues.length > 0) {
            throw  new EmptyFieldsException('EMPTY_FIELDS', 'Please specify following values', emptyValues);
        }
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
            } else if (enrollment.passenger !== null && enrollment.driver !== undefined) {
                enrollmentToDb.passenger = await this.handlePassengerRelation(enrollment);
                enrollmentToDb.driver = null;
            } else {
                throw new EmptyFieldsException('EMPTY_FIELDS', 'Please specify one of the following values', ["driver", "passenger"]);
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

        if (enrollment.passenger.requirement === undefined) {
            throw new EmptyFieldsException("EMPTY_FIELDS", "Please specify following values", ["passenger_requirement"]);
        }
        passenger.requirement = enrollment.passenger.requirement;

        return await this.passengerRepository.save(passenger);
    }

    private async handleDriverRelation(enrollment: Enrollment) {
        let driver: Driver = new Driver();
        const _driver = await this.driverService.findByEnrollment(enrollment);
        if (_driver !== undefined && _driver != null) {
            driver = _driver;
        }

        let emptyFields = [];
        if (enrollment.driver.seats === undefined) {
            emptyFields.push("driver_seats");
        }
        if (enrollment.driver.service === undefined) {
            emptyFields.push("driver_service");
        }

        if (emptyFields.length > 0) {
            throw new EmptyFieldsException("EMPTY_FIELDS", "Please specify following values", emptyFields);
        }

        if (enrollment.driver.seats <= 0) {
            throw new InvalidValueException("INVALID_VALUE", "Minimum of 1 needed", ["driver_seats"]);
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

    async delete(id: string, token: string, user: User) {
        const enrollment: Enrollment = await this.find(id);

        if (!EnrollmentService.allowedToEdit(enrollment, user, token)) {
            throw new Error();
        }

        await getConnection()
            .createQueryBuilder()
            .delete()
            .from(Enrollment)
            .where("id = :id", {id: id['id']})
            .execute();
    }

    // UTIL
    private static allowedToEdit(enrollment: Enrollment, user: User, token: string) {
        let allowEditByUserId = EnrollmentService.allowEditByUserId(enrollment, user);
        let isAllowedByKey = EnrollmentService.allowEditByToken(enrollment, token);

        return (allowEditByUserId
            || isAllowedByKey)
    }

    async create(enrollment: Enrollment, link: string, user: User, domain: string, asquery: string) {
        const appointment: Appointment = await this.appointmentService.find(link, user, null);

        try {
            EnrollmentService.checkForEmptyValues(enrollment, user);
        } catch (e) {
            throw e;
        }

        if (await this.existsByName(enrollment.name, appointment)) {
            throw new DuplicateValueException('DUPLICATE_ENTRY', 'Following values are already taken', ['name']);
        }
        enrollment.id = "";
        let enrollmentToDb = await this.createEnrollmentObjectForDB(enrollment, appointment);

        if (enrollment.editMail != null &&
            enrollment.editMail != "") {
            const mail = new Mail();
            mail.mail = enrollment.editMail;
            enrollmentToDb.mail = await this.mailRepository.save(mail);
        } else {
            enrollmentToDb.creator = user;
        }

        enrollmentToDb.appointment = appointment;

        const savedEnrollment = await this.enrollmentRepository.save(enrollmentToDb);
        delete savedEnrollment.appointment;

        if (savedEnrollment.creator === null ||
            savedEnrollment.creator === undefined) {
            savedEnrollment.token = crypto.createHash('sha256')
                .update(savedEnrollment.id + process.env.SALT_ENROLLMENT)
                .digest('hex');

            let url = `https://${domain}`;
            if (asquery === "true") {
                url += `&e=${savedEnrollment.id}&t=${savedEnrollment.token}`;
            } else {
                url += `/${savedEnrollment.id}/${savedEnrollment.token}`;
            }

            this.mailerService
                .sendMail({
                    to: enrollmentToDb.mail.mail,
                    from: process.env.MAIL_ECA,
                    subject: 'Deine Anmeldung zu ' + appointment.title,
                    template: 'enroll', // The `.pug` or `.hbs` extension is appended automatically.
                    context: {  // Data to be sent to template engine.
                        title: appointment.title,
                        name: savedEnrollment.name,
                        url: url
                    },
                })
                .then(() => {
                })
                .catch((err) => {
                    console.log(err);
                });

        }


        return savedEnrollment;
    }

    public static allowEditByUserId(enrollment: Enrollment, user: User) {
        let isAppointmentCreator = (enrollment.appointment.creator !== null
            && user.id === enrollment.appointment.creator.id);
        let isAppointmentAdministrator = (enrollment.appointment.administrators !== null
            && enrollment.appointment.administrators.some(iAdministrators => {
                return iAdministrators.mail === user.mail
            }));
        let isEnrollmentCreator = (enrollment.creator !== null
            && enrollment.creator.id === user.id);

        return isAppointmentCreator || isAppointmentAdministrator || isEnrollmentCreator;
    }

    async update(id: string, enrollment: Enrollment, user: User) {
        try {
            EnrollmentService.checkForEmptyValues(enrollment, user, true);
        } catch (e) {
            console.log("Empty Values");
            throw e;
        }

        const enrollmentFromDb: Enrollment = await this.find(id);
        const appointment: Appointment = enrollmentFromDb.appointment;

        if (!EnrollmentService.allowedToEdit(enrollmentFromDb, user, enrollment.token)) {
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

        return await this.enrollmentRepository.save(enrollmentToDb);
    }
}
