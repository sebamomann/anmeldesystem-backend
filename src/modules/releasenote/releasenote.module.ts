import {Module} from '@nestjs/common';
import {ReleasenoteService} from './releasenote.service';
import {ReleasenoteController} from './releasenote.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Releasenote} from "./releasenote.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Releasenote])],
    providers: [ReleasenoteService],
    controllers: [ReleasenoteController]
})
export class ReleasenoteModule {
}
