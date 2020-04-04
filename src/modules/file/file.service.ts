import {Injectable} from '@nestjs/common';
import {getRepository, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {File} from './file.entity';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

@Injectable()
export class FileService {
    constructor(@InjectRepository(File)
                private fileRepository: Repository<File>) {
    }

    async findById(id: string) {
        const file = await getRepository(File)
            .createQueryBuilder('file')
            .where('file.id = :id', {id: id})
            .getOne();

        if (file === undefined) {
            throw new EntityNotFoundException();
        }
    }
}
