import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpStatus,
    Post,
    Query,
    Res,
    UseInterceptors
} from '@nestjs/common';
import {Appointment} from "./appointment.entity";
import {AppointmentService} from "./appointment.service";
import {Response} from "express";

@Controller('appointment')
export class AppointmentController {
    constructor(private appointmentService: AppointmentService) {

    }

    @Get()
    @UseInterceptors(ClassSerializerInterceptor)
    findAll(): Promise<Appointment[]> {
        return this.appointmentService.findAll();
    }

    @Post()
    register(@Body() appointment: Appointment, @Res() res: Response) {
        return this.appointmentService.create(appointment).then(tAppointment => {
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
    findByLink(@Query() link: string): Promise<Appointment> {
        return this.appointmentService.find(link);
    }
}
