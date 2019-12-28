import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Connection} from 'typeorm';
import {User} from "./modules/user/user.entity";
import {UserModule} from "./modules/user/user.module";

@Module({
    imports: [TypeOrmModule.forRoot({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: '',
        database: 'anmeldesystem-api',
        entities: [User],
        synchronize: true
    }),
        UserModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    constructor(private readonly connection: Connection) {
    }
}
