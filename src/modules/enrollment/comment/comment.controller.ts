import {Body, Controller, HttpStatus, Post, Query, Res} from '@nestjs/common';
import {Response} from "express";
import {CommentService} from "./comment.service";
import {Comment} from "./comment.entity";

@Controller('comment')
export class CommentController {

    constructor(private commentService: CommentService) {

    }

    @Post()
    async create(@Query() id: string, @Body() comment: Comment, @Res() res: Response) {
        this.commentService.create(comment, id).then(response => {
            delete response.enrollment;
            res.status(HttpStatus.CREATED).json(response);
        }).catch(err => {
            console.log(err);
            res.status(HttpStatus.BAD_REQUEST).json({error: {message: "Some error occurred. Please try again later or contact the support"}})
        });
    }
}
