import {Injectable} from '@nestjs/common';
import {Appointment} from "./appointment.entity";
import {Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Addition} from "../addition/addition.entity";
import {File} from "../file/file.entity";
import {User} from "../user/user.entity";

@Injectable()
export class AppointmentService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(Addition)
        private readonly additionRepository: Repository<Addition>,
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>
    ) {
    }

    findAll(user: User): Promise<Appointment[]> {
        return this.appointmentRepository.find({relations: ["creator"], where: {creator: user}});
    }

    async find(link: string): Promise<Appointment> {
        return await this.appointmentRepository.findOne({
            where: {link: link['link']}
        })
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

        if (appointment.maxEnrollments === 0) {
            appointmentToDb.maxEnrollments = null;
        } else {
            appointmentToDb.maxEnrollments = appointment.maxEnrollments;
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

        appointmentToDb.additions = additionsToDb;

        let filesToDb = [];
        for (const fFile of appointment.files) {
            let _file: File = new File();
            _file.name = fFile.name;
            _file.data = fFile.data;

            const createdFile = await this.fileRepository.save(_file);
            filesToDb.push(createdFile);
        }

        appointmentToDb.files = filesToDb;

        return this.appointmentRepository.save(appointmentToDb);
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
