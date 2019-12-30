import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Passenger} from "./passenger.entity";
import {Enrollment} from "../enrollment/enrollment.entity";
import {Appointment} from "../appointment/appointment.entity";
import {AppointmentService} from "../appointment/appointment.service";
import {File} from "../file/file.entity";
import {FileService} from "../file/file.service";
import {PassengerController} from "./passenger.controller";
import {PassengerService} from "./passenger.service";
import {Addition} from "../addition/addition.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Passenger, Addition, Enrollment, Appointment, File])],
    providers: [PassengerService, AppointmentService, FileService],
    exports: [PassengerService, AppointmentService, FileService],
    controllers: [PassengerController],
})
export class PassengerModule {
}
