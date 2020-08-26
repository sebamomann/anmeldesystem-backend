import {Injectable} from '@nestjs/common';
import {UserService} from '../user/user.service';
import {AppointmentService} from '../appointment/appointment.service';

var crypto = require('crypto');

@Injectable()
export class IcalService {
    constructor(private userService: UserService, private appointmentService: AppointmentService) {

    }

    async get(mail: string, token: string) {
        const ical = require('ical-generator');
        const cal = ical({
            domain: process.env.domain + "/ical",
            name: 'Anmeldesystem',
            url: process.env.domain + "/ical"
        });

        const user = await this.userService.findByEmail(mail);

        if (user != undefined) {
            console.log("user exists");
            const hash = crypto
                .createHash('sha256')
                .update(mail)
                .digest('base64')
                .substr(0, 27);

            if (hash === token) {
                console.log("hash valid");
                const appointments = await this.appointmentService.getAll(user, {}, true, null, null);

                appointments.forEach(fAppointment => {
                    cal.createEvent({
                        start: fAppointment.date,
                        end: new Date(fAppointment.date.getTime() + 3600000),
                        summary: fAppointment.title,
                        description: fAppointment.date,
                        location: fAppointment.location,
                        url: process.env.DOMAIN + "/" + fAppointment.link
                    });
                });

                return cal.toString();
            }

            return "";
        } else {
            return "";
        }
    }
}
