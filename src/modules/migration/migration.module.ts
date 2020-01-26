import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
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
import {UserService} from "../user/user.service";
import {User} from "../user/user.entity";
import {Key} from "../enrollment/key/key.entity";
import {PassengerService} from "../enrollment/passenger/passenger.service";
import {TelegramUser} from "../user/telegram/telegram-user.entity";
import {AppointmentService} from "../appointment/appointment.service";
import {Appointment} from "../appointment/appointment.entity";
import {AppointmentController} from "../appointment/appointment.controller";
import {MigrationService} from "./migration.service";

@Module({
    imports: [TypeOrmModule.forFeature([Appointment, Addition, File, Comment, Enrollment, Driver, Passenger, User, Key, TelegramUser])],
    providers: [AppointmentService, AdditionService, CommentService, EnrollmentService, DriverService, UserService, PassengerService, MigrationService],
    exports: [AppointmentService, AdditionService, CommentService, EnrollmentService, DriverService, UserService, PassengerService, MigrationService],
    controllers: [AppointmentController],
})
export class MigrationModule {
}