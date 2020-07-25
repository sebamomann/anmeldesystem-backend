import {Injectable} from '@nestjs/common';
import {Addition} from './addition.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Appointment} from '../appointment/appointment.entity';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

@Injectable()
export class AdditionService {
    constructor(@InjectRepository(Addition)
                private readonly additionRepository: Repository<Addition>) {
    }

    public async __save(addition: any) {
        return await this.additionRepository.save(addition);
    }

    /* istanbul ignore next */
    public async findById(id: string) {
        let addition = await this.additionRepository.findOne({
            where: {
                id: id
            }
        });

        if (addition === undefined) {
            throw new EntityNotFoundException(null, null, 'addition');
        }

        return addition;
    }

    public async findByNameAndAppointment(name: string, appointment: Appointment) {
        let addition = await this.additionRepository.findOne({
            where: {
                name: name,
                appointment: {
                    id: appointment.id
                }
            }
        });

        if (addition === undefined) {
            throw new EntityNotFoundException(null, null, 'addition');
        }

        return addition;
    }
}
