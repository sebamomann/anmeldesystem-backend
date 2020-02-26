import {
    BadRequestException,
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpStatus,
    Inject,
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
import {Appointment} from "./appointment.entity";
import {AppointmentService} from "./appointment.service";
import {Response} from "express";
import {AuthGuard} from "@nestjs/passport";
import {REQUEST} from "@nestjs/core";
import {Usr} from "../user/user.decorator";
import {User} from "../user/user.entity";
import {UserUtil} from "../../util/userUtil.util";
import {UnknownUsersException} from "../../exceptions/UnknownUsersException";
import {Etag} from "../../util/etag";

@Controller('appointment')
export class AppointmentController {
    constructor(@Inject(REQUEST) private readonly request: Request, private appointmentService: AppointmentService) {

    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(ClassSerializerInterceptor)
    findAll(@Query('slim') slim: string, @Usr() user: User): Promise<Appointment[]> {
        let _slim = slim === "true";
        return this.appointmentService
            .findAll(user, _slim);
    }

    @Get(":link/permission")
    @UseGuards(AuthGuard('jwt'))
    permission(@Param('link') link: string,
               @Usr() user: User,
               @Res() res: Response) {
        this.appointmentService
            .hasPermission(link, user)
            .then(result => {
                res.status(HttpStatus.OK).json(result);
            });
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@Body() appointment: Appointment, @Res() res: Response, @Usr() user: User) {
        return this.appointmentService
            .create(appointment, user)
            .then(tAppointment => {
                delete tAppointment.files;
                tAppointment.creator = UserUtil.minimizeUser(tAppointment.creator);
                res.status(HttpStatus.CREATED).json(tAppointment);
            })
            .catch((err) => {
                let error = {code: '', error: {}};
                if (err.code === 'ER_DUP_ENTRY') {
                    error.code = 'ER_DUP_ENTRY';
                    error.error = {
                        columns: ["link"]
                    };
                } else if (err instanceof UnknownUsersException) {
                    error.code = "ADMINISTRATORS_NOT_FOUND";
                    error.error = {
                        values: err.data
                    };
                } else {
                    error.error = {
                        undefined: {
                            message: "Some error occurred. Please try again later or contact the support",
                            error: err
                        }
                    };
                }

                res.status(HttpStatus.BAD_REQUEST).json(error);
            });
    }

    @Put(':link')
    @UseGuards(AuthGuard('jwt'))
    update(@Body() toChange: any, @Param('link') link: string, @Res() res: Response, @Usr() user: User) {
        return this.appointmentService
            .update(toChange, link, user)
            .then(tAppointment => {
                res.status(HttpStatus.OK).json(tAppointment);
            })
            .catch((err) => {
                console.log(err);

                let error = {code: '', error: {}};
                if (err.code === 'ER_DUP_ENTRY') {
                    error.code = 'ER_DUP_ENTRY';
                    error.error = {
                        columns: ["link"]
                    };
                } else if (err.code === 'DUPLICATE_ENTRY') {
                    error.code = 'ER_DUP_ENTRY';
                    error.error = {
                        columns: err.data
                    };
                } else if (err instanceof UnknownUsersException) {
                    error.code = "ADMINISTRATORS_NOT_FOUND";
                    error.error = {
                        values: err.data
                    };
                } else if (err instanceof NotFoundException
                    || err instanceof ForbiddenException) {
                    throw err
                } else {
                    error.error = {
                        undefined: {
                            message: "Some error occurred. Please try again later or contact the support",
                            error: err
                        }
                    };
                }

                res.status(HttpStatus.BAD_REQUEST).json(error);
            });
    }

    @Get(':link')
    findByLink(@Query('slim') slim: string, @Param('link') link: string, @Request() req: Request, @Res() res: Response) {
        let _slim = slim === "true";
        return this.appointmentService
            .find(link, _slim)
            .then(tAppointment => {
                if (tAppointment != null) {
                    const etag = Etag.generate(JSON.stringify(tAppointment));
                    if (req.headers['if-none-match'] && req.headers['if-none-match'] == "W/" + '"' + etag + '"') {
                        console.log(`appointment ${link} not modified`);
                        res.status(HttpStatus.NOT_MODIFIED).json();
                    } else {
                        console.log(`appointment ${link} modified`);
                        res.header('etag', "W/" + '"' + etag + '"');
                        res.status(HttpStatus.OK).json(tAppointment);
                    }
                } else {
                    res.status(HttpStatus.NOT_FOUND).json({error: {not_found: "Appointment not found"}});
                }
            }).catch((err) => {
                if (err instanceof NotFoundException) {
                    throw err;
                }

                console.log(err);
                let error = {error: {}};
                error.error = {undefined: {message: "Some error occurred. Please try again later or contact the support"}};

                res.status(HttpStatus.BAD_REQUEST).json(error);
            });
    }

    @Post('newcontent/:link')
    updateAvailable(@Param('link') link: string, @Body("lastUpdated") lud: Date, @Request() req: Request, @Res() res: Response) {
        const date = new Date(lud).getTime();
        return this.appointmentService
            .find(link)
            .then(tAppointment => {
                if (tAppointment != null) {
                    const appointmentDate = tAppointment.lud.getTime();
                    const enrollments = tAppointment.enrollments.filter(fEnrollment => {
                        if (fEnrollment.lud.getTime() > date) {
                            return fEnrollment;
                        }
                    });
                    console.log(`${appointmentDate} ${date}`);

                    if (enrollments.length > 0 || appointmentDate > date) {
                        res.status(HttpStatus.OK).json(tAppointment);
                    } else {
                        res.status(HttpStatus.NOT_MODIFIED).json();
                    }

                } else {
                    res.status(HttpStatus.NOT_FOUND).json({error: {not_found: "Appointment not found"}});
                }
            }).catch((err) => {
                if (err instanceof NotFoundException) {
                    throw err;
                }

                console.log(err);
                let error = {error: {}};
                error.error = {undefined: {message: "Some error occurred. Please try again later or contact the support"}};

                res.status(HttpStatus.BAD_REQUEST).json(error);
            });
    }

    @Post(':link/administrator')
    addAdministrator(@Param('link') link: string, @Body("username") username: string,
                     @Request() req: Request, @Res() res: Response) {
        return this.appointmentService
            .addAdministrator(link, username)
            .then(result => {
                res.status(HttpStatus.OK).json();
            }).catch((err) => {
                if (err instanceof NotFoundException || err instanceof BadRequestException) {
                    throw err;
                }

                console.log(err);
                let error = {error: {}};
                error.error = {undefined: {message: "Some error occurred. Please try again later or contact the support"}};

                res.status(HttpStatus.BAD_REQUEST).json(error);
            });
    }

    @Delete(':link/administrator/:username')
    deleteAdministrator(@Param('link') link: string,
                        @Param('username') username: string,
                        @Request() req: Request,
                        @Res() res: Response) {
        return this.appointmentService
            .removeAdministrator(link, username)
            .then(result => {
                res.status(HttpStatus.OK).json();
            })
    }

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
                error.error = {undefined: {message: "Some error occurred. Please try again later or contact the support"}};

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
            })
    }
}
