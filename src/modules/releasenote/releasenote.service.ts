import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Releasenote} from "./releasenote.entity";

@Injectable()
export class ReleasenoteService {

    constructor(@InjectRepository(Releasenote)
                private readonly releasenoteRepository: Repository<Releasenote>,) {
    }

    async findAll() {
        return await this.releasenoteRepository
            .createQueryBuilder('releasenote')
            .select('releasenote')
            .orderBy("releasenote.iat", "DESC")
            .getMany();
    }
}
