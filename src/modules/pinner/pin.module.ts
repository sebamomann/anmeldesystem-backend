import {HttpModule, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AppointmentModule} from '../appointment/appointment.module';
import {AuthModule} from '../../auth/auth.module';
import {Pinner} from './pinner.entity';
import {PinService} from './pin.service';
import {PinController} from './pin.controller';

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([Pinner]), AppointmentModule, HttpModule],
    providers: [PinService],
    exports: [PinService],
    controllers: [PinController],
})
export class PinModule {
}
