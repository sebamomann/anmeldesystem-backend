import {Injectable} from '@nestjs/common';
import {DeleteResult, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {File} from './file.entity';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

@Injectable()
export class FileService {
    constructor(@InjectRepository(File)
                private fileRepository: Repository<File>) {
    }

    public async save(file: File) {
        return await this.fileRepository.save(file);
    }


    public async delete(id: string): Promise<DeleteResult> {
        return await this.fileRepository.delete({id});
    }

    public async __remove(file: any) {
        return await this.fileRepository.remove(file);
    }

    async findById(id: string, includeData = false) {
        let obj: any = {
            where: {
                id: id
            }
        };

        if (includeData) {
            obj.select = ['data', 'id', 'name'];
        }

        const file = await this.fileRepository.findOne(obj);

        if (file === undefined) {
            throw new EntityNotFoundException(null, null, 'file');
        }

        console.log(file);

        return file;
    }
}
