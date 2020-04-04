import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    Put,
    Query,
    Request,
    Res,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {Appointment} from './appointment.entity';

import {AppointmentService} from './appointment.service';

import {Response} from 'express';
import {AuthGuard} from '@nestjs/passport';
import {Usr} from '../user/user.decorator';
import {User} from '../user/user.entity';
import {UserUtil} from '../../util/userUtil.util';
import {Etag} from '../../util/etag';
import {JwtOptStrategy} from '../../auth/jwt-opt.strategy';
import {Responses} from '../../util/responses.util';
import {BusinessToHttpExceptionInterceptor} from '../../interceptor/BusinessToHttpException.interceptor';

@Controller('appointment')
export class AppointmentController {
    constructor(private appointmentService: AppointmentService) {
    }

    static passwordresetErrorHandler(err: any, res: Response) {
        if (err instanceof NotFoundException) {
            return err;
        }

        let error: any = {};
        if (err.code === 'INVALID' || err.code === 'EXPIRED' || err.code === 'USED' || err.code === 'OUTDATED') {
            error.code = err.code;
            error.message = err.message;
            error.error = err.data;
        }

        return res.status(HttpStatus.BAD_REQUEST).json(error);
    }

    @Get()
    @UseGuards(JwtOptStrategy)
    @UseInterceptors(ClassSerializerInterceptor)
    getAll(@Usr() user: User,
           @Query() params: any,
           @Query('slim') slim: string,
           @Res() res: Response,) {
        let _slim = slim === 'true';

        return this.appointmentService
            .getAll(user, params, _slim)
            .then(result => {
                res.status(HttpStatus.OK).json(result);
            })
            .catch(err => {
                throw err;
            });
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(BusinessToHttpExceptionInterceptor)
    create(@Usr() user: User,
           @Body() appointment: Appointment,
           @Res() res: Response,) {
        return this.appointmentService
            .create(appointment, user)
            .then(tAppointment => {
                delete tAppointment.files;
                tAppointment.creator = UserUtil.minimizeUser(tAppointment.creator);
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
    addAdministrator(@Usr() user: User,
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

    // stopped here

    @Get(':link/permission')
    @UseGuards(AuthGuard('jwt'))
    hasPermission(@Usr() user: User,
                  @Param('link') link: string,
                  @Res() res: Response,) {
        return this.appointmentService
            .hasPermission(user, link)
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
            .find(link, user, permissions, _slim)
            .then(tAppointment => {
                if (tAppointment != null) {
                    const etag = Etag.generate(JSON.stringify(tAppointment));
                    if (req.headers['if-none-match'] && req.headers['if-none-match'] == 'W/' + '"' + etag + '"') {
                        console.log(`appointment ${link} not modified`);
                        res.status(HttpStatus.NOT_MODIFIED).json();
                    } else {
                        console.log(`appointment ${link} modified`);
                        res.header('etag', 'W/' + '"' + etag + '"');
                        res.status(HttpStatus.OK).json(tAppointment);
                    }
                } else {
                    res.status(HttpStatus.NOT_FOUND).json({error: {not_found: 'Appointment not found'}});
                }
            }).catch((err) => {
                if (err instanceof NotFoundException) {
                    throw err;
                }

                console.log(err);
                let error = {error: {}};
                error.error = {undefined: {message: 'Some error occurred. Please try again later or contact the support'}};

                res.status(HttpStatus.BAD_REQUEST).json(error);
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
    //             console.log(err);
    //             let error = {error: {}};
    //             error.error = {undefined: {message: "Some error occurred. Please try again later or contact the support"}};
    //
    //             res.status(HttpStatus.BAD_REQUEST).json(error);
    //         });
    // }

    @Post(':link/file')
    addFile(@Param('link') link: string,
            @Body() data: { name: string, data: string },
            @Request() req: Request,
            @Res() res: Response) {
        return this.appointmentService
            .addFile(link, data)
            .then(result => {
                res.status(HttpStatus.OK).json();
            }).catch((err) => {
                if (err instanceof NotFoundException) {
                    throw err;
                }

                console.log(err);
                let error = {error: {}};
                error.error = {undefined: {message: 'Some error occurred. Please try again later or contact the support'}};

                res.status(HttpStatus.BAD_REQUEST).json(error);
            });
    }

    @Delete(':link/file/:id')
    deleteFile(@Param('link') link: string,
               @Param('id') id: string,
               @Request() req: Request,
               @Res() res: Response) {
        return this.appointmentService
            .removeFile(link, id)
            .then(result => {
                res.status(HttpStatus.OK).json();
            });
    }

    @Get(':link/pin')
    @UseGuards(AuthGuard('jwt'))
    pinAppointment(@Usr() user: User,
                   @Param('link') link: string,
                   @Res() res: Response) {
        this.appointmentService
            .pinAppointment(user, link)
            .then(result => {
                return res.status(HttpStatus.OK).json();
            })
            .catch(err => {
                if (err instanceof NotFoundException) {
                    throw err;
                }

                return AppointmentController.passwordresetErrorHandler(err, res);
            });
    }
}

function handleExceptions(allowedExceptions: any[], err: any, res: Response) {
    let valid = false;
    let error: any = {};

    allowedExceptions.forEach(FAllowedException => {
        if (err instanceof FAllowedException) {
            error.code = err.code;
            error.message = err.message;
            error.data = err.data;

            res.status(HttpStatus.BAD_REQUEST).json(error);

            valid = true;
            return;
        }
    });

    if (!valid) {
        Responses.undefinedErrorResponse(err, res);
    }
}
