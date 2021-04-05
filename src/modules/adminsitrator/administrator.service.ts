import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Administrator} from './administrator.entity';
import {Appointment} from '../appointment/appointment.entity';

@Injectable()
export class AdministratorService {
    constructor(@InjectRepository(Administrator)
                private readonly administratorRepository: Repository<Administrator>) {
    }

    public async save(administrator: Administrator) {
        return await this.administratorRepository.save(administrator);
    }

    public async deleteAdministratorByUserIdAndAppointment(userId: string, appointment: Appointment) {
        return await this.administratorRepository
            .delete(
            {
                userId: userId,
                appointment: appointment
            }
        );
    }
}
