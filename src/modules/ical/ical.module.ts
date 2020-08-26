import {Module} from '@nestjs/common';
import {IcalController} from './ical.controller';
import {AppointmentModule} from '../appointment/appointment.module';
import {UserModule} from '../user/user.module';
import {IcalService} from './ical.service';

@Module({
    imports: [UserModule, AppointmentModule],
    providers: [IcalService],
    exports: [IcalService],
    controllers: [IcalController],
})
export class IcalModule {
}
