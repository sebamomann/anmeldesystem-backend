import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AppointmentController} from "./appointment.controller";
import {Appointment} from "./appointment.entity";
import {AppointmentService} from "./appointment.service";
import {Addition} from "../addition/addition.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Appointment]),
        TypeOrmModule.forFeature([Addition])],
    providers: [AppointmentService],
    exports: [AppointmentService],
    controllers: [AppointmentController],
})
export class AppointmentModule {
}
