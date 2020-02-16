import {Injectable} from '@nestjs/common';
import {getRepository, Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";
import {File} from "./file.entity";

@Injectable()
export class FileService {
    constructor(@InjectRepository(File)
                private fileRepository: Repository<File>) {
    }

    async findById(id: string) {
        return await getRepository(File)
            .createQueryBuilder("file")
            .where("file.id = :id", {id: id})
            .getOne();
    }
}
