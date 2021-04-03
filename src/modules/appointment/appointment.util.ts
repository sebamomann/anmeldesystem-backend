import {InvalidValuesException} from '../../exceptions/InvalidValuesException';
import {Appointment} from './appointment.entity';
import {Enrollment} from '../enrollment/enrollment.entity';
import {JWT_User} from '../user/user.model';
import {AppointmentPermissionChecker} from './appointmentPermission.checker';

const crypto = require('crypto');

export class AppointmentUtil {
    /**
     * Compare _deadline and set _date, to check if the _date is before the _deadline
     *
     * @param date Date of appointment
     * @param deadline Date _deadline of appointment
     */
    public static handleDateValidation(date, deadline) {
        if (!deadline) {
            return date;
        }

        if (Date.parse(date) < Date.parse(deadline)) {
            throw new InvalidValuesException(null, null,
                [
                    {
                        'attribute': 'date',
                        'value': date,
                        'message': 'The specified date is timed before the deadline'
                    }
                ]
            );
        }

        return date;
    }

    /**
     * Compare _deadline and set _date, to check if the _deadline is after the appointment _date
     *
     * @param date Date of appointment
     * @param deadline Date _deadline of appointment
     */
    public static handleDeadlineValidation(date, deadline) {
        if (!date) {
            return deadline;
        }

        if (Date.parse(date) < Date.parse(deadline)) {
            throw new InvalidValuesException(null, null,
                [
                    {
                        'attribute': 'deadline',
                        'value': deadline,
                        'message': 'The specified deadline is timed after the date'
                    }
                ]
            );
        }

        return deadline;
    }

    /**
     * TODO REWORK
     * actually eagering all iformation for administrators and pinners is pretty bad
     * this way there is a huge database overhead
     * possible to solve by adding this kind of information within the db query or querying the db multiple times
     *
     * Check the users correlation to the appointment. <br />
     * Following correlations (references) are possible
     * <ol>
     *     <li>CREATOR</li>
     *     <li>ADMIN</li>
     *     <li>ENROLLED</li>
     *     <li>PINNED</li>
     * </ol>
     * Note that a permission granted via passing a _link is also marked as "PINNED".<br/>
     * Multiple correlations are possible. Two references of the same type are not possible.<br/>
     * For the "Enrolled" relations to happen, only the ID is needed. No token validation happening.
     *
     * @param user Requester (if existing) to correlate
     * @param appointment Appointment to correlate user with
     * @param pins Links of pinned Appointments (passed via query parameter)
     * @param permissions Object containing attributes in the form of `perm` and `token` (perm token for enrollment)
     *
     * @returns string[] Array of all correlations regarding JWT_User and Appointment
     */
    public static parseReferences(user: JWT_User, appointment: Appointment, pins: string[], permissions = {}) {
        const relations = [];

        let extractedIds = [];
        for (const queryKey of Object.keys(permissions)) {
            if (queryKey.startsWith('perm')) {
                extractedIds.push(permissions[queryKey]);
            }
        }

        const appointmentPermissionChecker = new AppointmentPermissionChecker(appointment);

        if (user === null && extractedIds.length === 0) {
            return [];
        }

        if (appointmentPermissionChecker.userIsAdministrator(user)) {
            relations.push('ADMIN');
        }

        if (appointmentPermissionChecker.userIsCreator(user)) {
            relations.push('CREATOR');
        }

        const hasPermissionForAtLeastOneEnrollment = appointment._enrollments?.some(sEnrollment => {
            return extractedIds.includes(sEnrollment.id);
        });

        const isCreatorOfAnyEnrollment = appointment._enrollments?.some(sEnrollment => {
            return user
                && sEnrollment.creatorId != null
                && sEnrollment.creatorId === user.sub;
        });

        if (appointment._enrollments
            && (isCreatorOfAnyEnrollment || hasPermissionForAtLeastOneEnrollment)) {
            relations.push('ENROLLED');
        }

        if ((appointment._pinners && appointment._pinners.some(sPinner => sPinner.userId === user.sub))
            || pins.includes(appointment._link)) {
            relations.push('PINNED');
        }

        return relations;
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
     * @param user
     * @param permissions All raw query parameters
     * @param enrollments Enrollments to filter
     *
     * @returns Enrollment[] ALl filtered enrollments
     */
    public static _filterPermittedEnrollments(user: JWT_User, permissions: any, enrollments: Enrollment[]) {
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
            if (validIds.includes(fEnrollment.id) || fEnrollment.creatorId === user?.sub) {
                return fEnrollment;
            }
        });
    }

    public static parsePins(params: any) {
        let pins = [];
        for (const queryKey of Object.keys(params)) {
            if (queryKey.startsWith('pin')) {
                pins.push(params[queryKey]);
            }
        }
        return pins;
    }
}
