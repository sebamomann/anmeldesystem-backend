import {Body, Controller, Delete, Get, Headers, HttpStatus, Param, Post, Put, Res, UseGuards, UseInterceptors} from '@nestjs/common';
import {Response} from 'express';
import {EnrollmentService} from './enrollment.service';
import {Enrollment} from './enrollment.entity';
import {Usr} from '../user/user.decorator';
import {BusinessToHttpExceptionInterceptor} from '../../interceptor/BusinessToHttpException.interceptor';
import {AuthOptGuard} from '../../auth/auth-opt.gurad';
import {JWT_User} from '../user/user.model';

@Controller('enrollments')
@UseInterceptors(BusinessToHttpExceptionInterceptor)
export class EnrollmentController {

    constructor(private enrollmentService: EnrollmentService) {
    }

    @Get('/:id')
    @UseGuards(AuthOptGuard)
    get(@Usr() user: JWT_User,
        @Headers('x-enrollment-permission') token: string,
        @Param('id') id: string,
        @Res() res: Response) {
        return this.enrollmentService
            .get(id, user, token)
            .then((result) => {
                res.status(HttpStatus.OK).json(result);
            })
            .catch((err) => {
                throw err;
            });
    }

    @Post()
    @UseGuards(AuthOptGuard)
    create(@Usr() user: JWT_User,
           @Body('domain') domain: string,
           @Body() enrollment: Enrollment,
           @Res() res: Response,) {
        return this.enrollmentService
            .create(enrollment, user, domain)
            .then(tEnrollment => {
                res.header('Location', `${process.env.API_URL}enrollments/${tEnrollment.id}`);
                res.status(HttpStatus.CREATED).json(tEnrollment);
            })
            .catch((err) => {
                throw err;
            });
    }

    @Put(':id')
    @UseGuards(AuthOptGuard)
    update(@Usr() user: JWT_User,
           @Param('id') id: string,
           @Headers('x-enrollment-token') token: string,
           @Body() toChange: Enrollment,
           @Res() res: Response) {
        return this.enrollmentService
            .update(toChange, id, user, token)
            .then((tEnrollment) => {
                res.header('Location', `${process.env.API_URL}enrollments/${tEnrollment.id}`);
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch((err) => {
                throw err;
            });
    }

    @Delete(':id/:token*?')
    @UseGuards(AuthOptGuard)
    delete(@Param('id') id: string,
           @Headers('x-enrollment-token') token: string,
           @Usr() user: JWT_User,
           @Res() res: Response) {
        return this.enrollmentService
            .delete(id, token, user)
            .then(
                () => {
                    res.status(HttpStatus.NO_CONTENT).json();
                }
            )
            .catch(
                (err) => {
                    throw err;
                }
            );
    }

    @Get('/:id/check-permission')
    @UseGuards(AuthOptGuard)
    checkPermissions(@Usr() user: JWT_User,
                     @Headers('x-enrollment-token') token: string,
                     @Param('id') id: string,
                     @Res() res: Response) {
        return this.enrollmentService
            .checkPermissions(id, user, token)
            .then((result) => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch((err) => {
                throw err;
            });
    }
}
