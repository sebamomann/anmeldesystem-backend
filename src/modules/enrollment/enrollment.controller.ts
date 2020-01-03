import {Body, Controller, Delete, Get, HttpStatus, Param, Post, Query, Res, UseGuards} from '@nestjs/common';
import {Response} from 'express';
import {EnrollmentService} from "./enrollment.service";
import {Enrollment} from "./enrollment.entity";
import {AuthGuard} from "@nestjs/passport";
import {Usr} from "../user/user.decorator";
import {User} from "../user/user.entity";

@Controller('enrollment')
export class EnrollmentController {

    constructor(private enrollmentService: EnrollmentService) {
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    find(@Query() id: string): Promise<Enrollment> {
        return this.enrollmentService.find(id);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    async delete(@Param() id: string, @Usr() user: User, @Res() res: Response) {
        const enrollment: Enrollment = await this.enrollmentService.find(id);
        if (user !== null && user !== undefined) {
            if (user.id === enrollment.appointment.creator.id
                || enrollment.appointment.administrators.some(iAdministrators => {
                    return iAdministrators.mail === user.mail
                })) {

                await this.enrollmentService.delete(id);
                res.status(HttpStatus.OK).json();
            }
        }

        res.status(HttpStatus.FORBIDDEN).json();
    }

    @Post()
    async create(@Query() link: string, @Body() enrollment: Enrollment, @Res() res: Response) {
        this.enrollmentService.create(enrollment, link).then(tEntrollment => {
            delete tEntrollment.appointment;
            res.status(HttpStatus.CREATED).json(tEntrollment);
        }).catch((err) => {
            let id = this.makeid(10);
            console.log(`[${(new Date()).toDateString()} ${(new Date()).toTimeString()}] Code: ${id} - ${JSON.stringify(err)}`);

            let error = {error: {}, code: ''};
            if (err.code === 'DUPLICATE_ENTRY') {
                error.code = 'DUPLICATE_ENTRY';
                error.error = {
                    columns: ["name"]
                };
            } else {
                error.error = {
                    undefined: {
                        message: "Some error occurred. Please try again later or contact the support",
                        code: id
                    }
                };
            }

            res.status(HttpStatus.BAD_REQUEST).json(error);
        });
    }

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
