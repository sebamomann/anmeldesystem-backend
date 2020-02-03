import {Injectable} from '@nestjs/common';
import {Driver} from "./driver.entity";
import {InjectRepository} from '@nestjs/typeorm';
import {getRepository, Repository} from 'typeorm';
import {Enrollment} from "../enrollment.entity";

@Injectable()
export class DriverService {

    constructor(@InjectRepository(Driver)
                private readonly DriverRepository: Repository<Driver>) {

    }

    async findById(id: string) {
        return await this.DriverRepository.findOne({where: {id: id}});
    }

    async findByEnrollment(enrollment: Enrollment) {
        return await getRepository(Driver)
            .createQueryBuilder('driver')
            .leftJoinAndSelect("driver.enrollment", "enrollment")
            .where("enrollment.id = :enrollmentId", {enrollmentId: enrollment.id})
            .select('driver')
            .getOne();
    }
}
