import {forwardRef, HttpModule, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Administrator} from './administrator.entity';
import {AdministratorService} from './administrator.service';
import {AppointmentModule} from '../appointment/appointment.module';
import {AdministratorController} from './adminsitrator.controller';
import {AuthModule} from '../../auth/auth.module';
import {UserModule} from '../user/user.module';

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([Administrator]), forwardRef(() => AppointmentModule), UserModule, HttpModule],
    providers: [AdministratorService],
    exports: [AdministratorService],
    controllers: [AdministratorController],
})
export class AdministratorModule {
}
