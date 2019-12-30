import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AdditionController} from "./Addition.controller";
import {AdditionService} from "./Addition.service";
import {Addition} from "./Addition.entity";
import {Enrollment} from "../enrollment/enrollment.entity";
import {Appointment} from "../appointment/appointment.entity";
import {AppointmentService} from "../appointment/appointment.service";
import {File} from "../file/file.entity";
import {FileService} from "../file/file.service";

@Module({
    imports: [TypeOrmModule.forFeature([Addition, Enrollment, Appointment, File])],
    providers: [AdditionService, AppointmentService, FileService],
    exports: [AdditionService, AppointmentService, FileService],
    controllers: [AdditionController],
})
export class AdditionModule {
}
