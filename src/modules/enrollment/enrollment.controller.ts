import {Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Res, UseGuards} from '@nestjs/common';
import {Response} from 'express';
import {EnrollmentService} from "./enrollment.service";
import {Enrollment} from "./enrollment.entity";
import {AuthGuard} from "@nestjs/passport";
import {Usr} from "../user/user.decorator";
import {User} from "../user/user.entity";
import {JwtOptStrategy} from "../../auth/jwt-opt.strategy";

@Controller('enrollment')
export class EnrollmentController {

    constructor(private enrollmentService: EnrollmentService) {
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    async find(@Query() id: string) {
        return this.enrollmentService.find(id);
    }

    @Delete(':id')
    @UseGuards(JwtOptStrategy)
    async delete(@Param() id: string, @Body() body: any, @Usr() user: User, @Res() res: Response) {
        await this.enrollmentService
            .delete(id, body.key, user)
            .then(() => {
                res.status(HttpStatus.OK).json();
            })
            .catch(() => {
                res.status(HttpStatus.FORBIDDEN).json();
            });
    }

    @Put(':id')
    @UseGuards(JwtOptStrategy)
    async update(@Param() id: string, @Body() enrollment: Enrollment, @Usr() user: User, @Res() res: Response) {
        await this.enrollmentService
            .update(id, enrollment, user)
            .then(() => {
                res.status(HttpStatus.OK).json();
            })
            .catch((err) => {
                console.log(JSON.stringify(err));
                res.status(HttpStatus.FORBIDDEN).json();
            });
    }

    @UseGuards(JwtOptStrategy)
    @Post()
    async create(@Query() link: string, @Body() enrollment: Enrollment, @Usr() user: User, @Res() res: Response) {
        this.enrollmentService
            .create(enrollment, link, user)
            .then(tEntrollment => {
                delete tEntrollment.appointment;
                res.status(HttpStatus.CREATED).json(tEntrollment);
            })
            .catch((err) => {
                let error: any = {};
                if (err.code === 'DUPLICATE_ENTRY'
                    || err.code === 'EMPTY_FIELDS') {
                    error.code = err.code;
                    error.error = err.data
                } else {
                    let id = this.makeid(10);
                    console.log(`[${(new Date()).toDateString()} ${(new Date()).toTimeString()}] Code: ${id} - ${JSON.stringify(err)}`);

                    error.code = "UNDEFINED";
                    error.error = {
                        message: "Some error occurred. Please try again later or contact the support",
                        id: id
                    };
                }

                res.status(HttpStatus.BAD_REQUEST).json(error);
            });
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/:id/allowEdit')
    async checkUser(@Param() params: string, @Usr() user: User, @Res() res: Response) {
        this.enrollmentService
            .find(params)
            .then(tEnrollment => {
                if (tEnrollment != undefined) {
                    if (EnrollmentService.allowEditByUserId(tEnrollment, user)) {
                        res.status(HttpStatus.OK).json();
                    }
                } else {
                    res.status(HttpStatus.NOT_FOUND).json({error: {not_found: "Enrollment not found"}});
                }

                res.status(HttpStatus.FORBIDDEN).json();
            })
            .catch(err => {
                console.log(err);
            });
    }

    @Post('/:id/validateKey')
    async validateKey(@Param() params: string, @Body() body: { key: string }, @Res() res: Response) {
        this.enrollmentService
            .find(params)
            .then(tEnrollment => {
                if (tEnrollment != undefined) {
                    if (EnrollmentService.allowEditByKey(tEnrollment, body.key)) {
                        res.status(HttpStatus.OK).json();
                    }
                } else {
                    res.status(HttpStatus.NOT_FOUND).json({error: {not_found: "Enrollment not found"}});
                }

                res.status(HttpStatus.FORBIDDEN).json();
            }).catch(err => {
            console.log(err);
        });
    }

    // Util
    makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
