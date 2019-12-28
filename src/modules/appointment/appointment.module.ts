import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AppointmentController} from "./appointment.controller";
import {Appointment} from "./appointment.entity";
import {AppointmentService} from "./appointment.service";

@Module({
    imports: [TypeOrmModule.forFeature([Appointment])],
    providers: [AppointmentService],
    exports: [AppointmentService],
    controllers: [AppointmentController],
})
export class AppointmentModule {
}
