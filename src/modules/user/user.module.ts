import {Module} from '@nestjs/common';
import {User} from './user.entity';
import {TypeOrmModule} from '@nestjs/typeorm';
import {UserController} from './user.controller';
import {UserService} from './user.service';
import {TelegramUser} from './telegram/telegram-user.entity';
import {PasswordReset} from './password-reset/password-reset.entity';
import {AuthModule} from '../../auth/auth.module';
import {EmailChange} from './email-change/email-change.entity';
import {PasswordChange} from './password-change/password-change.entity';
import {Session} from './session.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, TelegramUser, PasswordReset, PasswordChange, EmailChange, Session]), AuthModule],
    providers: [UserService],
    exports: [UserService],
    controllers: [UserController],
})
export class UserModule {
}
