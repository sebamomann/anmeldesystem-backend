import {Injectable} from '@nestjs/common';
import {Appointment} from "./appointment.entity";
import {Connection, getRepository, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Addition} from "../addition/addition.entity";
import {File} from "../file/file.entity";
import {User} from "../user/user.entity";
import {UnknownUsersException} from "../../exceptions/UnknownUsersException";

@Injectable()
export class AppointmentService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(Addition)
        private readonly additionRepository: Repository<Addition>,
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private connection: Connection
    ) {
    }

    async findAll(user: User, slim = false): Promise<Appointment[]> {
        let appointments = await getRepository(Appointment)
            .createQueryBuilder("appointment")
            .leftJoinAndSelect("appointment.creator", "creator")
            .leftJoinAndSelect("appointment.additions", "additions")
            .leftJoinAndSelect("appointment.enrollments", "enrollments")
            .leftJoinAndSelect("enrollments.passenger", "enrollment_passenger")
            .leftJoinAndSelect("enrollments.driver", "enrollment_driver")
            .leftJoinAndSelect("enrollments.additions", "enrollment_additions")
            .leftJoinAndSelect("enrollments.creator", "enrollment_creator")
            .leftJoinAndSelect("appointment.files", "files")
            .leftJoinAndSelect("appointment.administrators", "administrators")
            .select(["appointment", "additions", "enrollments",
                "enrollment_passenger", "enrollment_driver", "enrollment_creator",
                "creator.username", "files", "administrators.mail", "administrators.username",
                "enrollment_additions"])
            .where("creator.id = :creatorId", {creatorId: user.id})
            .orWhere("administrators.id = :admin", {admin: user.id})
            .orWhere("enrollments.creatorId = :user", {user: user.id})
            .orderBy("appointment.date", "DESC")
            .getMany();

        appointments.map(fAppointment => {
            fAppointment.enrollments.map(mEnrollments => {
                mEnrollments.createdByUser = mEnrollments.creator != null;
                delete mEnrollments.creator;
            })
        });

        if (slim) {
            appointments = appointments.map(fAppointment => {
                delete fAppointment.enrollments;
                delete fAppointment.files;
                return fAppointment;
            });
        }

        return appointments;
    }

    async find(link: string, slim: boolean = false): Promise<Appointment> {
        let appointment = await getRepository(Appointment)
            .createQueryBuilder("appointment")
            .where("appointment.link = :link", {link: link['link']})
            .leftJoinAndSelect("appointment.creator", "creator")
            .leftJoinAndSelect("appointment.additions", "additions")
            .leftJoinAndSelect("appointment.enrollments", "enrollments")
            .leftJoinAndSelect("enrollments.creator", "enrollment_creator")
            .leftJoinAndSelect("enrollments.passenger", "enrollment_passenger")
            .leftJoinAndSelect("enrollments.driver", "enrollment_driver")
            .leftJoinAndSelect("enrollments.additions", "enrollment_additions")
            .leftJoinAndSelect("appointment.files", "files")
            .leftJoinAndSelect("appointment.administrators", "administrators")
            .select(["appointment", "additions", "enrollments",
                "enrollment_passenger", "enrollment_driver", "enrollment_creator", "enrollments.iat",
                "creator.username", "files.name", "files.id", "administrators.mail",
                "enrollment_additions"])
            .orderBy("enrollments.iat", "ASC")
            .getOne();

        if (slim) {
            delete appointment.files;
        }

        appointment.enrollments.map(mEnrollment => {
            mEnrollment.createdByUser = mEnrollment.creator != null;
            delete mEnrollment.creator;
            return mEnrollment;
        });

        return appointment;
    }

    async create(appointment: Appointment, user: User) {
        let appointmentToDb = new Appointment();
        appointmentToDb.title = appointment.title;
        appointmentToDb.description = appointment.description;

        if (appointment.link === null || appointment.link.length < 5) {
            appointmentToDb.link = this.makeid(5);
        } else {
            appointmentToDb.link = appointment.link;
        }

        appointmentToDb.location = appointment.location;
        appointmentToDb.date = appointment.date;
        appointmentToDb.deadline = appointment.deadline;

        if (appointment.maxEnrollments > 0) {
            appointmentToDb.maxEnrollments = appointment.maxEnrollments;
        } else {
            appointmentToDb.maxEnrollments = null;
        }

        appointmentToDb.driverAddition = appointment.driverAddition;
        appointmentToDb.creator = user;

        let additionsToDb = [];
        for (const fAddition of appointment.additions) {
            let _addition: Addition = new Addition();
            _addition.name = fAddition.name;
            await this.additionRepository.save(_addition);
            additionsToDb.push(_addition);
        }

        // Administrators
        let faultyAdministratorMails = [];
        let administratorsToDb = [];
        for (const fAdmin of appointment.administrators) {
            const _user: User = await this.userRepository.findOne({where: {mail: fAdmin}});
            if (_user !== null && _user !== undefined) {
                administratorsToDb.push(_user);
            } else {
                faultyAdministratorMails.push(fAdmin);
            }
        }
        if (faultyAdministratorMails.length > 0) {
            throw new UnknownUsersException('NOT_FOUND', `Users not found by mail`, faultyAdministratorMails);
        }
        appointmentToDb.administrators = administratorsToDb;

        appointmentToDb.additions = additionsToDb;

        // Files
        let filesToDb = [];
        for (const fFile of appointment.files) {
            let _file: File = new File();
            _file.name = fFile.name;
            _file.data = fFile.data;

            const createdFile = await this.fileRepository.save(_file);
            filesToDb.push(createdFile);
        }

        appointmentToDb.files = filesToDb;

        return await this.appointmentRepository.save(appointmentToDb);
    }

    arrayBufferToBase64(buffer) {
        console.log(String.fromCharCode.apply(null, new Uint16Array(buffer)));
        return String.fromCharCode.apply(null, new Uint16Array(buffer));
    }

    makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }


}
