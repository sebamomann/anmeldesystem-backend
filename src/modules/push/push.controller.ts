import {Body, Controller, Get, Head, HttpStatus, NotFoundException, Post, Query, Res, UseGuards} from '@nestjs/common';
import {Usr} from '../user/user.decorator';
import {Response} from 'express';
import {PushService} from './push.service';
import {AuthOptGuard} from '../../auth/auth-opt.gurad';
import {JWT_User} from '../user/user.model';

@Controller('push')
export class PushController {
    constructor(
        private pushService: PushService,
    ) {
    }

    @Post()
    @UseGuards(AuthOptGuard)
    create(@Usr() user: JWT_User,
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
    @UseGuards(AuthOptGuard)
    subscribeToAppointment(@Usr() user: JWT_User,
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
    @UseGuards(AuthOptGuard)
    unsubscribeFromAppointment(@Usr() user: JWT_User,
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
    @UseGuards(AuthOptGuard)
    isSubscribed(@Usr() user: JWT_User,
                 @Query('link') link: string,
                 @Query('endpoint') endpoint: string,
                 @Res() res: Response,) {
        return this.pushService
            .isSubscribed(endpoint, link, user)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch((err) => {
                throw new NotFoundException();
            });
    }

    @Get()
    sendToAll() {
        this.pushService.sendToAll();
    }
}
