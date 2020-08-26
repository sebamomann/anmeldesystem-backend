import {InvalidValuesException} from '../../exceptions/InvalidValuesException';
import {Appointment} from './appointment.entity';
import {User} from '../user/user.entity';
import {Enrollment} from '../enrollment/enrollment.entity';

const crypto = require('crypto');

export class AppointmentUtil {
    /**
     * Compare deadline and set date, to check if the date is before the deadline
     *
     * @param date Date of appointment
     * @param deadline Date deadline of appointment
     */
    public static handleDateValidation(date, deadline) {
        if (Date.parse(date) < Date.parse(deadline)) {
            throw new InvalidValuesException(null, 'The date can not be before the deadline', ['date']);
        }

        return date;
    }

    /**
     * Compare deadline and set date, to check if the deadline is after the appointment date
     *
     * @param date Date of appointment
     * @param deadline Date deadline of appointment
     */
    public static handleDeadlineValidation(date, deadline) {
        if (Date.parse(deadline) > Date.parse(date)) {
            throw new InvalidValuesException(null, 'The deadline can not be after the date', ['deadline']);
        }

        return deadline;
    }

    /**
     * Check if passed user is the creator or administrator of the given appointment
     *
     * @param appointment Appointment to check permission for
     * @param user User to check ownership for
     */
    public static isCreatorOrAdministrator(appointment: Appointment, user: User) {
        return this.isCreatorOfAppointment(appointment, user)
            || this.isAdministratorOfAppointment(appointment, user);

    }

    /**
     * Check if passed user is the creator of the given appointment
     *
     * @param appointment Appointment to check ownership for
     * @param user User to check ownership for
     */
    public static isCreatorOfAppointment(appointment: Appointment, user: User) {
        if (user === undefined || user === null || !user) {
            return false;
        }

        return appointment.creator.username === user.username;
    }

    /**
     * Check if passed user is administrator of the given appointment
     *
     * @param appointment Appointment to check ownership for
     * @param user User to check ownership for
     */
    public static isAdministratorOfAppointment(appointment: Appointment, user: User) {
        if (user === undefined || user === null || !user) {
            return false;
        }

        return appointment.administrators?.some(sAdministrator => sAdministrator.username === user.username);
    }

    /**
     * Check the users correlation to the appointment. <br />
     * Following correlations (references) are possible
     * <ol>
     *     <li>CREATOR</li>
     *     <li>ADMIN</li>
     *     <li>ENROLLED</li>
     *     <li>PINNED</li>
     * </ol>
     * Note that a permission granted via passing a link is also marked as "PINNED".<br/>
     * Multiple correlations are possible. Two references of the same type are not possible
     *
     * @param user Requester (if existing) to correlate
     * @param appointment Appointment to correlate user with
     * @param pins Links of pinned Appointments (passed via query parameter)
     *
     * @returns string[] Array of all correlations regarding User and Appointment
     */
    public static parseReferences(user: User, appointment: Appointment, pins: string[]) {
        const references = [];

        if (user === null) {
            return [];
        }

        if (AppointmentUtil.isAdministratorOfAppointment(appointment, user)) {
            references.push('ADMIN');
        }

        if (AppointmentUtil.isCreatorOfAppointment(appointment, user)) {
            references.push('CREATOR');
        }

        if (appointment.enrollments !== undefined
            && appointment.enrollments.some(sEnrollment => {
                return sEnrollment.creator != null
                    && sEnrollment.creator.id === user.id;
            })) {
            references.push('ENROLLED');
        }

        if ((appointment.pinners !== undefined
            && appointment.pinners.some(sPinner => sPinner.id === user.id))
            || pins.includes(appointment.link)) {
            references.push('PINNED');
        }

        return references;
    }

    /**
     * Filters out all enrollments, the requester is not allowed to see.<br />
     * Done by validation the enrollment query parameters (id and token) passed with te request.
     * If the token is valid and the enrollment id exists in the enrollments array, then return it.<br/>
     * <br />
     * The query parameters are determined by the starting sequence `perm` and `token`
     * <br />
     * `perm` for the id (e.g. perm1, perm2, perm3) <br />
     * `token` for the validation token of the id (e.g. token1, token2, token3) <br/>
     * <br />
     *
     * IMPORTANT - The order of the ids with their corresponding token is important!.
     * The second id passed, will be verified with the second PASSED token (not token number)!
     *
     * @param permissions All raw query parameters
     * @param enrollments Enrollments to filter
     *
     * @returns Enrollment[] ALl filtered enrollments
     */
    public static filterPermittedEnrollments(permissions: any, enrollments: Enrollment[]) {
        let extractedIds = [];
        let extractedTokens = [];
        for (const queryKey of Object.keys(permissions)) {
            if (queryKey.startsWith('perm')) {
                extractedIds.push(permissions[queryKey]);
            } else if (queryKey.startsWith('token')) {
                extractedTokens.push(permissions[queryKey]);
            }
        }

        let validIds = [];
        extractedIds.forEach((fId, i) => {
            const token = crypto.createHash('sha256')
                .update(fId + process.env.SALT_ENROLLMENT)
                .digest('hex');
            if (extractedTokens[i] !== undefined
                && token === extractedTokens[i].replace(' ', '+')) {
                validIds.push(fId);
            }
        });

        return enrollments.filter(fEnrollment => {
            if (validIds.includes(fEnrollment.id)) {
                return fEnrollment;
            }
        });
    }
}
