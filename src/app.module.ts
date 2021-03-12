import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Connection} from 'typeorm';
import {UserModule} from './modules/user/user.module';
import {AppointmentModule} from './modules/appointment/appointment.module';
import {EnrollmentModule} from './modules/enrollment/enrollment.module';
import {AdditionModule} from './modules/addition/addition.module';
import {FileModule} from './modules/file/file.module';
import {DriverModule} from './modules/enrollment/driver/driver.module';
import {CommentModule} from './modules/enrollment/comment/comment.module';
import {PassengerModule} from './modules/enrollment/passenger/passenger.module';
import {AuthModule} from './auth/auth.module';
import {HandlebarsAdapter, MailerModule} from '@nest-modules/mailer';
import * as path from 'path';
import {ReleasenoteModule} from './modules/releasenote/releasenote.module';
import {PushController} from './modules/push/push.controller';
import {PushModule} from './modules/push/push.module';

require('dotenv').config();
const password = process.env.MAIL_ECA_PASSWORD;
const _mail = process.env.MAIL_ECA;

@Module({
    imports: [TypeOrmModule.forRoot(),
        MailerModule.forRoot({
            transport: 'smtps://' + _mail + ':' + password + '@cp.dankoe.de',
            defaults: {
                from: '"Seba Momann" <' + _mail + '>',
            },
            template: {
                dir: path.resolve(__dirname, 'templates'),
                adapter: new HandlebarsAdapter(),
                options: {
                    strict: true,
                },
            },
        }),
        UserModule,
        AppointmentModule,
        AdditionModule,
        EnrollmentModule,
        FileModule,
        DriverModule,
        PassengerModule,
        CommentModule,
        AuthModule,
        ReleasenoteModule,
        PushModule,
    ],
    controllers: [AppController, PushController],
    providers: [AppService],
})
export class AppModule {
    constructor(private readonly connection: Connection) {
    }
}
