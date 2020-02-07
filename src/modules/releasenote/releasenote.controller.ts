import {Controller, Get, HttpStatus, Res} from '@nestjs/common';
import {ReleasenoteService} from "./releasenote.service";
import {Response} from "express";

@Controller('releasenote')
export class ReleasenoteController {
    constructor(private releasenoteService: ReleasenoteService) {
    }

    @Get()
    findAll(@Res() res: Response) {
        return this.releasenoteService
            .findAll()
            .then(val => {
                return res.status(HttpStatus.OK).json(val);
            })
            .catch(err => {
                console.log(err);
                return res.status(HttpStatus.BAD_REQUEST);
            });
    }

}
