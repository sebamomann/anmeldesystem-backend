import {Appointment} from './appointment.entity';
import {Enrollment} from '../enrollment/enrollment.entity';
import {AppointmentUtil} from './appointment.util';
import {UserUtil} from '../../util/user.util';
import {EnrollmentMapper} from '../enrollment/enrollment.mapper';
import {IUserDTO} from '../user/IUserDTO';
import {JWT_User} from '../user/user.model';
import {UserService} from '../user/user.service';
import {KeycloakUser} from '../user/KeycloakUser';
import {AppointmentPermissionChecker} from './appointmentPermission.checker';
import {IAppointmentDTO} from './IAppointmentDTO';
import {EnrollmentPermissionList} from '../enrollment/enrollmentPermissionList';
import {Relation} from '../relationList.type';
import {UserMapper} from '../user/user.mapper';

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
     * @deprecated
     * @param appointment   {@link Appointment} that should be manipulated
     */
    public async __basic(appointment): Promise<Appointment> {
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
     * @deprecated
     * @param appointment   {@link Appointment} to manipulate
     * @param slim          Boolean to remove or keep {@link Enrollment} list
     */
    public slim(appointment: Appointment, slim: boolean) {
        if (slim) {
            delete appointment._enrollments;
        }

        return appointment;
    }

    /**
     * @deprecated
     * @param _appointment
     * @param _user
     * @param permissions
     */
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
                ._filterPermittedEnrollments(_user, permissions, _appointment._enrollments);
            enrollmentsObject = {enrollments: __enrollments};
        }

        appointment = Object.assign(appointment, creatorObject);
        appointment = Object.assign(appointment, enrollmentsObject);

        // TODO mapping user stripmin
        const creator: KeycloakUser = await this.userService.findById(_appointment.creatorId);
        const mUser: IUserDTO = UserUtil.stripUserMin(creator);

        const obj = {
            creator: {
                name: mUser.name,
                username: mUser.username,
            }
        };

        appointment.additions.sortByOrder();
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
     * @param appointment
     * @param user
     * @param pins
     * @param permissions
     * @param slim
     */
    public async basic(appointment: Appointment, user: JWT_User, pins: string[], permissions: EnrollmentPermissionList, slim: boolean): Promise<IAppointmentDTO> {
        let appointmentDTO = {} as IAppointmentDTO;

        appointmentDTO.relations = this.parseRelations(appointment, user, pins, permissions);
        appointmentDTO.id = appointment.id;
        appointmentDTO.title = appointment.title;
        appointmentDTO.description = appointment.description;
        appointmentDTO.link = appointment.link;
        appointmentDTO.location = appointment.location;
        appointmentDTO.date = appointment.date;
        appointmentDTO.deadline = appointment.deadline;
        appointmentDTO.maxEnrollments = appointment.maxEnrollments;
        appointmentDTO.hidden = appointment.hidden;
        appointmentDTO.driverAddition = appointment.driverAddition;
        appointmentDTO.additions = appointment.additions.getArray();

        const administratorList = appointment.administrators;
        administratorList.setUserService(this.userService);
        appointmentDTO.administrators = await administratorList.getMinifiedArray();

        const appointmentPermissionChecker = new AppointmentPermissionChecker(appointment);

        Object.assign(appointmentDTO, this.appointmentCreatorFields(appointmentPermissionChecker, user, appointment));

        if (!slim) {
            appointmentDTO.files = appointment.files.getDTOArray();
            appointmentDTO.enrollments = await this.enrollmentMapping(appointmentPermissionChecker, permissions, user, appointment);
        }

        const userMapper = new UserMapper(this.userService);
        appointmentDTO.creator = await userMapper.getMinifiedUserById(appointment.creatorId);

        appointmentDTO = this.stripEmptyFields(appointmentDTO);

        return appointmentDTO;
    }

    /**
     * Foreach {@link Enrollment} in {@link Appointment} strip the creator.
     *
     * @param appointment   @link Appointment} to manipulate
     *
     * @deprecated
     * @protected
     */
    private async mapEnrollments(appointment: Appointment): Promise<void> {
        const enrollmentMapper = new EnrollmentMapper(this.userService);

        if (appointment._enrollments) {
            const enrollments = [];

            for (const mEnrollment of appointment._enrollments) {
                const enrollment = await enrollmentMapper.basic(mEnrollment);

                enrollments.push(enrollment);
            }

            appointment._enrollments = enrollments;
        } else {
            appointment._enrollments = [];
        }
    }

    /**
     * Foreach administrator in {@link Appointment} fetch the user information and strip it to the minimum
     *
     * @param appointment   @link Appointment} to manipulate
     *
     * @deprecated
     * @protected
     */
    private async stripAdministrators(appointment: Appointment): Promise<void> {
        appointment._administrators = [];

        if (appointment._administrators) {
            for (const mAdmin of appointment._administrators) {
                const user: KeycloakUser = await this.userService.findById(mAdmin.userId); // TODO admin extends class with this functionality

                appointment._administrators.push(
                    UserUtil.stripUserMin(user) as any
                );
            }

            delete appointment._administrators;
        }
    }

    private parseRelations(appointment: Appointment, user: JWT_User, pins: string[], permissions: EnrollmentPermissionList): string[] {
        const relations: Relation[] = [];

        if (user === null && permissions.getArray().length === 0) {
            return [];
        }

        this.parseRelations_appointmentPermissions(appointment, user, relations);
        this.parseRelations_appointmentPins(appointment, user, pins, relations);
        this.parseRelations_enrollmentPermissions(appointment, permissions, user, relations);

        return relations;
    }

    // noinspection JSMethodCanBeStatic
    private parseRelations_appointmentPins(appointment: Appointment, user: JWT_User, pins: string[], relations: Relation[]) {
        const pinnerList = appointment.pinners;

        const pinnedAsUser = pinnerList.containsPinByUser(user);
        const pinnedByParameter = pins.includes(appointment._link);

        if (pinnedAsUser || pinnedByParameter) {
            relations.push('PINNED');
        }
    }

    // noinspection JSMethodCanBeStatic
    private parseRelations_enrollmentPermissions(appointment: Appointment, permissions: EnrollmentPermissionList, user: JWT_User, relations: Relation[]) {
        const hasPermissionForAtLeastOneEnrollment = appointment.enrollments.containsPermittedEnrollment(permissions);
        const isCreatorOfAnyEnrollment = appointment.enrollments.containsEnrollmentCreatedByUser(user);

        if (isCreatorOfAnyEnrollment || hasPermissionForAtLeastOneEnrollment) {
            relations.push('ENROLLED');
        }
    }

    // noinspection JSMethodCanBeStatic
    private parseRelations_appointmentPermissions(appointment: Appointment, user: JWT_User, relations: Relation[]) {
        const appointmentPermissionChecker = new AppointmentPermissionChecker(appointment);

        if (appointmentPermissionChecker.userIsAdministrator(user)) {
            relations.push('ADMIN');
        }

        if (appointmentPermissionChecker.userIsCreator(user)) {
            relations.push('CREATOR');
        }
    }

    private appointmentCreatorFields(appointmentPermissionChecker: AppointmentPermissionChecker, user: JWT_User, appointment: Appointment) {
        const obj = {} as any;

        if (appointmentPermissionChecker.userIsCreator(user)) {
            obj.iat = appointment.iat;
            obj.lud = appointment.lud;
        }

        return obj;
    }

    private async enrollmentMapping(appointmentPermissionChecker: AppointmentPermissionChecker, permissions: EnrollmentPermissionList, user: JWT_User, appointment: Appointment) {
        const enrollmentList = appointment.enrollments;

        const userIsAppointmentCreatorOrAdministrator = appointmentPermissionChecker.userIsCreatorOrAdministrator(user);

        if (!appointment.hidden || userIsAppointmentCreatorOrAdministrator) {
            return await enrollmentList.getDTOArray(this.userService);
        } else {
            return await enrollmentList.getPermittedDTOArray(user, permissions, this.userService);
        }
    }

    private stripEmptyFields(appointmentDTO: IAppointmentDTO) {
        const keys = Object.keys(appointmentDTO);

        keys.forEach((key) => {
            if (typeof appointmentDTO[key] !== 'boolean' && (!appointmentDTO[key] || appointmentDTO[key].length === 0)) {
                delete appointmentDTO[key];
            }
        });

        return appointmentDTO;
    }
}
