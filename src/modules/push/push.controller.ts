import {Body, Controller, Get, Head, HttpStatus, NotFoundException, Post, Query, Res, UseGuards} from '@nestjs/common';
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
                throw err;
            });
    }

    @Post('subscribe')
    @UseGuards(JwtOptStrategy)
    subscribeToAppointment(@Usr() user: User,
                           @Body() obj: any,
                           @Res() res: Response,) {
        return this.pushService
            .subscribeToAppointment(obj, user)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch((err) => {
                throw err;
            });
    }

    @Post('unsubscribe')
    @UseGuards(JwtOptStrategy)
    unsubscribeFromAppointment(@Usr() user: User,
                               @Body() obj: any,
                               @Res() res: Response,) {
        return this.pushService
            .unsubscribeFromAppointment(obj, user)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch((err) => {
                throw err;
            });
    }

    @Head('subscription')
    @UseGuards(JwtOptStrategy)
    isSubscribed(@Usr() user: User,
                 @Query('link') link: string,
                 @Query('endpoint') endpoint: string,
                 @Res() res: Response,) {
        return this.pushService
            .isSubscribed(endpoint, link, user)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch((err) => {
                console.log(err);
                throw new NotFoundException();
            });
    }

    @Get()
    sendToAll() {
        this.pushService.sendToAll();
    }
}
