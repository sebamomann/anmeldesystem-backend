import {Injectable} from '@nestjs/common';
import {Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {File} from './file.entity';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

@Injectable()
export class FileService {
    constructor(@InjectRepository(File)
                private fileRepository: Repository<File>) {
    }

    async findById(id: string) {
        const file = await this.fileRepository.findOne({
            where: {
                id: id
            }
        });

        if (file === undefined) {
            throw new EntityNotFoundException();
        }

        return file;
    }
}
