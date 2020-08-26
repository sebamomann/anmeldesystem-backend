import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Request,
    Res,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';

import {Usr} from '../user/user.decorator';
import {User} from '../user/user.entity';

import {Appointment} from './appointment.entity';
import {AppointmentService} from './appointment.service';

import {AuthGuard} from '@nestjs/passport';

import {JwtOptStrategy} from '../../auth/jwt-opt.strategy';
import {Response} from 'express';
import {BusinessToHttpExceptionInterceptor} from '../../interceptor/BusinessToHttpException.interceptor';

@Controller('appointment')
@UseInterceptors(BusinessToHttpExceptionInterceptor)
export class AppointmentController {
    constructor(private appointmentService: AppointmentService) {
    }

    @Get(':link')
    @UseGuards(JwtOptStrategy)
    findByLink(@Usr() user: User,
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

    @Get()
    @UseGuards(JwtOptStrategy)
    @UseInterceptors(ClassSerializerInterceptor)
    getAll(@Usr() user: User,
           @Query() params: any,
           @Query('slim') slim: string,
           @Query('since') since: string,
           @Query('limit') limit: string,
           @Res() res: Response,) {
        let _slim = slim === 'true';
        return this.appointmentService
            .getAll(user, params, _slim, since, limit)
            .then(result => {
                console.log(result);
                res.status(HttpStatus.OK).json(result);
            })
            .catch(err => {
                throw err;
            });
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@Usr() user: User,
           @Body() appointment: Appointment,
           @Res() res: Response,) {
        return this.appointmentService
            .create(appointment, user)
            .then(tAppointment => {
                res.status(HttpStatus.CREATED).json(tAppointment);
            })
            .catch((err) => {
                throw err;
            });
    }

    @Put(':link')
    @UseGuards(AuthGuard('jwt'))
    update(@Usr() user: User,
           @Param('link') link: string,
           @Body() toChange: any,
           @Res() res: Response,) {
        return this.appointmentService
            .update(toChange, link, user)
            .then(tAppointment => {
                res.status(HttpStatus.OK).json(tAppointment);
            })
            .catch((err) => {
                throw err;
            });
    }

    @Post(':link/administrator')
    @UseGuards(AuthGuard('jwt'))
    addAdministrator(@Usr() user: User, // TODO currently can be addeded multioople times ?
                     @Param('link') link: string,
                     @Body('username') username: string,
                     @Res() res: Response,) {
        return this.appointmentService
            .addAdministrator(user, link, username)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            }).catch((err) => {
                throw err;
            });
    }

    @Delete(':link/administrator/:username')
    @UseGuards(AuthGuard('jwt'))
    removeAdministrator(@Usr() user: User,
                        @Param('link') link: string,
                        @Param('username') username: string,
                        @Res() res: Response) {
        return this.appointmentService
            .removeAdministrator(user, link, username)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            }).catch((err) => {
                throw err;
            });
    }

    @Get(':link/permission')
    @UseGuards(AuthGuard('jwt'))
    hasPermission(@Usr() user: User,
                  @Param('link') link: string,
                  @Res() res: Response,) {
        return this.appointmentService
            .isCreatorOrAdministrator(user, link)
            .then((result) => {
                if (result) {
                    res.status(HttpStatus.NO_CONTENT).json();
                    return;
                }

                throw new ForbiddenException();
            })
            .catch((err) => {
                throw err;
            });
    }

    @Post(':link/file')
    @UseGuards(AuthGuard('jwt'))
    addFile(@Usr() user: User,
            @Param('link') link: string,
            @Body() data: { name: string, data: string },
            @Res() res: Response) {
        return this.appointmentService
            .addFile(user, link, data)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch((err) => {
                throw err;
            });
    }

    @Delete(':link/file/:id')
    @UseGuards(AuthGuard('jwt'))
    removeFile(@Usr() user: User,
               @Param('link') link: string,
               @Param('id') id: string,
               @Res() res: Response) {
        return this.appointmentService
            .removeFile(user, link, id)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch((err) => {
                throw err;
            });
    }

    @Get(':link/pin')
    @UseGuards(AuthGuard('jwt'))
    pinAppointment(@Usr() user: User,
                   @Param('link') link: string,
                   @Res() res: Response) {
        return this.appointmentService
            .togglePinningAppointment(user, link)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch(err => {

                throw err;
            });
    }

    // @Post('newcontent/:link')
    // updateAvailable(@Param('link') link: string, @Body("lastUpdated") lud: Date, @Request() req: Request, @Res() res: Response) {
    //     const date = new Date(lud).getTime();
    //     return this.appointmentService
    //         .find(link)
    //         .then(tAppointment => {
    //             if (tAppointment != null) {
    //                 const appointmentDate = tAppointment.lud.getTime();
    //                 const enrollments = tAppointment.enrollments.filter(fEnrollment => {
    //                     if (fEnrollment.lud.getTime() > date) {
    //                         return fEnrollment;
    //                     }
    //                 });
    //                 console.log(`${appointmentDate} ${date}`);
    //
    //                 if (enrollments.length > 0 || appointmentDate > date) {
    //                     res.status(HttpStatus.OK).json(tAppointment);
    //                 } else {
    //                     res.status(HttpStatus.NOT_MODIFIED).json();
    //                 }
    //
    //             } else {
    //                 res.status(HttpStatus.NOT_FOUND).json({error: {not_found: "Appointment not found"}});
    //             }
    //         }).catch((err) => {
    //             if (err instanceof NotFoundException) {
    //                 throw err;
    //             }
    //
    //             
    //             let error = {error: {}};
    //             error.error = {undefined: {message: "Some error occurred. Please try again later or contact the support"}};
    //
    //             res.status(HttpStatus.BAD_REQUEST).json(error);
    //         });
    // }
}
