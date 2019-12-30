import {Injectable} from '@nestjs/common';
import {Driver} from "./driver.entity";
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

@Injectable()
export class DriverService {

    constructor(@InjectRepository(Driver)
                private readonly DriverRepository: Repository<Driver>) {

    }

    async findById(id: string) {
        return await this.DriverRepository.findOne({where: {id: id}});
    }
}
