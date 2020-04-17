import {Body, Controller, HttpStatus, Post, Query, Res, UseInterceptors} from '@nestjs/common';
import {Response} from 'express';
import {CommentService} from './comment.service';
import {Comment} from './comment.entity';
import {BusinessToHttpExceptionInterceptor} from '../../../interceptor/BusinessToHttpException.interceptor';

@Controller('comment')
@UseInterceptors(BusinessToHttpExceptionInterceptor)
export class CommentController {

    constructor(private commentService: CommentService) {
    }

    @Post()
    async create(@Query('enrollmentId') enrollmentId: string,
                 @Body() comment: Comment,
                 @Res() res: Response) {
        return this.commentService
            .create(comment, enrollmentId)
            .then(result => {
                res.status(HttpStatus.CREATED).json(result);
            })
            .catch(err => {
                throw err;
            });
    }
}
