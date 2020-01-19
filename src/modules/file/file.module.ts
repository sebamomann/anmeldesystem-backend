import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {FileController} from "./file.controller";
import {File} from "./file.entity";
import {FileService} from "./file.service";
import {Addition} from "../addition/addition.entity";
import {AdditionService} from "../addition/addition.service";

@Module({
    imports: [TypeOrmModule.forFeature([File, Addition])],
    providers: [FileService, AdditionService],
    exports: [FileService, AdditionService],
    controllers: [FileController],
})
export class FileModule {
}
