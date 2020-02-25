import {Injectable} from '@nestjs/common';
import {Addition} from "./addition.entity";
import {InjectRepository} from '@nestjs/typeorm';
import {getRepository, Repository} from 'typeorm';
import {Appointment} from "../appointment/appointment.entity";

@Injectable()
export class AdditionService {

    constructor(@InjectRepository(Addition)
                private readonly additionRepository: Repository<Addition>) {

    }

    async findById(id: string) {
        return await this.additionRepository.findOne({where: {id: id}});
    }

    public async findByNameAndAppointment(name: string, appointment: Appointment) {
        console.log("where " + name);
        return getRepository(Addition)
            .createQueryBuilder("addition")
            .where("addition.name = :name", {name: name})
            .andWhere("addition.appointmentId = :appointmentId", {appointmentId: appointment.id})
            .select(["addition"])
            .getOne();
    }
}
