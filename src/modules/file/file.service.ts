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

    public async __save(file: File) {
        return await this.fileRepository.save(file);
    }

    public async __remove(file: any) {
        return await this.fileRepository.remove(file);
    }

    async findById(id: string) {
        const file = await this.fileRepository.findOne({
            where: {
                id: id
            }
        });

        if (file === undefined) {
            throw new EntityNotFoundException(null, null, 'file');
        }

        return file;
    }
}
