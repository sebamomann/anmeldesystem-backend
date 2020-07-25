import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AppointmentController} from './appointment.controller';
import {Appointment} from './appointment.entity';
import {AppointmentService} from './appointment.service';
import {AdditionModule} from '../addition/addition.module';
import {FileModule} from '../file/file.module';
import {UserModule} from '../user/user.module';
import {AppointmentGateway} from './appointment.gateway';

@Module({
    imports: [TypeOrmModule.forFeature([Appointment]), AdditionModule, FileModule, UserModule],
    providers: [AppointmentService, AppointmentGateway],
    exports: [AppointmentService, AppointmentGateway],
    controllers: [AppointmentController],
})
export class AppointmentModule {
}
