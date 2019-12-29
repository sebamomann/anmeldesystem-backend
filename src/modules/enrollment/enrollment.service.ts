import {Injectable} from '@nestjs/common';
import {Enrollment} from "./enrollment.entity";
import {Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Appointment} from "../appointment/appointment.entity";
import {AppointmentService} from "../appointment/appointment.service";

@Injectable()
export class EnrollmentService {
    constructor(@InjectRepository(Enrollment)
                private readonly enrollmentRepository: Repository<Enrollment>,
                private readonly appointmentService: AppointmentService) {

    }

    async find(id: string) {
        return await this.enrollmentRepository.findOne({where: {id: id['id']}});
    }

    async create(enrollment: Enrollment, link: string) {
        const appointment: Appointment = await this.appointmentService.find(link['link'].toString());

        let enrollmentToDb = new Enrollment();
        enrollmentToDb.name = enrollment.name;
        enrollmentToDb.comment = enrollment.comment;
        // enrollmentToDb.driver = enrollment.driver;
        // enrollmentToDb.passenger = enrollment.passenger;
        enrollmentToDb.appointment = appointment;

        return this.enrollmentRepository.save(enrollmentToDb);
    }

}
