import {HttpModule, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {FileController} from './file.controller';
import {File} from './file.entity';
import {FileService} from './file.service';
import {AppointmentModule} from '../appointment/appointment.module';
import {AuthModule} from '../../auth/auth.module';

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([File]), AppointmentModule, HttpModule],
    providers: [FileService],
    exports: [FileService],
    controllers: [FileController],
})
export class FileModule {
}
