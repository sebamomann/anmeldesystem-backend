import {Body, Controller, Delete, HttpStatus, Param, Post, Query, Res, UseGuards, UseInterceptors} from '@nestjs/common';

import {Usr} from '../user/user.decorator';

import {Response} from 'express';
import {BusinessToHttpExceptionInterceptor} from '../../interceptor/BusinessToHttpException.interceptor';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {JWT_User} from '../user/user.model';
import {AuthGuard} from '../../auth/auth.gurad';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {AdministratorService} from './administrator.service';
import {Appointment} from '../appointment/appointment.entity';

@Controller('administrators')
@UseInterceptors(BusinessToHttpExceptionInterceptor)
export class AdministratorController {
    constructor(private administratorService: AdministratorService) {
    }

    @Post()
    @UseGuards(AuthGuard)
    addAdministrator(@Usr() user: JWT_User,
                     @Body('username') username: string,
                     @Body('appointment') appointment: Appointment,
                     @Res() res: Response,) {
        return this.administratorService
            .addAdministrator(user, appointment.link, username)
            .then(
                () => {
                    res.status(HttpStatus.NO_CONTENT).json();
                }
            )
            .catch(
                (e) => {
                    if (e instanceof InsufficientPermissionsException) {
                        throw new InsufficientPermissionsException(null, null, {
                            'attribute': 'link',
                            'in': 'path',
                            'value': appointment.link,
                            'message': 'Specified appointment is not in your ownership. You are not allowed to manage administrators as administrator.'
                        });
                    } else if (e instanceof EntityNotFoundException) {
                        if (e.data === 'appointment') {
                            throw new EntityNotFoundException(null, null, {
                                'object': 'appointment',
                                'attribute': 'link',
                                'in': 'path',
                                'value': username,
                                'message': 'Specified appointment does not exist'
                            });
                        } else if (e.data === 'user') {
                            throw new EntityNotFoundException(null, null, {
                                'attribute': 'username',
                                'in': 'body',
                                'value': username,
                                'message': 'Specified user does not exist'
                            });
                        }
                    }

                    throw e;
                }
            );
    }

    @Delete(':username')
    @UseGuards(AuthGuard)
    removeAdministrator(@Usr() user: JWT_User,
                        @Query('appointment') link: string,
                        @Param('username') username: string,
                        @Res() res: Response) {
        return this.administratorService
            .removeAdministrator(user, link, username)
            .then(
                () => {
                    res.status(HttpStatus.NO_CONTENT).json();
                }
            )
            .catch(
                (e) => {
                    if (e instanceof InsufficientPermissionsException) {
                        throw new InsufficientPermissionsException(null, null, {
                            'attribute': 'link',
                            'in': 'query',
                            'value': link,
                            'message': 'Specified appointment is not in your ownership. You are not allowed to manage administrators as administrator.'
                        });
                    } else if (e instanceof EntityNotFoundException) {
                        if (e.data === 'appointment') {
                            throw new EntityNotFoundException(null, null, {
                                'attribute': 'link',
                                'in': 'query',
                                'value': link,
                                'message': 'Specified appointment does not exist'
                            });
                        } else if (e.data === 'user') {
                            throw new EntityNotFoundException(null, null, {
                                'attribute': 'username',
                                'in': 'path',
                                'value': username,
                                'message': 'Specified user does not exist'
                            });
                        }
                    }

                    throw e;
                }
            );
    }
}
