import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Enrollment} from './enrollment.entity';
import {EnrollmentController} from './enrollment.controller';
import {EnrollmentService} from './enrollment.service';
import {AppointmentService} from '../appointment/appointment.service';
import {Appointment} from '../appointment/appointment.entity';
import {Addition} from '../addition/addition.entity';
import {File} from '../file/file.entity';
import {AdditionService} from '../addition/addition.service';
import {FileService} from '../file/file.service';
import {Driver} from './driver/driver.entity';
import {Passenger} from './passenger/passenger.entity';
import {CommentService} from './comment/comment.service';
import {Comment} from './comment/comment.entity';
import {DriverService} from './driver/driver.service';
import {User} from '../user/user.entity';
import {Key} from './key/key.entity';
import {PassengerService} from './passenger/passenger.service';
import {UserService} from '../user/user.service';
import {TelegramUser} from '../user/telegram/telegram-user.entity';
import {PasswordReset} from '../user/password-reset/password-reset.entity';
import {EmailChange} from '../user/email-change/email-change.entity';
import {Mail} from './mail/mail.entity';
import {PasswordChange} from '../user/password-change/password-change.entity';
import {Session} from '../user/session.entity';
import {AppointmentModule} from '../appointment/appointment.module';

@Module({
    imports: [TypeOrmModule.forFeature([Enrollment, Appointment, Addition, File, Driver, Passenger, Comment, User, Session, Key, Mail, TelegramUser, PasswordReset, PasswordChange, EmailChange]), AppointmentModule],
    providers: [EnrollmentService, AppointmentService, AdditionService, FileService, CommentService, DriverService, PassengerService, UserService],
    exports: [EnrollmentService, AppointmentService, AdditionService, FileService, CommentService, DriverService, PassengerService, UserService],
    controllers: [EnrollmentController],
})
export class EnrollmentModule {
}
