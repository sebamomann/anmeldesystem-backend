import {Injectable} from '@nestjs/common';
import {Comment} from "./comment.entity";
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Enrollment} from "../enrollment.entity";
import {EnrollmentService} from "../enrollment.service";

@Injectable()
export class CommentService {

    constructor(@InjectRepository(Comment)
                private readonly commentRepository: Repository<Comment>,
                private enrollmentService: EnrollmentService) {

    }

    async findById(id: string) {
        return await this.commentRepository.findOne({where: {id: id}});
    }

    async create(comment: Comment, id: string) {
        const enrollment: Enrollment = await this.enrollmentService.find(id);

        let commentToDb = new Comment();
        commentToDb.name = comment.name;
        commentToDb.comment = comment.comment;

        comment.enrollment = enrollment;

        return this.commentRepository.save(comment);
    }
}
