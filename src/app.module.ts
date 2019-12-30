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
import {DriverModule} from "./modules/driver/driver.module";
import {Driver} from "./modules/driver/driver.entity";
import {Passenger} from "./modules/passenger/passenger.entity";

@Module({
    imports: [TypeOrmModule.forRoot({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: '',
        database: 'anmeldesystem-api',
        entities: [User, Appointment, Enrollment, Addition, File, Driver, Passenger],
        synchronize: true
    }),
        UserModule,
        AppointmentModule,
        EnrollmentModule,
        AdditionModule,
        FileModule,
        DriverModule,
        Passenger
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    constructor(private readonly connection: Connection) {
    }
}
