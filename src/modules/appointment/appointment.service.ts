import {Injectable} from '@nestjs/common';
import {Appointment} from "./appointment.entity";
import {Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Addition} from "../addition/addition.entity";
import {File} from "../file/file.entity";

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

    findAll(): Promise<Appointment[]> {
        return this.appointmentRepository.find();
    }

    async find(link: string): Promise<Appointment> {
        return await this.appointmentRepository.findOne({
            where: {link: link}
        })
    }

    async create(appointment: Appointment) {
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
        appointmentToDb.maxEnrollments = appointment.maxEnrollments;
        appointmentToDb.driverAddition = appointment.driverAddition;

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
            await this.fileRepository.save(_file);
            filesToDb.push(_file);
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
