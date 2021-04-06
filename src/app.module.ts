import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule} from '@nestjs/typeorm';
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
import {PushModule} from './modules/push/push.module';
import {AdministratorModule} from './modules/adminsitrator/adminsitrator.module';
import {PinModule} from './modules/pinner/pin.module';

require('dotenv').config();

const password = process.env.MAIL_GJM_PASSWORD;
const _mail = process.env.MAIL_GJM;

@Module({
    imports: [
        TypeOrmModule.forRoot(),
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
        AuthModule,
        AdministratorModule,
        UserModule,
        PinModule,
        AppointmentModule,
        AdditionModule,
        EnrollmentModule,
        FileModule,
        DriverModule,
        PassengerModule,
        CommentModule,
        ReleasenoteModule,
        PushModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
    constructor() {
    }
}
