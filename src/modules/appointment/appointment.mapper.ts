import {AppointmentService} from './appointment.service';
import {User} from '../user/user.entity';
import {Appointment} from './appointment.entity';
import {Enrollment} from '../enrollment/enrollment.entity';

module.exports = {
    basic: function(appointmentService, appointment) {
        if (appointment.administrators !== undefined) {
            appointment.administrators = this.stripAdministrator(appointment.administrators);
        }

        if (appointment.enrollments !== undefined) {
            appointment.enrollments = this.enrolledByUser(appointment.enrollments);
        }

        return appointment;
    },

    permission: function(appointmentService: AppointmentService, _appointment: Appointment, _user: User, permissions: any) {
        let appointment: {};
        let creatorObject = {};
        let enrollmentsObject = {};

        appointment = (({
                            reference,
                            id,
                            title,
                            description,
                            link,
                            location,
                            date,
                            deadline,
                            maxEnrollments,
                            hidden,
                            driverAddition,
                            additions,
                            files,
                            administrators
                        }) => ({
            reference,
            id,
            title,
            description,
            link,
            location,
            date,
            deadline,
            maxEnrollments,
            hidden,
            driverAddition,
            additions,
            files,
            administrators
        }))
        (_appointment);

        if (AppointmentService.isCreatorOfAppointment(_appointment, _user)) {
            creatorObject = (({
                                  iat, lud,
                              }) => ({
                iat, lud,
            }))
            (_appointment);
        }

        if (!_appointment.hidden
            || (AppointmentService.isCreatorOfAppointment(_appointment, _user)
                || AppointmentService.isAdministratorOfAppointment(_appointment, _user))) {
            enrollmentsObject = (({
                                      enrollments,
                                  }) => ({
                enrollments,
            }))
            (_appointment);
        } else {
            const __enrollments = AppointmentService
                .filterPermittedEnrollments(permissions, _appointment.enrollments);
            enrollmentsObject = {enrollments: __enrollments};
        }

        appointment = Object.assign(appointment, creatorObject);
        appointment = Object.assign(appointment, enrollmentsObject);

        const obj = {
            creator: {
                name: _appointment.creator.name,
                username: _appointment.creator.username,
            }
        };

        appointment = Object.assign(appointment, obj);

        return appointment;
    },

    slim: function(appointmentService: AppointmentService, appointment: Appointment, slim: boolean) {
        if (slim) {
            delete appointment.files;
            delete appointment.enrollments;
            delete appointment.files;
        }

        return appointment;
    },

    stripAdministrator(admins: User[]) {
        return admins.map(mAdmin => {
            return (({name, username,}) => ({
                name, username,
            }))
            (mAdmin);
        });
    },

    enrolledByUser(enrollments: Enrollment[]) {
        return enrollments.map(mEnrollment => {
            mEnrollment.createdByUser = mEnrollment.creator != null;
            delete mEnrollment.creator;
            return mEnrollment;
        });
    }
};
