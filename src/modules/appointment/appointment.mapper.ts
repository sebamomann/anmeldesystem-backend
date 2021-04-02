import {Appointment} from './appointment.entity';
import {Enrollment} from '../enrollment/enrollment.entity';
import {AppointmentUtil} from './appointment.util';
import {UserUtil} from '../../util/user.util';
import {EnrollmentMapper} from '../enrollment/enrollment.mapper';
import {IUserMinified} from '../user/IUserMinified';
import {JWT_User} from '../user/user.model';
import {UserService} from '../user/user.service';
import {KeycloakUser} from '../user/KeycloakUser';
import {AppointmentPermissionChecker} from './appointmentPermission.checker';

export class AppointmentMapper {
    constructor(private readonly userService: UserService) {
    }

    /**
     * TODO
     * mix with permission
     *
     * Basic mapping function. Used to strip {@link JWT_User} information.
     * {@link JWT_User} information should just contain name and username. Other fields of {@link JWT_User} are
     * not in interesting for requesting person.
     *
     * @param appointment   {@link Appointment} that should be manipulated
     */
    public async basic(appointment): Promise<Appointment> {
        await this.stripAdministrators(appointment);
        await this.mapEnrollments(appointment);

        if (appointment.files) {
            appointment.files.map(mFile => {
                delete mFile.data;
                mFile.url = process.env.API_URL + 'file/' + mFile.id;
            });
        } else {
            appointment.files = [];
        }

        if (appointment.maxEnrollments === null) {
            delete appointment.maxEnrollments;
        }

        if (appointment.additions?.length === 0) {
            delete appointment.additions;
        }

        if (appointment.files?.length === 0) {
            delete appointment.files;
        }

        if (appointment.administrators?.length === 0) {
            delete appointment.administrators;
        }

        if (appointment.enrollments?.length === 0) {
            delete appointment.enrollments;
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

    public async permission(_appointment: Appointment, _user: JWT_User, permissions: any): Promise<any> {
        let appointment: any;
        let creatorObject = {};
        let enrollmentsObject;

        appointment = (({
                            relations,
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
                            _administrators,
                        }) => ({
            relations,
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
            _administrators,
        }))
        (_appointment);

        const appointmentPermissionChecker = new AppointmentPermissionChecker(_appointment);

        if (appointmentPermissionChecker.userIsCreator(_user)) {
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
            || appointmentPermissionChecker.userIsCreatorOrAdministrator(_user)) {
            enrollmentsObject = (({
                                      enrollments,
                                  }) => ({
                enrollments,
            }))
            (_appointment);
        } else {
            /**
             * TODO can be made in request
             */
            const __enrollments = AppointmentUtil
                .filterPermittedEnrollments(_user, permissions, _appointment.enrollments);
            enrollmentsObject = {enrollments: __enrollments};
        }

        appointment = Object.assign(appointment, creatorObject);
        appointment = Object.assign(appointment, enrollmentsObject);

        // TODO mapping user stripmin
        const creator: KeycloakUser = await this.userService.findById(_appointment.creatorId);
        const mUser: IUserMinified = UserUtil.stripUserMin(creator);

        const obj = {
            creator: {
                name: mUser.name,
                username: mUser.username,
            }
        };

        appointment.additions.sortByOrder()
        appointment.additions = appointment.additions.getArray();
        delete appointment._additions;

        appointment = Object.assign(appointment, obj);

        return appointment;
    }

    /**
     * Create a object only contained the important creation values of the passed {@link Appointment}. <br/>
     * Those values are id and _link.
     *
     * @param appointment       {@link Appointment} to minify
     */
    create(appointment: Appointment): { id: string, link: string } {
        return (({
                     id,
                     link
                 }) => ({
            id,
            link,
        }))
        (appointment);
    }

    /**
     * Foreach {@link Enrollment} in {@link Appointment} strip the creator.
     *
     * @param appointment   @link Appointment} to manipulate
     *
     * @protected
     */
    private async mapEnrollments(appointment: Appointment): Promise<void> {
        const enrollmentMapper = new EnrollmentMapper(this.userService);

        if (appointment.enrollments) {
            const enrollments = [];

            for (const mEnrollment of appointment.enrollments) {
                const enrollment = await enrollmentMapper.basic(mEnrollment);

                enrollments.push(enrollment);
            }

            appointment.enrollments = enrollments;
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
                const user: KeycloakUser = await this.userService.findById(mAdmin.userId); // TODO admin extends class with this functionality

                appointment.administrators.push(
                    UserUtil.stripUserMin(user)
                );
            }

            delete appointment._administrators;
        }
    }
}
