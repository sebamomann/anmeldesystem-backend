import {Injectable} from '@nestjs/common';
import {Appointment} from "./appointment.entity";
import {Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Addition} from "../addition/addition.entity";

@Injectable()
export class AppointmentService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(Addition)
        private readonly additionRepository: Repository<Addition>
    ) {
    }

    findAll(): Promise<Appointment[]> {
        return this.appointmentRepository.find();
    }

    async find(link: string): Promise<Appointment> {
        return await this.appointmentRepository.findOne({
            where: {link: link['link']}
        })
    }

    async create(appointment: Appointment) {
        let appointmentToDb = new Appointment();
        appointmentToDb.title = appointment.title;
        appointmentToDb.description = appointment.description;
        appointmentToDb.link = appointment.link;
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

        return this.appointmentRepository.save(appointmentToDb);
    }
}
