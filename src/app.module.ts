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
import {EmailChange} from "./modules/user/email-change/email-change.entity";
import {Mail} from "./modules/enrollment/mail/mail.entity";
import {PasswordChange} from "./modules/user/password-change/password-change.entity";

require('dotenv').config();
const password = process.env.MAIL_ECA_PASSWORD;
const _mail = process.env.MAIL_ECA;


@Module({
    imports: [TypeOrmModule.forRoot({
        type: 'mysql',
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [User, Appointment, Enrollment, Addition, File, Driver, Passenger, Comment, Key,
            TelegramUser, PasswordReset, Releasenote, EmailChange, Mail, PasswordChange,],
        synchronize: true
    }),
        MailerModule.forRoot({
            transport: 'smtps://' + _mail + ':' + password + '@cp.dankoe.de',
            defaults: {
                from: '"ECA-Bot" <' + _mail + '>',
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
