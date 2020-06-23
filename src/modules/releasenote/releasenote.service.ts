import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Releasenote} from './releasenote.entity';

@Injectable()
export class ReleasenoteService {

    constructor(@InjectRepository(Releasenote)
                private readonly releasenoteRepository: Repository<Releasenote>,) {
    }

    /**
     * Return all releasenotes
     *
     * @returns Releasenote[]
     */
    public async find() {
        return await this.releasenoteRepository.find({
            order: {
                iat: 'DESC'
            }
        });
    }
}
