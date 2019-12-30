import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Comment} from "./comment.entity";
import {Enrollment} from "../enrollment.entity";
import {Appointment} from "../../appointment/appointment.entity";
import {AppointmentService} from "../../appointment/appointment.service";
import {File} from "../../file/file.entity";
import {FileService} from "../../file/file.service";
import {CommentController} from "./comment.controller";
import {CommentService} from "./comment.service";
import {Addition} from "../../addition/addition.entity";
import {EnrollmentService} from "../enrollment.service";
import {AdditionService} from "../../addition/addition.service";
import {Passenger} from "../passenger/passenger.entity";
import {Driver} from "../driver/driver.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Comment, Addition, Enrollment, Appointment, File, Comment, Driver, Passenger])],
    providers: [CommentService, AppointmentService, FileService, EnrollmentService, AdditionService],
    exports: [CommentService, AppointmentService, FileService, EnrollmentService, AdditionService],
    controllers: [CommentController],
})
export class CommentModule {
}
