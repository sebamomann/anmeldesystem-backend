import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Driver} from "./driver.entity";
import {Enrollment} from "../enrollment/enrollment.entity";
import {Appointment} from "../appointment/appointment.entity";
import {AppointmentService} from "../appointment/appointment.service";
import {File} from "../file/file.entity";
import {FileService} from "../file/file.service";
import {DriverController} from "./driver.controller";
import {DriverService} from "./driver.service";
import {Addition} from "../addition/addition.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Driver, Addition, Enrollment, Appointment, File])],
    providers: [DriverService, AppointmentService, FileService],
    exports: [DriverService, AppointmentService, FileService],
    controllers: [DriverController],
})
export class DriverModule {
}
