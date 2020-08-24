import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Driver} from './driver.entity';
import {DriverController} from './driver.controller';
import {DriverService} from './driver.service';

@Module({
    imports: [TypeOrmModule.forFeature([Driver])],
    providers: [DriverService],
    exports: [DriverService],
    controllers: [DriverController],
})
export class DriverModule {
}
