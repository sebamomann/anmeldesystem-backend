import {Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Res, UseGuards} from '@nestjs/common';
import {Response} from 'express';
import {EnrollmentService} from './enrollment.service';
import {Enrollment} from './enrollment.entity';
import {Usr} from '../user/user.decorator';
import {User} from '../user/user.entity';
import {JwtOptStrategy} from '../../auth/jwt-opt.strategy';

@Controller('enrollment')
export class EnrollmentController {

    constructor(private enrollmentService: EnrollmentService) {
    }

    // @Get()
    // @UseGuards(AuthGuard('jwt'))
    // async find(@Query() id: string) {
    //     return this.enrollmentService.find(id);
    // }

    @Post()
    @UseGuards(JwtOptStrategy)
    create(@Usr() user: User,
           @Query('link') link: string,
           @Body('domain') domain: string,
           @Body() enrollment: Enrollment,
           @Res() res: Response,) {
        return this.enrollmentService
            .create(enrollment, user, domain, link)
            .then(tEnrollment => {
                res.status(HttpStatus.CREATED).json(tEnrollment);
            })
            .catch((err) => {
                throw err;
            });
    }

    @Put(':id/:token*?')
    @UseGuards(JwtOptStrategy)
    update(@Usr() user: User,
           @Param() id: string,
           @Param() token: string,
           @Body() toChange: Enrollment,
           @Res() res: Response) {
        return this.enrollmentService
            .update(toChange, id, user, token)
            .then((tEnrollment) => {
                res.status(HttpStatus.OK).json(tEnrollment);
            })
            .catch((err) => {
                throw err;
            });
    }

    @Delete(':id/:token*?')
    @UseGuards(JwtOptStrategy)
    delete(@Param() id: string,
           @Param('token') token: string,
           @Usr() user: User,
           @Res() res: Response) {
        return this.enrollmentService
            .delete(id, token, user)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch((err) => {
                throw err;
            });
    }

    @Get('/:id/check-permission')
    @UseGuards(JwtOptStrategy)
    checkPermissions(@Usr() user: User,
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
