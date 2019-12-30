import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AppointmentController} from "./appointment.controller";
import {Appointment} from "./appointment.entity";
import {AppointmentService} from "./appointment.service";
import {Addition} from "../addition/addition.entity";
import {File} from "../file/file.entity";
import {AdditionService} from "../addition/addition.service";
import {Comment} from "../enrollment/comment/comment.entity";
import {CommentService} from "../enrollment/comment/comment.service";
import {EnrollmentService} from "../enrollment/enrollment.service";
import {Enrollment} from "../enrollment/enrollment.entity";
import {Passenger} from "../enrollment/passenger/passenger.entity";
import {Driver} from "../enrollment/driver/driver.entity";
import {DriverService} from "../enrollment/driver/driver.service";

@Module({
    imports: [TypeOrmModule.forFeature([Appointment, Addition, File, Comment, Enrollment, Driver, Passenger])],
    providers: [AppointmentService, AdditionService, CommentService, EnrollmentService, DriverService],
    exports: [AppointmentService, AdditionService, CommentService, EnrollmentService, DriverService],
    controllers: [AppointmentController],
})
export class AppointmentModule {
}
