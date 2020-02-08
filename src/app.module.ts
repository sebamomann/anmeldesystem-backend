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
import {MigrationModule} from "./modules/migration/migration.module";
import {HandlebarsAdapter, MailerModule} from "@nest-modules/mailer";
import {PasswordReset} from "./modules/user/password-reset/password-reset.entity";
import * as path from 'path';
import {IcalModule} from "./modules/ical/ical.module";
import {ReleasenoteModule} from './modules/releasenote/releasenote.module';
import {Releasenote} from "./modules/releasenote/releasenote.entity";

require('dotenv').config();
const password = process.env.MAIL_ECA_PASSWORD;

@Module({
    imports: [TypeOrmModule.forRoot({
        type: 'mysql',
        host: process.env.API_HOST != null ? process.env.API_HOST : "localhost",
        port: 3306,
        username: process.env.API_USERNAME != null ? process.env.API_USERNAME : "root",
        password: process.env.API_PASSWORD != null ? process.env.API_PASSWORD : "",
        database: process.env.API_DATABASE != null ? process.env.API_DATABASE : "anmeldesystem-api",
        entities: [User, Appointment, Enrollment, Addition, File, Driver, Passenger, Comment, Key,
            TelegramUser, PasswordReset, Releasenote],
        synchronize: true
    }),
        MailerModule.forRoot({
            transport: 'smtps://no-reply@eca.cg-hh.de:' + password + '@cp.dankoe.de',
            defaults: {
                from: '"ECA-Bot" <no-reply@eca.cg-hh.de>',
            },
            template: {
                dir: path.resolve(__dirname, 'templates'),
                adapter: new HandlebarsAdapter(), // or new PugAdapter()
                options: {
                    strict: true,
                },
            },
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
        MigrationModule,
        IcalModule,
        ReleasenoteModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    constructor(private readonly connection: Connection) {
    }
}
