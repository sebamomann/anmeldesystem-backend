import {forwardRef, Module} from '@nestjs/common';
import {PushController} from './push.controller';
import {PushService} from './push.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {PushSubscription} from './pushSubscription.entity';
import {AppointmentModule} from '../appointment/appointment.module';

@Module({
    imports: [TypeOrmModule.forFeature([PushSubscription]), forwardRef(() => AppointmentModule)],
    controllers: [PushController],
    exports: [PushService],
    providers: [PushService]
})
export class PushModule {
}
