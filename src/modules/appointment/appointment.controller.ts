import {Body, Controller, Get, HttpStatus, Param, Post, Put, Query, Request, Res, UseGuards, UseInterceptors} from '@nestjs/common';

import {Usr} from '../user/user.decorator';
import {AppointmentService} from './appointment.service';

import {Response} from 'express';
import {BusinessToHttpExceptionInterceptor} from '../../interceptor/BusinessToHttpException.interceptor';
import {AuthOptGuard} from '../../auth/auth-opt.gurad';
import {JWT_User} from '../user/user.model';
import {AuthGuard} from '../../auth/auth.gurad';
import {IAppointmentCreationDTO} from './DTOs/IAppointmentCreationDTO';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {IAppointmentResponseDTO} from './DTOs/IAppointmentResponseDTO';

@Controller('appointments')
@UseInterceptors(BusinessToHttpExceptionInterceptor)
export class AppointmentController {
    constructor(private appointmentService: AppointmentService) {
    }

    @Get()
    @UseGuards(AuthOptGuard)
    getAll(@Usr() user: JWT_User,
           @Query() params: any,
           @Query('before') before: string,
           @Query('after') after: string,
           @Query('limit') limit: number,
           @Query('slim') slim: string,
           @Res() res: Response,) {
        let _slim = slim === 'true';

        return this.appointmentService
            .getAll(user, params, new Date(before), new Date(after), limit, _slim)
            .then(
                (result: IAppointmentResponseDTO[]) => {
                    res.status(HttpStatus.OK).json(result);
                }
            )
            .catch(
                (err) => {
                    throw err;
                }
            );
    }

    @Get(':link')
    @UseGuards(AuthOptGuard)
    findByLink(@Usr() user: JWT_User,
               @Query('slim') slim: string,
               @Query() permissions: any,
               @Param('link') link: string,
               @Request() req: Request,
               @Res() res: Response) {
        let _slim = slim === 'true';

        return this.appointmentService
            .get(user, link, permissions, _slim)
            .then(tAppointment => {
                if (tAppointment === null) {
                    res.status(HttpStatus.NO_CONTENT).json();
                    return;
                }

                res.status(HttpStatus.OK).json(tAppointment);
            })
            .catch((err) => {
                throw err;
            });
    }

    @Post()
    @UseGuards(AuthGuard)
    create(@Usr() user: JWT_User,
           @Body() appointment: IAppointmentCreationDTO,
           @Res() res: Response,) {
        return this.appointmentService
            .create(appointment, user)
            .then(tAppointment => {
                res.header('Location', `${process.env.API_URL}appointments/${tAppointment.link}`); // TODO add function to appointment
                res.status(HttpStatus.CREATED).json(tAppointment);
            })
            .catch((err) => {
                throw err;
            });
    }

    @Put(':link')
    @UseGuards(AuthGuard)
    update(@Usr() user: JWT_User,
           @Param('link') link: string,
           @Body() toChange: any,
           @Res() res: Response,) {
        return this.appointmentService
            .update(toChange, link, user)
            .then(tAppointment => {
                res.header('Location', `${process.env.API_URL}appointments/${tAppointment.link}`);
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch((err) => {
                throw err;
            });
    }

    @Get(':link/management-relations')
    @UseGuards(AuthGuard)
    hasPermission(@Usr() user: JWT_User,
                  @Param('link') link: string,
                  @Res() res: Response,) {
        return this.appointmentService
            .getAppointmentManagementRelation(user, link)
            .then(
                (result) => {
                    res.status(HttpStatus.OK).json(result);
                }
            )
            .catch(
                (err) => {
                    if (err instanceof EntityNotFoundException) {
                        throw new EntityNotFoundException(null, null, {
                            'attribute': 'link',
                            'in': 'path',
                            'value': link,
                            'message': 'Specified appointment does not exist'
                        });
                    }

                    throw err;
                }
            );
    }
}
