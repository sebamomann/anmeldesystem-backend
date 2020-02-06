import {Controller, Get, Query, Res} from '@nestjs/common';
import {Response} from 'express';
import {IcalService} from "./ical.service";

var crypto = require('crypto');

@Controller('ical')
export class IcalController {

    constructor(private icalService: IcalService) {
    }

    @Get()
    async find(@Query('user') mail: string,
               @Query('token') token: string,
               @Res() res: Response) {
        this.icalService
            .get(mail, token)
            .then(val => {
                res.status(200).json(val);
            })
    }

    @Get('get')
    async get() {
        return crypto
            .createHash('sha256')
            .update("eca.cg-hh@sebamomann.de")
            .digest('base64');
    }
}
