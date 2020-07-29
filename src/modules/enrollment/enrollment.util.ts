import {Enrollment} from './enrollment.entity';
import {Appointment} from '../appointment/appointment.entity';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {User} from '../user/user.entity';
import {AppointmentUtil} from '../appointment/appointment.util';

const crypto = require('crypto');

export class EnrollmentUtil {
    public static hasPermission(enrollment: Enrollment, user: User, token: string) {
        let allowEditByUserId = EnrollmentUtil.permissionByUser(enrollment, user);
        let isAllowedByKey = EnrollmentUtil.permissionByToken(enrollment, token);

        return allowEditByUserId || isAllowedByKey;
    }

    public static permissionByUser(enrollment: Enrollment, user: User) {
        let isAllowedByAppointmentPermission = AppointmentUtil.isCreatorOrAdministrator(enrollment.appointment, user);
        let isCreatorOfEnrollment = EnrollmentUtil.isCreator(enrollment, user);

        return isAllowedByAppointmentPermission || isCreatorOfEnrollment;
    }

    public static permissionByToken(enrollment: Enrollment, token: string) {
        const check = crypto.createHash('sha256')
            .update(enrollment.id + process.env.SALT_ENROLLMENT)
            .digest('hex');

        return token !== null
            && token !== undefined
            && (token.replace(' ', '+') === check);
    }

    public static isCreator(enrollment: Enrollment, user: User) {
        return enrollment.creator !== undefined
            && enrollment.creator !== null
            && enrollment.creator.id === user.id;
    }

    public static filterValidAdditions(enrollment: Enrollment, appointment: Appointment) {
        let output = [];

        if (Array.isArray(enrollment.additions)) {
            for (const fAddition of enrollment.additions) {
                const additions = appointment.additions.filter(filterAddition => filterAddition.id === fAddition.id);

                if (additions.length > 0) {
                    output.push(additions[0]);
                } else {
                    throw new EntityNotFoundException(null,
                        'The following addition can not be found in the appointment',
                        JSON.stringify(fAddition));
                }
            }
        }

        return output;
    }
}
