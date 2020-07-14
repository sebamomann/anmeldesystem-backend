import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Driver} from './driver.entity';
import {Enrollment} from '../enrollment.entity';
import {Appointment} from '../../appointment/appointment.entity';
import {AppointmentService} from '../../appointment/appointment.service';
import {File} from '../../file/file.entity';
import {FileService} from '../../file/file.service';
import {DriverController} from './driver.controller';
import {DriverService} from './driver.service';
import {Addition} from '../../addition/addition.entity';
import {User} from '../../user/user.entity';
import {Key} from '../key/key.entity';
import {AdditionService} from '../../addition/addition.service';
import {UserService} from '../../user/user.service';
import {UserModule} from '../../user/user.module';
import {TelegramUser} from '../../user/telegram/telegram-user.entity';
import {PasswordReset} from '../../user/password-reset/password-reset.entity';
import {EmailChange} from '../../user/email-change/email-change.entity';
import {PasswordChange} from '../../user/password-change/password-change.entity';
import {Session} from '../../user/session.entity';
import {AppointmentModule} from '../../appointment/appointment.module';

@Module({
    imports: [TypeOrmModule.forFeature([Driver, Addition, Enrollment, Session, Appointment, File, User, Key, TelegramUser, PasswordReset, PasswordChange, EmailChange]), UserModule, AppointmentModule],
    providers: [DriverService, AdditionService, AppointmentService, FileService, UserService],
    exports: [DriverService, AdditionService, AppointmentService, FileService, UserService],
    controllers: [DriverController],
})
export class DriverModule {
}
