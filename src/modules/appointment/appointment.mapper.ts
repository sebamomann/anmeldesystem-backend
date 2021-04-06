import {Appointment} from './appointment.entity';
import {JWT_User} from '../user/user.model';
import {UserService} from '../user/user.service';
import {AppointmentPermissionChecker} from './appointmentPermission.checker';
import {IAppointmentResponseDTO} from './DTOs/IAppointmentResponseDTO';
import {EnrollmentPermissionList} from '../enrollment/enrollmentPermissionList';
import {Relation} from '../Relation.type';
import {UserMapper} from '../user/user.mapper';
import {PinList} from '../pinner/pinList';
import {IAppointmentCreationResponseDTO} from './DTOs/IAppointmentCreationResponseDTO';
import {IEnrollmentDTO} from '../enrollment/IEnrollmentDTO';

export class AppointmentMapper {
    constructor(private readonly userService: UserService) {
    }

    /**
     * Create a object only containing the important creation values of the passed {@link Appointment}.<br/>
     * Those values are {@link Appointment.id} and {@link Appointment.link}.
     *
     * @param appointment       {@link Appointment} to minify
     *
     * @return {@link IAppointmentCreationResponseDTO} Minified object
     */
    public create({id, link}: Appointment): IAppointmentCreationResponseDTO {
        const obj = {} as IAppointmentCreationResponseDTO;

        obj.id = id;
        obj.link = link;

        return obj;
    }

    /**
     * Process {@link Appointment} into a user friendly format. <br/>
     * Method recursively processes sub objects into their appropriate format.
     * Unused values (null, undefined []) get removed. <br/>
     * Includes permission checks. e.g. remove {@link Enrollment} user is not allowed to see.
     *
     * @param appointment           {@link Appointment} Object to process
     * @param user                  {@link JWT_User} requesting user
     * @param pinList               {@link PinList} List containing all links the user has provided (used for {@link Relation})
     * @param permissionList        {@Link PermissionList} containing permission information for {@link Enrollment}
     * @param slim                  Whether or not to remove large data structures ({@link Enrollment} and {@link file})
     *
     * @return {@link IAppointmentResponseDTO} Object containing processed user information
     */
    public async basic(appointment: Appointment, user: JWT_User, pinList: PinList,
                       permissionList: EnrollmentPermissionList, slim: boolean): Promise<IAppointmentResponseDTO> {
        let appointmentDTO = {} as IAppointmentResponseDTO;

        appointmentDTO.relations = this.parseRelations(appointment, user, pinList, permissionList);
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
            appointmentDTO.enrollments = await this.enrollmentMapping(appointmentPermissionChecker, permissionList, user, appointment);
        }

        const userMapper = new UserMapper(this.userService);
        appointmentDTO.creator = await userMapper.getMinifiedUserById(appointment.creatorId);

        appointmentDTO = this.stripEmptyFields(appointmentDTO);

