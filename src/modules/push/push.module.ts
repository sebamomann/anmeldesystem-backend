import {forwardRef, Module} from '@nestjs/common';
import {PushController} from './push.controller';
import {PushService} from './push.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {PushSubscription} from './pushSubscription.entity';
import {AppointmentModule} from '../appointment/appointment.module';
import {AuthModule} from '../../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([PushSubscription]), forwardRef(() => AppointmentModule), AuthModule],
    controllers: [PushController],
    exports: [PushService],
    providers: [PushService]
})
export class PushModule {
}
