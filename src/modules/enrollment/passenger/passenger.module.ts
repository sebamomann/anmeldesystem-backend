import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Passenger} from './passenger.entity';
import {PassengerController} from './passenger.controller';
import {PassengerService} from './passenger.service';

@Module({
    imports: [TypeOrmModule.forFeature([Passenger])],
    providers: [PassengerService],
    exports: [PassengerService],
    controllers: [PassengerController],
})
export class PassengerModule {
}
