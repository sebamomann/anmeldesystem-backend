import {Injectable} from '@nestjs/common';
import {Passenger} from "./passenger.entity";
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

@Injectable()
export class PassengerService {

    constructor(@InjectRepository(Passenger)
                private readonly PassengerRepository: Repository<Passenger>) {

    }

    async findById(id: string) {
        return await this.PassengerRepository.findOne({where: {id: id}});
    }
}
