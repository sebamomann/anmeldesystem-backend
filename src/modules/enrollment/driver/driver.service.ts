import {Injectable} from '@nestjs/common';
import {Driver} from './driver.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Enrollment} from '../enrollment.entity';
import {EntityNotFoundException} from '../../../exceptions/EntityNotFoundException';

@Injectable()
export class DriverService {

    constructor(@InjectRepository(Driver)
                private readonly driverRepository: Repository<Driver>) {
    }

    public async __save(driver: Driver) {
        return await this.driverRepository.save(driver);
    }

    // public async findById(id: string) {
    //     return await this.driverRepository.findOne({
    //         where: {
    //             id: id
    //         }
    //     });
    // }

    public async findByEnrollment(enrollment: Enrollment) {
        let driver = await this.driverRepository.findOne({
            where: {
                enrollment: {
                    id: enrollment.id
                }
            }
        });

        if (driver === undefined) {
            throw new EntityNotFoundException(null, null, 'driver');
        }

        return driver;
    }
}
