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
import {AdditionController} from './modules/addition/addition.controller';
import {AdditionService} from './modules/addition/addition.service';
import {Addition} from "./modules/addition/addition.entity";
import {AdditionModule} from "./modules/addition/addition.module";

@Module({
    imports: [TypeOrmModule.forRoot({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: '',
        database: 'anmeldesystem-api',
        entities: [User, Appointment, Enrollment, Addition
        ],
        synchronize: true
    }),
        UserModule,
        AppointmentModule,
        EnrollmentModule,
        AdditionModule
    ],
    controllers: [AppController, AdditionController],
    providers: [AppService, AdditionService],
})
export class AppModule {
    constructor(private readonly connection: Connection) {
    }
}
