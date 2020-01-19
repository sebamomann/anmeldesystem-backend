import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AdditionController} from './addition.controller';
import {AdditionService} from "./addition.service";
import {Addition} from "./addition.entity";
import {Enrollment} from "../enrollment/enrollment.entity";
import {Appointment} from "../appointment/appointment.entity";
import {AppointmentService} from "../appointment/appointment.service";
import {File} from "../file/file.entity";
import {FileService} from "../file/file.service";
import {User} from "../user/user.entity";
import {Key} from "../enrollment/key/key.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Addition, Enrollment, Appointment, File, User, Key])],
    providers: [AdditionService, AppointmentService, FileService],
    exports: [AdditionService, AppointmentService, FileService],
    controllers: [AdditionController],
})
export class AdditionModule {
}
