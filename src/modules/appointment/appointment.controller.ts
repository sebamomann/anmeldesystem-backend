import {Body, ClassSerializerInterceptor, Controller, Get, Post, Query, UseInterceptors} from '@nestjs/common';
import {Appointment} from "./appointment.entity";
import {AppointmentService} from "./appointment.service";

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
    register(@Body() appointment: Appointment): Promise<Appointment> {
        return this.appointmentService.create(appointment);
    }

    @Get('get')
    findByLink(@Query() link: string): Promise<Appointment> {
        return this.appointmentService.find(link);
    }
}
