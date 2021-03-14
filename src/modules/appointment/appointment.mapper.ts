import {Appointment} from './appointment.entity';
import {Enrollment} from '../enrollment/enrollment.entity';
import {AppointmentUtil} from './appointment.util';
import {UserUtil} from '../../util/user.util';
import {EnrollmentMapper} from '../enrollment/enrollment.mapper';
import {IUserMinified} from '../user/IUserMinified';
import {User} from '../user/user.model';
import {UserService} from '../user/user.service';

export class AppointmentMapper {
    constructor(private readonly userService: UserService) {
    }

    /**
     * Sort additions by their specified order.
     *
     * @param appointment       {@link Appointment} to modify
     */
    private static sortAdditions(appointment: Appointment): void {
        appointment.additions?.sort((a, b) => {
            return a.order < b.order ? -1 : 1;
        });
    }

    /**
     * TODO
     * mix with permission
     *
     * Basic mapping function. Used to strip {@link User} information.
     * {@link User} information should just contain name and username. Other fields of {@link User} are
     * not in interesting for requesting person.
     *
     * @param appointment   {@link Appointment} that should be manipulated
     */
    public async basic(appointment): Promise<Appointment> {
        await this.stripAdministrators(appointment);
        this.mapEnrollments(appointment);
        AppointmentMapper.sortAdditions(appointment);

        if (appointment.files) {
            appointment.files.map(mFile => delete mFile.data);
        } else {
            appointment.files = [];
        }

        return appointment;
    }

    /**
     * If the slim parameter is set, remove all {@link Enrollment} from the {@link Appointment} list.
     *
     * @param appointment   {@link Appointment} to manipulate
     * @param slim          Boolean to remove or keep {@link Enrollment} list
     */
    public slim(appointment: Appointment, slim: boolean) {
        if (slim) {
            delete appointment.enrollments;
        }

        return appointment;
    }

    public async permission(_appointment: Appointment, _user: User, permissions: any): Promise<any> {
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

        if (_appointment.isCreator(_user)) {
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
            || _appointment.isCreatorOrAdministrator(_user)) {
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

        // TODO mapping user stripmin
        const creator: User = await this.userService.findById(_appointment.creatorId);
        const mUser: IUserMinified = UserUtil.stripUserMin(creator);

        const obj = {
            creator: {
                name: mUser.name,
                username: mUser.username,
            }
        };

        appointment = Object.assign(appointment, obj);

        return appointment;
    }

    /**
     * Foreach {@link Enrollment} in {@link Appointment} strip the creator.
     *
     * @param appointment   @link Appointment} to manipulate
     *
     * @protected
     */
    private mapEnrollments(appointment: Appointment): void {
        const enrollmentMapper = new EnrollmentMapper(this.userService);

        if (appointment.enrollments) {
            appointment.enrollments.map(
                async mEnrollment => {
                    await enrollmentMapper.basic(mEnrollment);
                }
            );
        } else {
            appointment.enrollments = [];
        }
    }

    /**
     * Foreach administrator in {@link Appointment} fetch the user information and strip it to the minimum
     *
     * @param appointment   @link Appointment} to manipulate
     *
     * @protected
     */
    private async stripAdministrators(appointment: Appointment): Promise<void> {
        appointment.administrators = [];

        if (appointment._administrators) {
            for (const mAdmin of appointment._administrators) {
                const user: User = await this.userService.findById(mAdmin.userId); // TODO admin extends class with this functionality

                appointment.administrators.push(
                    UserUtil.stripUserMin(user)
                );
            }

            delete appointment._administrators;
        }
    }
}
