import {HttpModule, Module} from '@nestjs/common';
import {AuthGuard} from './auth.gurad';
import {AuthOptGuard} from './auth-opt.gurad';

@Module({
    imports: [HttpModule],
    controllers: [],
    providers: [AuthGuard, AuthOptGuard],
    exports: [AuthGuard, AuthOptGuard]
})
export class AuthModule {
}
