import {Injectable} from '@nestjs/common';
import {Appointment} from "./appointment.entity";
import {Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';

@Injectable()
export class AppointmentService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
    ) {
    }

    findAll(): Promise<Appointment[]> {
        return this.appointmentRepository.find();
    }

    async find(link: string) {
        return await this.appointmentRepository.findOne({where: {link: link}});
    }

    create(appointment: Appointment) {
        let appointmentToDb = new Appointment();
        appointmentToDb.title = appointment.title;
        appointmentToDb.description = appointment.description;
        appointmentToDb.link = appointment.link;
        appointmentToDb.location = appointment.location;
        appointmentToDb.date = appointment.date;
        appointmentToDb.deadline = appointment.deadline;
        appointmentToDb.maxEnrollments = appointment.maxEnrollments;
        appointmentToDb.driverAddition = appointment.driverAddition;

        return this.appointmentRepository.save(appointmentToDb);
    }
}
