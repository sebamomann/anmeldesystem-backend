import { AppointmentModule } from './../appointment/appointment.module';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdditionController } from './addition.controller';
import { AdditionService } from './addition.service';
import { Addition } from './addition.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Addition])],
    providers: [AdditionService],
    exports: [AdditionService],
    controllers: [AdditionController],
})
export class AdditionModule {
}
