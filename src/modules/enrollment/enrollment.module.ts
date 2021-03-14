import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Enrollment} from './enrollment.entity';
import {EnrollmentController} from './enrollment.controller';
import {EnrollmentService} from './enrollment.service';
import {Mail} from './mail/mail.entity';
import {DriverModule} from './driver/driver.module';
import {PassengerModule} from './passenger/passenger.module';
import {CommentModule} from './comment/comment.module';
import {AppointmentModule} from '../appointment/appointment.module';
import {AdditionModule} from '../addition/addition.module';
import {UserModule} from '../user/user.module';
import {AuthModule} from '../../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Enrollment, Mail]), AuthModule, AppointmentModule, AdditionModule, DriverModule, PassengerModule, CommentModule, UserModule],
    providers: [EnrollmentService],
    exports: [EnrollmentService],
    controllers: [EnrollmentController],
})
export class EnrollmentModule {
}
