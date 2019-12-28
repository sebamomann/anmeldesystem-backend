import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Enrollment} from "./enrollment.entity";
import {EnrollmentController} from "./enrollment.controller";
import {EnrollmentService} from "./enrollment.service";
import {AppointmentService} from "../appointment/appointment.service";
import {Appointment} from "../appointment/appointment.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Enrollment, Appointment])],
    providers: [EnrollmentService, AppointmentService],
    exports: [EnrollmentService, AppointmentService],
    controllers: [EnrollmentController],
})
export class EnrollmentModule {
}
