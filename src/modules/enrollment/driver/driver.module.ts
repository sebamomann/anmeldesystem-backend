import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Driver} from "./driver.entity";
import {Enrollment} from "../enrollment.entity";
import {Appointment} from "../../appointment/appointment.entity";
import {AppointmentService} from "../../appointment/appointment.service";
import {File} from "../../file/file.entity";
import {FileService} from "../../file/file.service";
import {DriverController} from "./driver.controller";
import {DriverService} from "./driver.service";
import {Addition} from "../../addition/addition.entity";
import {User} from "../../user/user.entity";
import {Key} from "../key/key.entity";
import {AdditionService} from "../../addition/addition.service";

@Module({
    imports: [TypeOrmModule.forFeature([Driver, Addition, Enrollment, Appointment, File, User, Key])],
    providers: [DriverService, AdditionService, AppointmentService, FileService],
    exports: [DriverService, AdditionService, AppointmentService, FileService],
    controllers: [DriverController],
})
export class DriverModule {
}
