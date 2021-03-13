import {Module} from '@nestjs/common';
import {UserService} from './user.service';

@Module({
    imports: [],
    providers: [UserService],
    exports: [UserService],
    controllers: [],
})
export class UserModule {
}
