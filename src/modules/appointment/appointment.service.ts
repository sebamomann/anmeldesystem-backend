import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {Appointment} from "./appointment.entity";
import {getRepository, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Addition} from "../addition/addition.entity";
import {File} from "../file/file.entity";
import {User} from "../user/user.entity";
import {UnknownUsersException} from "../../exceptions/UnknownUsersException";
import {AdditionService} from "../addition/addition.service";
import {DuplicateValueException} from "../../exceptions/DuplicateValueException";
import {UserService} from "../user/user.service";
import {FileService} from "../file/file.service";

const crypto = require('crypto');

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
        private additionService: AdditionService,
        private userService: UserService,
        private fileService: FileService
    ) {
    }

    async hasPermission(link: string, user: User): Promise<boolean> {
        let appointment;
        try {
            appointment = await this.findBasic(link);
        } catch (e) {
            return false;
        }

        return appointment !== undefined && (appointment.creator.id === user.id || appointment.administrators.some(sAdministrator => {
            return sAdministrator.id === user.id;
        }));
    }

    async findAll(user: User, params: any, slim = false): Promise<Appointment[]> {
        let pins = [''];
        for (const queryKey of Object.keys(params)) {
            if (queryKey.startsWith("pin")) {
                pins.push(params[queryKey]);
            }
        }

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
            .leftJoinAndSelect("appointment.pinners", "pinners")
            .select(["appointment", "additions", "enrollments",
                "enrollment_passenger", "enrollment_driver", "enrollment_creator",
                "creator.username", "creator.name", "files", "administrators.username", "administrators.name",
                "enrollment_additions", "pinners"])
            .where("creator.id = :creatorId", {creatorId: user.id})
            .orWhere("administrators.id = :admin", {admin: user.id})
            .orWhere("enrollments.creatorId = :user", {user: user.id})
            .orWhere("pinners.id = :user", {user: user.id})
            .orWhere("appointment.link IN (:...links)", {links: pins})
            .orderBy("appointment.date", "DESC")
            .getMany();
        appointments.map(fAppointment => {
            if (user != null) {
                if (fAppointment.administrators !== undefined
                    && fAppointment.administrators.some(sAdministrator => sAdministrator.username === user.username)) {
                    fAppointment.reference.push("ADMIN")
                }

                if (fAppointment.creator.username === user.username) {
                    fAppointment.reference.push("CREATOR")
                }

                if (fAppointment.enrollments !== undefined
                    && fAppointment.enrollments.some(sEnrollment => {
                        return sEnrollment.creator != null
                            && sEnrollment.creator.id === user.id
                    })) {
                    fAppointment.reference.push("ENROLLED")
                }

                if (fAppointment.pinners !== undefined
                    && fAppointment.pinners.some(sPinner => sPinner.id === user.id)
                    || pins.includes(fAppointment.link)) {
                    fAppointment.reference.push("PINNED")
                }
            }

            fAppointment.enrollments.map(mEnrollments => {
                mEnrollments.createdByUser = mEnrollments.creator != null;
                delete mEnrollments.creator;
            });

            delete fAppointment.pinners;
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

    async find(link: string, user: User, permissions: any, slim: boolean = false): Promise<Appointment> {
        let appointment = await getRepository(Appointment)
            .createQueryBuilder("appointment")
            .where("appointment.link = :link", {link: link})
            .leftJoinAndSelect("appointment.creator", "creator")
            .leftJoinAndSelect("appointment.additions", "additions")
            .leftJoinAndSelect("appointment.enrollments", "enrollments")
            .leftJoinAndSelect("enrollments.creator", "enrollment_creator")
            .leftJoinAndSelect("enrollments.passenger", "enrollment_passenger")
            .leftJoinAndSelect("enrollments.driver", "enrollment_driver")
            .leftJoinAndSelect("enrollments.additions", "enrollment_additions")
            .leftJoinAndSelect("appointment.files", "files")
            .leftJoinAndSelect("appointment.administrators", "administrators")
            .leftJoinAndSelect("appointment.pinners", "pinners")
            .select(["appointment", "additions", "enrollments",
                "enrollment_passenger", "enrollment_driver", "enrollment_creator", "enrollments.iat",
                "creator.username", "creator.name", "files.name", "files.id", "administrators.name", "administrators.username",
                "enrollment_additions", "pinners"])
            .orderBy("enrollments.iat", "ASC")
            .getOne();

        if (appointment === undefined) {
            throw new NotFoundException();
        }

        if (appointment.pinners !== undefined
            && user != null
            && appointment.pinners.some(sPinner => sPinner.id === user.id)) {
            appointment.reference.push("PINNED")
        }

        if (slim) {
            delete appointment.files;
        }

        if (true) {
            let ids = [];
            let tokens = [];
            for (const queryKey of Object.keys(permissions)) {
                if (queryKey.startsWith("perm")) {
                    ids.push(permissions[queryKey]);
                }

                if (queryKey.startsWith("token")) {
                    tokens.push(permissions[queryKey]);
                }
            }

            let finalIds = [];
            ids.forEach((fId, i) => {
                const token = crypto.createHash('sha256')
                    .update(fId + process.env.SALT_ENROLLMENT)
                    .digest('base64');
                if (tokens[i] !== undefined && token === tokens[i]) {
                    finalIds.push(fId);
                }
            });

            appointment.enrollments = appointment.enrollments.filter(fEnrollment => {
                if (finalIds.includes(fEnrollment.id)) {
                    return fEnrollment;
                }
            })
        }

        appointment.enrollments.map(mEnrollment => {
            mEnrollment.createdByUser = mEnrollment.creator != null;
            delete mEnrollment.creator;
            return mEnrollment;
        });

        return appointment;
    }

    async pinAppointment(user: User, link: string) {
        const appointment = await this.find(link, user, null);
        const _user = await this.userService.findById("" + user.id);

        if (_user.pinned.some(sPinned => sPinned.id === appointment.id)) {
            const removeIndex = _user.pinned.indexOf(appointment);
            _user.pinned.splice(removeIndex, 1);
        } else {
            _user.pinned.push(appointment);
        }

        return this.userRepository.save(_user);
    }

    async findBasic(link: string): Promise<Appointment> {
        return await getRepository(Appointment)
            .createQueryBuilder("appointment")
            .where("appointment.link = :link", {link: link})
            .leftJoinAndSelect("appointment.additions", "additions")
            .leftJoinAndSelect("appointment.files", "files")
            .leftJoinAndSelect("appointment.administrators", "administrators")
            .leftJoinAndSelect("appointment.creator", "creator")
            .select(["appointment", "additions", "files.name", "files.id", "administrators", "creator"])
            .getOne();
    }

    async create(appointment: Appointment, user: User) {
        let appointmentToDb = new Appointment();
        appointmentToDb.title = appointment.title;
        appointmentToDb.description = appointment.description;

        if (appointment.link === null || appointment.link.length < 5) {
            let link;

            do {
                link = this.makeid(5);
            } while (await this.linkInUse(link));

            appointmentToDb.link = link;
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

    async update(toChange: any, link: string, user: User) {
        let appointment = await this.findBasic(link);

        if (!this.hasPermission(link, user)) {
            throw new ForbiddenException("FORBIDDEN");
        }

        for (const [key, value] of Object.entries(toChange)) {
            if (key in appointment && appointment[key] !== value) {
                let _value = value;
                if (key === "additions") {
                    _value = await this.handleAdditions(value, appointment);
                }
                if (key === "link") {
                    if (await this.linkInUse(value)) {
                        console.log("Link in use " + value);
                        throw new DuplicateValueException('DUPLICATE_ENTRY',
                            'Following values are already taken',
                            ['link']);
                    }
                    _value = value;
                }
                console.log(`${key} changed from ${JSON.stringify(appointment[key])} to ${JSON.stringify(_value)}`);

                appointment[key] = _value;
            }
        }

        await this.appointmentRepository.save(appointment);

        return await this.find(appointment.link, user, null);
    }


    private async handleAdditions(value, appointment: Appointment) {
        let additions = [];
        let _additions: { name: string }[];
        _additions = value;

        for (let fAddition of _additions) {
            let _addition = await this.additionService.findByNameAndAppointment(fAddition.name, appointment);
            if (_addition !== undefined) {
                additions.push(_addition);
            } else {
                _addition = new Addition();
                _addition.name = fAddition.name;
                await this.additionRepository.save(_addition);
                additions.push(_addition);
            }
        }

        return additions;
    }

    private async linkInUse(link) {
        return await this.findBasic(link) !== undefined;
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

    public async addAdministrator(link: string, username: string) {
        const appointment = await this.find(link, null, null);

        const user = await this.userService.findByUsername(username);
        if (user === undefined) {
            throw new BadRequestException('Username not found');
        }

        appointment.administrators.push(user);

        return this.appointmentRepository.save(appointment);
    }

    public async removeAdministrator(link: string, username: string) {
        const appointment = await this.find(link, null, null);

        appointment.administrators = appointment.administrators.filter(fAdministrator => {
            return fAdministrator.username != username;
        });

        return this.appointmentRepository.save(appointment);
    }

    public async addFile(link: string, data: any) {
        const appointment = await this.find(link, null, null);
        console.log("add file", data.name, data.data.length);

        const file = new File();
        file.name = data.name;
        file.data = data.data;
        const _file = await this.fileRepository.save(file);
        appointment.files.push(_file);

        return this.appointmentRepository.save(appointment);
    }

    async removeFile(link: string, id: string) {
        const file = await this.fileService.findById(id);
        return this.fileRepository.remove(file);
    }
}