        return appointmentDTO;
    }

    /**
     * Create a list of {@link Relation} showing the requesters relation to the {@link Appointment}
     *
     * @param appointment           {@link Appointment} Object to process
     * @param user                  {@link JWT_User} requesting user
     * @param pinList               {@link PinList} List containing all links the user has provided (used for {@link Relation})
     * @param permissionList        {@Link PermissionList} containing permission information for {@link Enrollment}
     *
     * @return List of {@link Relation}
     */
    private parseRelations(appointment: Appointment, user: JWT_User, pinList: PinList, permissionList: EnrollmentPermissionList): Relation[] {
        const relations: Relation[] = [];

        if (user === null && permissionList.getArray().length === 0) {
            return [];
        }

        this.parseRelations_appointmentPermissions(appointment, user, relations);
        this.parseRelations_appointmentPins(appointment, user, pinList, relations);
        this.parseRelations_enrollmentPermissions(appointment, permissionList, user, relations);

        return relations;
    }

    // noinspection JSMethodCanBeStatic
    /**
     * Check if requester is a "PINNER" of the passed {@link Appointment}.<br/>
     * Appends the {@link Relation} to the current array if verified
     *
     * @param appointment           {@link Appointment} Object to process
     * @param user                  {@link JWT_User} requesting user
     * @param pinList               {@link PinList} List containing all links the user has provided (used for {@link Relation})
     * @param relations             {@Link Relation} List - current state of array
     */
    private parseRelations_appointmentPins(appointment: Appointment, user: JWT_User, pinList: PinList, relations: Relation[]): void {
        const pinnerList = appointment.pinners;

        const pinnedAsUser = pinnerList.containsPinByUser(user);
        const pinnedByParameter = pinList.includesLink(appointment.link);

        if (pinnedAsUser || pinnedByParameter) {
            relations.push('PINNED');
        }
    }

    // noinspection JSMethodCanBeStatic
    /**
     * Check if requester is a "ENROLLED" into the passed {@link Appointment}.<br/>
     * Appends the {@link Relation} to the current array if verified
     *
     * @param appointment           {@link Appointment} Object to process
     * @param user                  {@link JWT_User} requesting user
     * @param permissionList        {@Link PermissionList} containing permission information for {@link Enrollment}
     * @param relations             {@Link Relation} List - current state of array
     */
    private parseRelations_enrollmentPermissions(appointment: Appointment, permissionList: EnrollmentPermissionList,
                                                 user: JWT_User, relations: Relation[]): void {
        const hasPermissionForAtLeastOneEnrollment = appointment.enrollments.containsPermittedEnrollment(permissionList);
        const isCreatorOfAnyEnrollment = appointment.enrollments.containsEnrollmentCreatedByUser(user);

        if (isCreatorOfAnyEnrollment || hasPermissionForAtLeastOneEnrollment) {
            relations.push('ENROLLED');
        }
    }

    // noinspection JSMethodCanBeStatic
    /**
     * Check if requester is a "ADMIN" or the "CREATOR" of the passed {@link Appointment}.<br/>
     * Appends the {@link Relation} to the current array if verified
     *
     * @param appointment           {@link Appointment} Object to process
     * @param user                  {@link JWT_User} requesting user
     * @param relations             {@Link Relation} List - current state of array
     */
    private parseRelations_appointmentPermissions(appointment: Appointment, user: JWT_User, relations: Relation[]): void {
        const appointmentPermissionChecker = new AppointmentPermissionChecker(appointment);

        if (appointmentPermissionChecker.userIsAdministrator(user)) {
            relations.push('ADMIN');
        }

        if (appointmentPermissionChecker.userIsCreator(user)) {
            relations.push('CREATOR');
        }
    }

    // noinspection JSMethodCanBeStatic
    /**
     * Create a object containing the fields, only the {@link Appointment} creator is allowed to see.
     *
     * @param appointmentPermissionChecker      {@link AppointmentPermissionChecker} existing instance for permission check
     * @param user                              {@link JWT_User} user to check permission for
     * @param appointment                       {@link Appointment} containing the fields to fetch
     */
    private appointmentCreatorFields(appointmentPermissionChecker: AppointmentPermissionChecker, user: JWT_User, appointment: Appointment) {
        const obj = {} as any;

        if (appointmentPermissionChecker.userIsCreator(user)) {
            obj.iat = appointment.iat;
            obj.lud = appointment.lud;
        }

        return obj;
    }

    /**
     * Get the {@link Enrollment} list containing the proper DTOs.<br/>
     * Method checks if user is even allowed to see this list.
     *
     * @param appointmentPermissionChecker      {@link AppointmentPermissionChecker} existing instance for permission check
     * @param permissionList                    {@Link PermissionList} containing permission information for {@link Enrollment}
     * @param user                              {@link JWT_User} user to check permission for
     * @param appointment                       {@link Appointment} containing the fields to fetch
     *
     * @return List of processed {@link Enrollment} in proper format (as {@Link IEnrollmentDTO})
     */
    private async enrollmentMapping(appointmentPermissionChecker: AppointmentPermissionChecker, permissionList: EnrollmentPermissionList,
                                    user: JWT_User, appointment: Appointment): Promise<IEnrollmentDTO[]> {
        const enrollmentList = appointment.enrollments;

        const userIsAppointmentCreatorOrAdministrator = appointmentPermissionChecker.userIsCreatorOrAdministrator(user);

        if (!appointment.hidden || userIsAppointmentCreatorOrAdministrator) {
            return await enrollmentList.getDTOArray(this.userService);
        } else {
            return await enrollmentList.getPermittedDTOArray(user, permissionList, this.userService);
        }
    }

    /**
     * Remove all fields containing null, undefined or []. Boolean fields are an exception.
     *
     * @param appointmentDTO        Finished {@link IAppointmentResponseDTO} to strip.
     */
    private stripEmptyFields(appointmentDTO: IAppointmentResponseDTO) {
        const keys = Object.keys(appointmentDTO);

        keys.forEach(
            (key: string) => {
                if (typeof appointmentDTO[key] !== 'boolean' && (!appointmentDTO[key] || appointmentDTO[key].length === 0)) {
                    delete appointmentDTO[key];
                }
            }
        );

        return appointmentDTO;
    }
}
