import {Body, Controller, Get, HttpStatus, Post, Res, UseGuards} from '@nestjs/common';
import {JwtOptStrategy} from '../../auth/jwt-opt.strategy';
import {Usr} from '../user/user.decorator';
import {User} from '../user/user.entity';
import {Response} from 'express';
import {PushService} from './push.service';

@Controller('push')
export class PushController {
    constructor(
        private pushService: PushService,
    ) {
    }

    @Post()
    @UseGuards(JwtOptStrategy)
    create(@Usr() user: User,
           @Body() obj: any,
           @Res() res: Response,) {
        return this.pushService
            .create(obj, user)
            .then(tEnrollment => {
                res.status(HttpStatus.OK).json(tEnrollment);
            })
            .catch((err) => {
                console.log(err, 'LOL');
            });
    }

    @Post('subscribe')
    @UseGuards(JwtOptStrategy)
    subscribeToAppointment(@Usr() user: User,
           @Body() obj: any,
           @Res() res: Response,) {
        return this.pushService
            .subscribeToAppointment(obj, user)
            .then(tEnrollment => {
                res.status(HttpStatus.OK).json(tEnrollment);
            })
            .catch((err) => {
                console.log(err, 'LOL');
            });
    }

    @Get()
    sendToAll() {
        this.pushService.sendToAll();
    }
}
