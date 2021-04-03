import {InvalidValuesException} from '../../exceptions/InvalidValuesException';
// TODO
// extract into entity
export class AppointmentUtil {
    /**
     * Compare tho dates to check if the date is before the deadline
     *
     * @param date          {@link Date} Date of the {@link Appointment}
     * @param deadline      {@link Date} Deadline of the {@link Appointment}
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
     * Compare two dates to check if the deadline is after the appointment date
     *
     * @param date          {@link Date} Date of the {@link Appointment}
     * @param deadline      {@link Date} Deadline of the {@link Appointment}
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
}
