import {forwardRef, Module} from '@nestjs/common';
import {AuthService} from './auth.service';
import {UserModule} from '../modules/user/user.module';
import {LocalStrategy} from './local.strategy';
import {JwtModule} from '@nestjs/jwt';
import {jwtConstants} from './constants';
import {JwtStrategy} from './jwt.strategy';

@Module({
    imports: [
        forwardRef(() => UserModule),
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: {expiresIn: '15s'},
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {
}
