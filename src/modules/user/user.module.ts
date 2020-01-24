import {Module} from '@nestjs/common';
import {User} from "./user.entity";
import {TypeOrmModule} from '@nestjs/typeorm';
import {UserController} from "./user.controller";
import {UserService} from "./user.service";
import {TelegramUser} from "./telegram/telegram-user.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User, TelegramUser])],
    providers: [UserService],
    exports: [UserService],
    controllers: [UserController],
})
export class UserModule {
}
