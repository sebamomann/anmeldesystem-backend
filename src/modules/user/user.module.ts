import {Module} from '@nestjs/common';
import {User} from "./user.entity";
import {TypeOrmModule} from '@nestjs/typeorm';
import {UserController} from "./user.controller";
import {UserService} from "./user.service";
import {TelegramUser} from "./telegram/telegram-user.entity";
import {PasswordReset} from "./password-reset/password-reset.entity";
import {AuthModule} from "../../auth/auth.module";

@Module({
    imports: [TypeOrmModule.forFeature([User, TelegramUser, PasswordReset]), AuthModule],
    providers: [UserService],
    exports: [UserService],
    controllers: [UserController],
})
export class UserModule {
}
