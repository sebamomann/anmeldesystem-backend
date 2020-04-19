import {Controller, Get, HttpStatus, Res} from '@nestjs/common';
import {ReleasenoteService} from './releasenote.service';
import {Response} from 'express';

@Controller('releasenote')
export class ReleasenoteController {
    constructor(private releasenoteService: ReleasenoteService) {
    }

    @Get()
    find(@Res() res: Response) {
        return this.releasenoteService
            .find()
            .then(val => {
                res.status(HttpStatus.OK).json(val);
            })
            .catch((err) => {
                throw err;
            });
    }
}
