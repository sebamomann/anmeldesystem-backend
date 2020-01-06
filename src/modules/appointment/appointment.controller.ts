import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpStatus,
    Inject,
    Param,
    Post,
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

@Controller('appointment')
export class AppointmentController {
    constructor(@Inject(REQUEST) private readonly request: Request, private appointmentService: AppointmentService) {

    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(ClassSerializerInterceptor)
    findAll(@Query('slim') slim: string, @Usr() user: User): Promise<Appointment[]> {
        let _slim = slim === "true";
        return this.appointmentService.findAll(user, _slim);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@Body() appointment: Appointment, @Res() res: Response, @Usr() user: User) {
        return this.appointmentService.create(appointment, user).then(tAppointment => {
            delete tAppointment.files;
            tAppointment.creator = UserUtil.minimizeUser(tAppointment.creator);
            res.status(HttpStatus.CREATED).json(tAppointment);
        }).catch((err) => {
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

    @Get(':link')
    findByLink(@Param() link: string, @Request() req: Request, @Res() res: Response) {
        return this.appointmentService.find(link).then(tAppointment => {
            if (tAppointment != null) {
                // tAppointment.creator = UserUtil.minimizeUser(tAppointment.creator);
                res.status(HttpStatus.OK).json(tAppointment);
            } else {
                res.status(HttpStatus.NOT_FOUND).json({error: {not_found: "Appointment not found"}});
            }
        }).catch((err) => {
            console.log(err);
            let error = {error: {}};
            error.error = {undefined: {message: "Some error occurred. Please try again later or contact the support"}};

            res.status(HttpStatus.BAD_REQUEST).json(error);
        });
    }
}
