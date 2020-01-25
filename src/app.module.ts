import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Connection} from 'typeorm';
import {User} from "./modules/user/user.entity";
import {UserModule} from "./modules/user/user.module";
import {Appointment} from "./modules/appointment/appointment.entity";
import {AppointmentModule} from "./modules/appointment/appointment.module";
import {EnrollmentModule} from "./modules/enrollment/enrollment.module";
import {Enrollment} from "./modules/enrollment/enrollment.entity";
import {Addition} from "./modules/addition/addition.entity";
import {AdditionModule} from "./modules/addition/addition.module";
import {FileModule} from "./modules/file/file.module";
import {File} from "./modules/file/file.entity";
import {DriverModule} from "./modules/enrollment/driver/driver.module";
import {Driver} from "./modules/enrollment/driver/driver.entity";
import {Passenger} from "./modules/enrollment/passenger/passenger.entity";
import {CommentModule} from "./modules/enrollment/comment/comment.module";
import {Comment} from "./modules/enrollment/comment/comment.entity";
import {PassengerModule} from "./modules/enrollment/passenger/passenger.module";
import {AuthModule} from './auth/auth.module';
import {Key} from "./modules/enrollment/key/key.entity";
import {TelegramUser} from "./modules/user/telegram/telegram-user.entity";

@Module({
    imports: [TypeOrmModule.forRoot({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: '',
        database: 'anmeldesystem-api',
        entities: [User, Appointment, Enrollment, Addition, File, Driver, Passenger, Comment, Key, TelegramUser],
        synchronize: true
    }),
        UserModule,
        AppointmentModule,
        EnrollmentModule,
        AdditionModule,
        FileModule,
        DriverModule,
        PassengerModule,
        CommentModule,
        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    constructor(private readonly connection: Connection) {
    }
}
