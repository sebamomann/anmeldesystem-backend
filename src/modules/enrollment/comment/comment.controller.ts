import {Controller, UseInterceptors} from '@nestjs/common';
import {CommentService} from './comment.service';
import {BusinessToHttpExceptionInterceptor} from '../../../interceptor/BusinessToHttpException.interceptor';

@Controller('comment')
@UseInterceptors(BusinessToHttpExceptionInterceptor)
export class CommentController {

    constructor(private commentService: CommentService) {
    }

    // @Post()
    // async create(@Body() comment: Comment,
    //              @Res() res: Response) {
    //     return this.commentService
    //         .create(comment)
    //         .then(result => {
    //             res.status(HttpStatus.CREATED).json(result);
    //         })
    //         .catch(err => {
    //             throw err;
    //         });
    // }
}
