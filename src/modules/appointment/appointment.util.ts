import {InvalidValuesException} from '../../exceptions/InvalidValuesException';
import {Appointment} from './appointment.entity';
import {User} from '../user/user.entity';

export class AppointmentUtil {
    /**
     * Compare deadline and set date, to check if the date is before the deadline
     *
     * @param date Date of appointment
     * @param deadline Date deadline of appointment
     */
    public static handleDateValidation(date, deadline) {
        if (date < deadline) {
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
        if (deadline > date) {
            throw new InvalidValuesException(null, 'The deadline can not be after the date', ['deadline']);
        }

        return deadline;
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
}
