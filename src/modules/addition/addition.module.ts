import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AdditionController} from "./Addition.controller";
import {AdditionService} from "./Addition.service";
import {Addition} from "./Addition.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Addition])],
    providers: [AdditionService],
    exports: [AdditionService],
    controllers: [AdditionController],
})
export class AdditionModule {
}
