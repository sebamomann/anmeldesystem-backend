import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AppointmentService} from "../appointment/appointment.service";
import {Appointment} from "../appointment/appointment.entity";
import {Addition} from "../addition/addition.entity";
import {File} from "../file/file.entity";
import {AdditionService} from "../addition/addition.service";
import {FileService} from "../file/file.service";
import {User} from "../user/user.entity";
import {IcalService} from "./ical.service";
import {PassengerService} from "../enrollment/passenger/passenger.service";
import {DriverService} from "../enrollment/driver/driver.service";
import {CommentService} from "../enrollment/comment/comment.service";
import {EnrollmentService} from "../enrollment/enrollment.service";
import {Key} from "../enrollment/key/key.entity";
import {Passenger} from "../enrollment/passenger/passenger.entity";
import {Driver} from "../enrollment/driver/driver.entity";
import {Enrollment} from "../enrollment/enrollment.entity";
import {Comment} from "../enrollment/comment/comment.entity";
import {UserService} from "../user/user.service";
import {TelegramUser} from "../user/telegram/telegram-user.entity";
import {PasswordReset} from "../user/password-reset/password-reset.entity";
import {IcalController} from "./ical.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Enrollment, Appointment, Addition, File, Driver, Passenger, Comment, User, Key, TelegramUser, PasswordReset])],
    providers: [UserService, EnrollmentService, AppointmentService, AdditionService, FileService, CommentService, DriverService, PassengerService, IcalService],
    exports: [EnrollmentService, AppointmentService, AdditionService, FileService, CommentService, DriverService, PassengerService, IcalService],
    controllers: [IcalController],
})
export class IcalModule {
}
