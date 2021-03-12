import {Module} from '@nestjs/common';
import {User} from './user.entity';
import {TypeOrmModule} from '@nestjs/typeorm';
import {UserService} from './user.service';
import {AuthModule} from '../../auth/auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]), AuthModule],
    providers: [UserService],
    exports: [UserService],
    controllers: [],
})
export class UserModule {
}
