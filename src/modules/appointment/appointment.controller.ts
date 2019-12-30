import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpStatus,
    Inject,
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

@UseGuards(AuthGuard('jwt'))
@Controller('appointment')
export class AppointmentController {
    constructor(@Inject(REQUEST) private readonly request: Request, private appointmentService: AppointmentService) {

    }

    @Get()
    @UseInterceptors(ClassSerializerInterceptor)
    findAll(): Promise<Appointment[]> {
        return this.appointmentService.findAll();
    }

    @Post()
    create(@Body() appointment: Appointment, @Res() res: Response, @Usr() user: User) {
        return this.appointmentService.create(appointment, user).then(tAppointment => {
            delete tAppointment.files;
            res.status(HttpStatus.CREATED).json(tAppointment);
        }).catch((err) => {
            let error = {error: {}};
            if (err.code === 'ER_DUP_ENTRY') {
                error.error = {
                    columns: [
                        {
                            name: "link",
                            error: "duplicate"
                        }
                    ]
                };
            } else {
                error.error = {undefined: {message: "Some error occurred. Please try again later or contact the support"}};
            }

            res.status(HttpStatus.BAD_REQUEST).json(error);
        });
    }

    @Get('get')
    findByLink(@Query() link: string, @Request() req: Request): Promise<Appointment> {
        return this.appointmentService.find(link);
    }
}
