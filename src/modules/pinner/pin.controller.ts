import {Body, Controller, Delete, Head, HttpStatus, Post, Query, Res, UseGuards, UseInterceptors} from '@nestjs/common';
import {BusinessToHttpExceptionInterceptor} from '../../interceptor/BusinessToHttpException.interceptor';
import {PinService} from './pin.service';
import {AuthGuard} from '../../auth/auth.gurad';
import {Usr} from '../user/user.decorator';
import {JWT_User} from '../user/user.model';
import {Response} from 'express';
import {Appointment} from '../appointment/appointment.entity';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

@Controller('pins')
@UseInterceptors(BusinessToHttpExceptionInterceptor)
export class PinController {

    constructor(private pinService: PinService) {
    }

    @Head()
    @UseGuards(AuthGuard)
    hasPinned(@Usr() user: JWT_User,
              @Query('appointment') link: string,
              @Res() res: Response) {
        return this.pinService
            .hasPinnedAppointment(user, link)
            .then(
                () => {
                    res.status(HttpStatus.NO_CONTENT).json();
                }
            )
            .catch();
    }

    @Post()
    @UseGuards(AuthGuard)
    pinAppointment(@Usr() user: JWT_User,
                   @Body('appointment') appointment: Appointment,
                   @Res() res: Response) {
        return this.pinService
            .pinAppointment(user, appointment.link)
            .then(
                () => {
                    res.status(HttpStatus.NO_CONTENT).json();
                }
            )
            .catch(
                (e) => {
                    if (e instanceof EntityNotFoundException) {
                        throw new EntityNotFoundException(null, null, {
                            'body': 'appointment',
                            'attribute': 'link',
                            'in': 'body',
                            'value': appointment.link,
                            'message': 'Specified appointment does not exist'
                        });
                    }

                    throw e;
                }
            );
    }

    @Delete()
    @UseGuards(AuthGuard)
    unpinAppointment(@Usr() user: JWT_User,
                     @Query('appointment') link: string,
                     @Res() res: Response) {
        return this.pinService
            .unpinAppointment(user, link)
            .then(
                () => {
                    res.status(HttpStatus.NO_CONTENT).json();
                }
            )
            .catch(
                (e) => {
                    if (e instanceof EntityNotFoundException) {
                        throw new EntityNotFoundException(null, null, {
                            'attribute': 'appointment',
                            'in': 'query',
                            'value': link,
                            'message': 'Specified appointment does not exist'
                        });
                    }

                    throw e;
                }
            );
    }
}
