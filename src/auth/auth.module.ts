import {forwardRef, Module} from '@nestjs/common';
import {UserModule} from '../modules/user/user.module';
import {LocalStrategy} from './local.strategy';
import {JwtModule} from '@nestjs/jwt';
import {jwtConstants} from './constants';
import {JwtStrategy} from './jwt.strategy';
import {AuthService} from './auth.service';

@Module({
    imports: [
        forwardRef(() => UserModule),
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: {expiresIn: '15m'},
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {
}
