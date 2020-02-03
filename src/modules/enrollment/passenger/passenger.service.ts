import {Injectable} from '@nestjs/common';
import {Passenger} from "./passenger.entity";
import {InjectRepository} from '@nestjs/typeorm';
import {getRepository, Repository} from 'typeorm';
import {Enrollment} from "../enrollment.entity";

@Injectable()
export class PassengerService {

    constructor(@InjectRepository(Passenger)
                private readonly PassengerRepository: Repository<Passenger>) {

    }

    async findById(id: string) {
        return await this.PassengerRepository.findOne({where: {id: id}});
    }

    async findByEnrollment(enrollment: Enrollment) {
        return await getRepository(Passenger)
            .createQueryBuilder('passenger')
            .leftJoinAndSelect("passenger.enrollment", "enrollment")
            .where("enrollment.id = :enrollmentId", {enrollmentId: enrollment.id})
            .select('passenger')
            .getOne();
    }
}
