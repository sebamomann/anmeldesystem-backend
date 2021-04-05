import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Administrator} from './administrator.entity';
import {AdministratorService} from './administrator.service';

@Module({
    imports: [TypeOrmModule.forFeature([Administrator])],
    providers: [AdministratorService],
    exports: [AdministratorService],
    controllers: [],
})
export class AdministratorModule {
}
