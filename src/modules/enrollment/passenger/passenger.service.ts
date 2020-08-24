import {Injectable} from '@nestjs/common';
import {Passenger} from './passenger.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Enrollment} from '../enrollment.entity';
import {EntityNotFoundException} from '../../../exceptions/EntityNotFoundException';

@Injectable()
export class PassengerService {

    constructor(@InjectRepository(Passenger)
                private readonly passengerRepository: Repository<Passenger>) {

    }

    public async __save(passenger: Passenger) {
        return await this.passengerRepository.save(passenger);
    }

    // public async findById(id: string) {
    //     return await this.passengerRepository.findOne({
    //         where: {
    //             id: id
    //         }
    //     });
    // }

    public async findByEnrollment(enrollment: Enrollment) {
        let passenger = await this.passengerRepository.findOne({
            where: {
                enrollment: {
                    id: enrollment.id
                }
            }
        });

        if (passenger === undefined) {
            throw new EntityNotFoundException(null, null, 'passenger');
        }

        return passenger;
    }
}
