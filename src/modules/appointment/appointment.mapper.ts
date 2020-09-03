import {User} from '../user/user.entity';
import {Appointment} from './appointment.entity';
import {Enrollment} from '../enrollment/enrollment.entity';
import {AppointmentUtil} from './appointment.util';
import {UserUtil} from '../../util/user.util';
import {EnrollmentMapper} from '../enrollment/enrollment.mapper';

export class AppointmentMapper {

    public static basic(appointment) {
        if (appointment.administrators !== undefined) {
            appointment.administrators = AppointmentMapper.stripAdministrators(appointment.administrators);
        }

        if (appointment.enrollments !== undefined) {
            appointment.enrollments = AppointmentMapper.enrolledByUser(appointment.enrollments);
        }

        appointment.files?.map(mFile => delete mFile.data);

        return appointment;
    }

    public static permission(_appointment: Appointment, _user: User, permissions: any): any {
        let appointment: any;
        let creatorObject = {};
        let enrollmentsObject;

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
                            administrators,
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
            administrators,
        }))
        (_appointment);

        if (AppointmentUtil.isCreatorOfAppointment(_appointment, _user)) {
            creatorObject = (({
                                  iat,
                                  lud,
                              }) => ({
                iat,
                lud,
            }))
            (_appointment);
        }

        if (!_appointment.hidden
            || AppointmentUtil.isCreatorOrAdministrator(_appointment, _user)) {
            enrollmentsObject = (({
                                      enrollments,
                                  }) => ({
                enrollments,
            }))
            (_appointment);
        } else {
            const __enrollments = AppointmentUtil
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
    }

    public static slim(appointment: Appointment, slim: boolean) {
        if (slim) {
            delete appointment.enrollments;
        }

        return appointment;
    }

    public static enrolledByUser(enrollments: Enrollment[]) {
        return enrollments.map(mEnrollment => {
            EnrollmentMapper.stripCreator(mEnrollment);
        });
    }

    public static sortAdditions(appointment: Appointment) {
        appointment.additions?.sort((a, b) => {
            return a.order < b.order ? -1 : 1;
        });

        return appointment;
    }

    private static stripAdministrators(admins: User[]) {
        return admins.map(mAdmin => {
            return UserUtil.stripUserMin(mAdmin);
        });
    }
}
