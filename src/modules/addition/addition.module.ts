import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AdditionController} from './addition.controller';
import {AdditionService} from './addition.service';
import {Addition} from './addition.entity';
import {Enrollment} from '../enrollment/enrollment.entity';
import {Appointment} from '../appointment/appointment.entity';
import {AppointmentService} from '../appointment/appointment.service';
import {File} from '../file/file.entity';
import {FileService} from '../file/file.service';
import {User} from '../user/user.entity';
import {Key} from '../enrollment/key/key.entity';
import {UserService} from '../user/user.service';
import {TelegramUser} from '../user/telegram/telegram-user.entity';
import {PasswordReset} from '../user/password-reset/password-reset.entity';
import {EmailChange} from '../user/email-change/email-change.entity';
import {PasswordChange} from '../user/password-change/password-change.entity';
import {Session} from '../user/session.entity';
import {AppointmentModule} from '../appointment/appointment.module';

@Module({
    imports: [TypeOrmModule.forFeature([Addition, Enrollment, Appointment, File, User, Key, TelegramUser, PasswordReset, PasswordChange, EmailChange, Session]), AppointmentModule],
    providers: [AdditionService, AppointmentService, FileService, UserService],
    exports: [AdditionService, AppointmentService, FileService, UserService],
    controllers: [AdditionController],
})
export class AdditionModule {
}
