import {Injectable} from '@nestjs/common';
import {Addition} from './addition.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Appointment} from '../appointment/appointment.entity';

@Injectable()
export class AdditionService {

    constructor(@InjectRepository(Addition)
                private readonly additionRepository: Repository<Addition>) {

    }

    async findById(id: string) {
        return await this.additionRepository.findOne({where: {id: id}});
    }

    public async findByNameAndAppointment(name: string, appointment: Appointment) {
        return await this.additionRepository.findOne({
            where: {
                name: name,
                appointment: {
                    id: appointment.id
                }
            }
        });
    }
}
