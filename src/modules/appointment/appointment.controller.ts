import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Request,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';

import {Usr} from '../user/user.decorator';
import {AppointmentService} from './appointment.service';

import {Response} from 'express';
import {BusinessToHttpExceptionInterceptor} from '../../interceptor/BusinessToHttpException.interceptor';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {AuthOptGuard} from '../../auth/auth-opt.gurad';
import {JWT_User} from '../user/user.model';
import {AuthGuard} from '../../auth/auth.gurad';
import {IAppointmentCreationDTO} from './DTOs/IAppointmentCreationDTO';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {FileFieldsInterceptor} from '@nestjs/platform-express';
import {IFileCreationDTO} from '../file/IFileCreationDTO';

@Controller('appointments')
@UseInterceptors(BusinessToHttpExceptionInterceptor)
export class AppointmentController {
    constructor(private appointmentService: AppointmentService) {
    }

    @Get()
    @UseGuards(AuthOptGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    getAll(@Usr() user: JWT_User,
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

    @Get('archive')
    @UseGuards(AuthOptGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    getAllArchive(@Usr() user: JWT_User,
                  @Query() params: any,
                  @Query('slim') slim: string,
                  @Query('before') before: string,
                  @Query('limit') limit: number,
                  @Res() res: Response,) {
        let _slim = slim === 'true';

        return this.appointmentService
            .getAllArchive(user, params, _slim, before, limit)
            .then(result => {
                res.status(HttpStatus.OK).json(result);
            })
            .catch(err => {
                throw err;
            });
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
                console.log(err);
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
                console.log(err);
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
                console.log(err);
                throw err;
            });
    }

    @Get(':link/permission')
    @UseGuards(AuthGuard)
    hasPermission(@Usr() user: JWT_User,
                  @Param('link') link: string,
                  @Res() res: Response,) {
        return this.appointmentService
            .isCreatorOrAdministrator(user, link)
            .then((result) => {
                if (result) {
                    res.status(HttpStatus.NO_CONTENT).json();
                    return;
                }

                throw new InsufficientPermissionsException();
            })
            .catch((err) => {
                throw err;
            });
    }

    @Post(':link/files')
    @UseGuards(AuthGuard)
    @UseInterceptors(FileFieldsInterceptor([{name: 'files', maxCount: 5}]))
    addFile(@Usr() user: JWT_User,
            @Param('link') link: string,
            @UploadedFile('files') files: { files: IFileCreationDTO[] } | IFileCreationDTO,
            @Res() res: Response) {
        let fileArray: IFileCreationDTO[];

        if (!Object.keys(files).includes('files')) {
            fileArray = [(files as IFileCreationDTO)];
        } else {
            fileArray = (files as { files: IFileCreationDTO[] }).files;
        }

        return this.appointmentService
            .addFiles(user, link, fileArray as IFileCreationDTO[])
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
                            'value': link,
                            'message': 'Specified appointment is not in your ownership. You are not allowed to manage files as administrator.'
                        });
                    } else if (e instanceof EntityNotFoundException) {
                        throw new EntityNotFoundException(null, null, {
                            'attribute': 'link',
                            'in': 'path',
                            'value': link,
                            'message': 'Specified appointment does not exist'
                        });
                    }

                    throw e;
                }
            );
    }

    @Delete(':link/files/:id')
    @UseGuards(AuthGuard)
    removeFile(@Usr() user: JWT_User,
               @Param('link') link: string,
               @Param('id') id: string,
               @Res() res: Response) {
        return this.appointmentService
            .removeFile(user, link, id)
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
                            'value': link,
                            'message': 'Specified appointment is not in your ownership. You are not allowed to manage files as administrator.'
                        });
                    } else if (e instanceof EntityNotFoundException) {
                        if (e.data === 'appointment') {
                            throw new EntityNotFoundException(null, null, {
                                'attribute': 'link',
                                'in': 'path',
                                'value': link,
                                'message': 'Specified appointment does not exist'
                            });
                        } else if (e.data === 'file') {
                            throw new EntityNotFoundException(null, null, {
                                'attribute': 'id',
                                'in': 'path',
                                'value': id,
                                'message': 'Specified file does not exist'
                            });
                        }
                    }

                    throw e;
                }
            );
    }

    @Get(':link/pin')
    @UseGuards(AuthGuard)
    pinAppointment(@Usr() user: JWT_User,
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

    // @Post('newcontent/:_link')
    // updateAvailable(@Param('_link') _link: string, @Body("lastUpdated") lud: Date, @Request() req: Request, @Res() res: Response) {
    //     const _date = new Date(lud).getTime();
    //     return this.appointmentService
    //         .find(_link)
    //         .then(tAppointment => {
    //             if (tAppointment != null) {
    //                 const appointmentDate = tAppointment.lud.getTime();
    //                 const enrollments = tAppointment.enrollments.filter(fEnrollment => {
    //                     if (fEnrollment.lud.getTime() > _date) {
    //                         return fEnrollment;
    //                     }
    //                 });
    //                 console.log(`${appointmentDate} ${_date}`);
    //
    //                 if (enrollments.length > 0 || appointmentDate > _date) {
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
