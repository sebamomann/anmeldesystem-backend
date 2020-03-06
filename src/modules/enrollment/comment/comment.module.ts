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
import {User} from "../../user/user.entity";
import {Key} from "../key/key.entity";
import {PassengerService} from "../passenger/passenger.service";
import {DriverService} from "../driver/driver.service";
import {UserModule} from "../../user/user.module";
import {Mail} from "../mail/mail.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Comment, Addition, Enrollment, Appointment,
        File, Comment, Driver, Passenger, User, Key, Mail]), UserModule],
    providers: [CommentService, AppointmentService, FileService, EnrollmentService, AdditionService, PassengerService, DriverService],
    exports: [CommentService, AppointmentService, FileService, EnrollmentService, AdditionService, PassengerService, DriverService],
    controllers: [CommentController],
})
export class CommentModule {
}
