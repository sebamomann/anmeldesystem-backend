import {Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Res, UseGuards, UseInterceptors} from '@nestjs/common';
import {Response} from 'express';
import {EnrollmentService} from './enrollment.service';
import {Enrollment} from './enrollment.entity';
import {Usr} from '../user/user.decorator';
import {BusinessToHttpExceptionInterceptor} from '../../interceptor/BusinessToHttpException.interceptor';
import {AuthOptGuard} from '../../auth/auth-opt.gurad';
import {JWT_User} from '../user/user.model';

@Controller('enrollment')
@UseInterceptors(BusinessToHttpExceptionInterceptor)
export class EnrollmentController {

    constructor(private enrollmentService: EnrollmentService) {
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
                res.status(HttpStatus.CREATED).json(tEnrollment);
            })
            .catch((err) => {
                console.log(err, 'LOL');
                throw err;
            });
    }

    @Put(':id/:token*?')
    @UseGuards(AuthOptGuard)
    update(@Usr() user: JWT_User,
           @Param('id') id: string,
           @Param('token') token: string,
           @Body() toChange: Enrollment,
           @Res() res: Response) {
        return this.enrollmentService
            .update(toChange, id, user)
            .then((tEnrollment) => {
                res.status(HttpStatus.OK).json(tEnrollment);
            })
            .catch((err) => {
                console.log(err);
                throw err;
            });
    }

    @Delete(':id/:token*?')
    @UseGuards(AuthOptGuard)
    delete(@Param('id') id: string,
           @Param('token') token: string,
           @Usr() user: JWT_User,
           @Res() res: Response) {
        return this.enrollmentService
            .delete(id, token, user)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch((err) => {
                console.log(err);
                throw err;
            });
    }

    @UseGuards(AuthOptGuard)
    @Get('/:id/check-permission')
    checkPermissions(@Usr() user: JWT_User,
                     @Query('token') token: string,
                     @Param('id') id: string,
                     @Res() res: Response) {
        return this.enrollmentService
            .checkPermissions(id, user, token)
            .then((result) => {
                res.status(HttpStatus.OK).json(result);
            })
            .catch((err) => {
                throw err;
            });
    }
}
