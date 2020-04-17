import {Injectable} from '@nestjs/common';
import {Comment} from './comment.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {EnrollmentService} from '../enrollment.service';

@Injectable()
export class CommentService {

    constructor(@InjectRepository(Comment)
                private readonly commentRepository: Repository<Comment>,
                private enrollmentService: EnrollmentService) {
    }

    // private async findById(id: string) {
    //     let comment = await this.commentRepository.findOne({
    //         where: {id: id}
    //     });
    //
    //     if (comment === undefined) {
    //         throw new EntityNotFoundException(null, null, 'comment');
    //     }
    //
    //     return comment;
    // }

    /**
     * Create a comment that is connected to the passed enrollment.
     * The enrollment just needs to include its Id.
     *
     * @param comment Comment to add
     *
     * @param enrollmentId ID of Enrollment to add Comment to
     * @returns Comment Created Comment entity
     *
     * @throws See {@link findById} for reference
     */
    public async create(comment: Comment, enrollmentId: string) {
        let enrollment;

        try {
            enrollment = await this.enrollmentService.findById(enrollmentId);
        } catch (e) {
            throw e;
        }

        let commentToDb = new Comment();
        commentToDb.name = comment.name;
        commentToDb.comment = comment.comment;

        comment.enrollment = enrollment;

        return await this.commentRepository.save(comment);
    }
}
