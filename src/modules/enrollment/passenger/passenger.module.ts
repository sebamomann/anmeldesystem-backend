import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Passenger} from './passenger.entity';
import {Enrollment} from '../enrollment.entity';
import {Appointment} from '../../appointment/appointment.entity';
import {AppointmentService} from '../../appointment/appointment.service';
import {File} from '../../file/file.entity';
import {FileService} from '../../file/file.service';
import {PassengerController} from './passenger.controller';
import {PassengerService} from './passenger.service';
import {Addition} from '../../addition/addition.entity';
import {User} from '../../user/user.entity';
import {AdditionService} from '../../addition/addition.service';
import {UserModule} from '../../user/user.module';
import {AppointmentModule} from '../../appointment/appointment.module';

@Module({
    imports: [TypeOrmModule.forFeature([Passenger, Addition, Enrollment, Appointment, File, User]), UserModule, AppointmentModule],
    providers: [PassengerService, AppointmentService, FileService, AdditionService,],
    exports: [PassengerService, AppointmentService, FileService, AdditionService,],
    controllers: [PassengerController],
})
export class PassengerModule {
}
