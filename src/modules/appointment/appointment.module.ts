import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AppointmentController} from "./appointment.controller";
import {Appointment} from "./appointment.entity";
import {AppointmentService} from "./appointment.service";
import {Addition} from "../addition/addition.entity";
import {File} from "../file/file.entity";
import {AdditionService} from "../addition/addition.service";

@Module({
    imports: [TypeOrmModule.forFeature([Appointment, Addition, File])],
    providers: [AppointmentService, AdditionService],
    exports: [AppointmentService, AdditionService],
    controllers: [AppointmentController],
})
export class AppointmentModule {
}
