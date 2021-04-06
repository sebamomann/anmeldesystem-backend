import {Injectable} from '@nestjs/common';
import {Appointment} from './appointment.entity';
import {Brackets, getRepository, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {AdditionService} from '../addition/addition.service';
import {UserService} from '../user/user.service';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {AppointmentGateway} from './appointment.gateway';
import {AppointmentMapper} from './appointment.mapper';
import {PushService} from '../push/push.service';
import {JWT_User} from '../user/user.model';
import {AppointmentPermissionChecker} from './appointmentPermission.checker';
import {AdditionList} from '../addition/addition.list';
import {IAppointmentResponseDTO} from './DTOs/IAppointmentResponseDTO';
import {IAppointmentCreationDTO} from './DTOs/IAppointmentCreationDTO';
import {EnrollmentPermissionList} from '../enrollment/enrollmentPermissionList';
import {PinList} from '../pinner/pinList';
import {AppointmentRepository} from './appointment.repository';
import {IAppointmentCreationResponseDTO} from './DTOs/IAppointmentCreationResponseDTO';
import {IAppointmentUpdateAdditionDTO} from './DTOs/IAppointmentUpdateAdditionDTO';
import {InvalidAttributesException} from '../../exceptions/InvalidAttributesException';

const logger = require('../../logger');

@Injectable()
export class AppointmentService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        private readonly _appointmentRepository: AppointmentRepository,
        private additionService: AdditionService,
        private userService: UserService,
        private appointmentGateway: AppointmentGateway,
        private pushService: PushService,
    ) {
    }

    /**
     * TODO (with permission and shit)
     *
     * Find {@link Appointment} by its unique link.
     *
     * @param link          Link of {@link Appointment}
     *
     * @throws EntityNotFoundException if given _link does not match any {@link Appointment}
     */
    public async findByLink(link: string): Promise<Appointment> {
        let appointment = await this.appointmentRepository.findOne({
            where: {
                _link: link
            }
        });

        if (appointment === undefined) {
            throw new EntityNotFoundException(null, null, {
                'attribute': 'link',
                'in': 'path',
                'value': link
            });
        }

        return appointment;
    }

    /**
     * Get {@ink Appointment} by its link. <br/>
     * Checking for permissions by analysing query parameter, being creator or being administrator.
     *
     * @param user              {@link JWT_User} requesting user
     * @param link              Link of {@link Appointment} to get
     * @param permissions       Raw object of permissions the user has for specific {@link Enrollment}
     * @param slim              Exclude enrollments and files to save bandwidth
     *
     * @returns {@link IAppointmentResponseDTO} - striped {@link Appointment}
     *
     * @throws {@link EntityNotFoundException} if {@link Appointment} could not be found by link
     */
    public async get(user: JWT_User, link: string, permissions: any, slim: boolean): Promise<IAppointmentResponseDTO> {
        const enrollmentPermissionList = new EnrollmentPermissionList(permissions);

        let appointment;

        try {
            appointment = await this.getAppointmentIncludingPermissionAndSlimCheck(link, user, enrollmentPermissionList, slim);

        } catch (e) {
            throw new EntityNotFoundException(null, null, {
                'attribute': 'link',
                'in': 'path',
                'value': link,
                'message': e.data?.message
            });
        }

        const appointmentMapper = new AppointmentMapper(this.userService);

        return appointmentMapper.basic(appointment, user, new PinList(), enrollmentPermissionList, slim);
    }

    /**
     * Fetch all !!active!! Appointments, the user is allowed to see.
     * This includes being the creator, an administrator or being enrolled into this Appointment.
     * Additionally, pinned appointments get returned. Further an array of links can be passed
     * with this request to show, that you know this Appointment too. (e.g. pinned in frontend).-
     * <br />
     * When passing a _link with this request, the corresponding Appointment gets marked as "PINNED"
     * <br />
     * <br />
     * All appointments include a relations. See {@link parseReferences} for more information
     *
     * @param user      Requester (if existing)
     * @param params    All query parameters to parse pinned links
     * @param slim      Delete information overhead. See {@link AppointmentMapper.slim} for more information.
     *
     * @returns Appointment[]
     */
    public async getAll(user: JWT_User, params: any, slim): Promise<Appointment[]> {
        let pinList = new PinList(params);

        let appointments = await this.getAppointments(user, pinList, undefined, null);

        const appointmentMapper = new AppointmentMapper(this.userService);

        appointments = await appointments
            .filter(
                async (appointment) => {
                    return await appointmentMapper.basic(appointment, user, pinList, new EnrollmentPermissionList({}), slim);
                });

        return appointments;
    }

    /**
     * Fetch all Appointments from the past, the user is allowed to see.
     * This includes being the creator, an administrator or being enrolled into this Appointment.
     * Additionally, pinned appointments get returned. Further an array of links can be passed
     * with this request to show, that you know this Appointment too. (e.g. pinned in frontend).-
     * <br />
     * When passing a _link with this request, the corresponding Appointment gets marked as "PINNED"
     * <br />
     * <br />
     * All appointments include a relations. See {@link parseReferences} for more information
     *
     * @param user      Requester (if existing)
     * @param params    All query parameters to parse pinned links
     * @param _slim     Delete information overhead. See {@link AppointmentMapper.slim} for more information.
     * @param before    Date (string) for pagination. Return elements that took place before this particular _date
     * @param limit     Number of elements to return
     *
     * @returns Appointment[]
     */
    public async getAllArchive(user: JWT_User, params: any, _slim: boolean, before: string, limit: number): Promise<Appointment[]> {
        let pinList = new PinList(params);

        let _before;
        const date = new Date(before);
        try {
            if (!date.getTime()) {
                throw new Error();
            }
            _before = date;
        } catch (e) {
            _before = new Date();
        }

        let appointments = await this.getAppointments(user, pinList, _before, limit);

        const appointmentMapper = new AppointmentMapper(this.userService);

        appointments = await appointments
            .filter(
                async (appointment) => {
                    return await appointmentMapper.basic(appointment, user, pinList, new EnrollmentPermissionList({}), _slim);
                });

        return appointments;
    }

    /**
     * Create {@link Appointment}. <br/>
     * Some fields like the list of {@link Administrator} needs to be set separately.
     *
     * @param appointmentCreationDTO        {@link AppointmentCreationDTO} object containing creation information
     * @param user Requester                {@link JWT_User} sending the request. User to be associated as creator with created {@link Appointment}
     *
     * @returns Created {@link Appointment} in minimalist format containing identifying information {@link IAppointmentCreationResponseDTO}
     *
     * @throws {@link DuplicateValueException} see {@link Appointment.setLink} if link is already in use
     */
    public async create(appointmentCreationDTO: IAppointmentCreationDTO, user: JWT_User): Promise<IAppointmentCreationResponseDTO> {
        let appointmentToDB = new Appointment(this, this.userService);

        appointmentToDB.title = appointmentCreationDTO.title;
        appointmentToDB.description = appointmentCreationDTO.description;
        await appointmentToDB.setLink(appointmentCreationDTO.link);
        appointmentToDB.location = appointmentCreationDTO.location;
        appointmentToDB.date = appointmentCreationDTO.date;
        appointmentToDB.deadline = appointmentCreationDTO.deadline;
        appointmentToDB.maxEnrollments = appointmentCreationDTO.maxEnrollments;
        appointmentToDB.driverAddition = appointmentCreationDTO.driverAddition;
        appointmentToDB.creatorId = user.sub;

        const additionList = new AdditionList();
        additionList.convertRawDataToAdditionList(appointmentCreationDTO.additions);
        appointmentToDB.additions = additionList;

        appointmentToDB = await this.appointmentRepository.save(appointmentToDB);

        const appointmentMapper = new AppointmentMapper(this.userService);

        return appointmentMapper.create(appointmentToDB);
    }

    /**
     * Updated values passed by object. User is allowed to change every value he provided at the creation {@link IAppointmentCreationDTO}.<br/>
     *
     * @param toChange              {@link IAppointmentCreationDTO} containing only the values that need to be changed
     * @param link                  Link of the {@link Appointment} to change
     * @param user                  {@link JWT_User} requesting user
     *
     * @return Saved {@link Appointment}
     */
    public async update(toChange: IAppointmentCreationDTO, link: string, user: JWT_User): Promise<Appointment> {
        let appointment;

        try {
            appointment = await this.getAppointmentCoreInformationIfValidPermission(link, user);
        } catch (e) {
            throw new InsufficientPermissionsException(null, null, {
                    'attribute': 'link',
                    'in': 'path',
                    'value': link,
                    'message': 'Specified appointment is not in your ownership. You are also not permitted to administrate this appointment.'
                }
            );
        }

        appointment.setAppointmentService(this);

        const keyFunctionMapping = {
            'title': 'title',
            'description': 'description',
            'link': '--',
            'location': 'location',
            'date': 'date',
            'deadline': 'deadline',
            'maxEnrollments': 'maxEnrollments',
            'hidden': 'hidden',
            'additions': '--',
            'driverAddition': 'driverAddition'
        };

        for (let [key, value] of Object.entries(toChange)) { // TODO REFACTOR LIKE AT USER AND ENROLLMENT
            const attributeAllowedToChange = key in keyFunctionMapping;

            if (attributeAllowedToChange) {
                if (key === 'link') {
                    await appointment.setLink(value as string);
                } else if (key === 'additions') {
                    this.handleAdditionUpdate(appointment, value);
                } else {
                    appointment[keyFunctionMapping[key]] = value as any;
                }
            } else {
                throw new InvalidAttributesException('INVALID_ATTRIBUTE',
                    'Following attributes are not allowed to be updated',
                    [{
                        'attribute': key,
                        'in': 'body',
                        'value': value,
                        'message': 'The specified attribute is not allowed to be modified'
                    }]);
            }
        }

        appointment = await this.appointmentRepository.save(appointment);

        this.appointmentGateway.appointmentUpdated(appointment);
        this.pushService
            .appointmentChanged(appointment)
            .catch(
                (err) => {
                    logger.error('Push notifications could not be send', err);
                }
            );

        return appointment;
    }

    /**
     * Toggle the pinning state of an appointment in relation to the user. <br/>
     * Update user entity instead of appointment entity
     *
     * @param user Requester, wanting to pin the appointment
     * @param link Link of appointment to pin
     */
    // TODO reimplement with keycloak
    public async togglePinningAppointment(user: JWT_User, link: string) {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

        let _user;

        // TODO obsolete, due to external user management
        try {
            _user = await this.userService.findById(user.sub); // check if user even exists anymore or not
        } catch (e) {
            throw e;
        }

        if (_user.pinned.some(sPinned => sPinned.id === appointment.id)) {
            const removeIndex = _user.pinned.indexOf(appointment);
            _user.pinned.splice(removeIndex, 1);
        } else {
            _user.pinned.push(appointment);
        }

        _user = await this.userService.__save(_user);

        return _user;
    }

    /**
     * Check if passed {@link JWT_User} is {@link Administrator} or creator of the referenced {@link Appointment}
     *
     * @param user          {@link JWT_User} to check permissions for
     * @param ref           Link of  {@link Appointment}
     *
     * @returns boolean     representing condition
     *
     * @throws              See {@link findByLink} for relations
     */
    public async isCreatorOrAdministrator(user: JWT_User, ref: string): Promise<boolean> {
        const appointment = await this.getAppointmentForPermissionCheckAndReferenceAsRelation(ref);

        const appointmentPermissionChecker = new AppointmentPermissionChecker(appointment);

        return appointmentPermissionChecker.userIsCreatorOrAdministrator(user);
    }

    public async removeSubscriptionsByUser(appointment: any, user: JWT_User) {
        let app = await this.appointmentRepository.findOne({
            where: {
                _link: appointment.link
            },
            loadEagerRelations: false,
            relations: ['subscriptions', 'subscriptions.user']
        });

        if (!app) {
            throw new EntityNotFoundException(null, null, 'appointment');
        }

        if (app.subscriptions) {
            app.subscriptions = app.subscriptions.filter((fSub) => fSub.userId !== user.sub);
        }

        return this.appointmentRepository.save(app);
    }

    async linkInUse(link) {
        try {
            await this.findByLink(link);
            return true;
        } catch (e) {
            return false;
        }
    }

    async getAppointmentIncludingPermissionAndSlimCheck(link: string, user: JWT_User, enrollmentPermissionList:
        EnrollmentPermissionList, slim: boolean): Promise<Appointment> {
        let select = ['appointment', 'additions', 'files', 'administrators', 'pinners'];

        let builder = getRepository(Appointment).createQueryBuilder('appointment');

        builder = builder.leftJoinAndSelect('appointment._additions', 'additions');
        builder = builder.leftJoinAndSelect('appointment._pinners', 'pinners');
        builder = builder.leftJoinAndSelect('appointment._administrators', 'administrators');

        const permittedEnrollmentsIds = enrollmentPermissionList.getPermittedEnrollments();
        if (permittedEnrollmentsIds.length === 0) {
            permittedEnrollmentsIds.push('0');
        }
        if (!slim) {
            const cond = `
            CASE 
                WHEN appointment.hidden = 1
                THEN (
                    CASE
                        WHEN (
                            appointment.creatorId = :userId
                            OR
                            administrators.userId = :userId 
                        )
                        THEN enrollments.appointmentId = appointment.id
                        ELSE (
                            enrollments.id IN (:...ids)
                            OR
                            enrollments.creatorId = :userId
                        )
                    END  
                ) 
                ELSE enrollments.appointmentId = appointment.id
            END 
            `;

            builder = builder.leftJoinAndSelect('appointment._enrollments', 'enrollments', cond, {
                userId: user?.sub || 0,
                ids: permittedEnrollmentsIds
            })
                .leftJoinAndSelect('enrollments.passenger', 'enrollment_passenger')
                .leftJoinAndSelect('enrollments.driver', 'enrollment_driver')
                .leftJoinAndSelect('enrollments.additions', 'enrollment_additions');

            select = [...select, 'enrollments', 'enrollment_additions', 'enrollment_passenger', 'enrollment_driver'];

            // data is never selected, if not specified
            builder = builder.leftJoinAndSelect('appointment._files', 'files');
        }

        builder = builder.where('appointment.link = :link', {link: link});
        builder = builder.select(select);

        const appointment = await builder.getOne();

        if (!appointment) {
            throw new EntityNotFoundException(null, null, {
                'attribute': 'link',
                'value': link,
                'message': 'Specified appointment does not exist'
            });
        }

        return appointment;
    }

    async getAppointmentCoreInformationIfValidPermission(link: string, user: JWT_User): Promise<Appointment> {
        let select = ['appointment', 'additions', 'administrators'];

        let builder = getRepository(Appointment).createQueryBuilder('appointment');

        builder = builder.leftJoinAndSelect('appointment._additions', 'additions')
            .leftJoinAndSelect('appointment._administrators', 'administrators');

        builder = builder.where('appointment.link = :link', {link: link});

        const cond = `
        ( 
            CASE
                WHEN (
                    appointment.creatorId = :userId
                    OR
                    administrators.userId = :userId 
                )
                THEN 1=1
                ELSE 1=2
            END  
        )`;

        builder = builder.andWhere(cond, {
            userId: user?.sub || 0,
            link: link
        });

        builder = builder.select(select);

        const appointment = await builder.getOne();

        if (!appointment) {
            throw new EntityNotFoundException(null, null, {
                'attribute': 'link',
                'value': link,
                'message': 'Specified appointment does not exist'
            });
        }

        return appointment;
    }

    async getAppointmentForPermissionCheckAndReferenceAsRelation(link: string): Promise<Appointment> {
        let select = ['appointment.id', 'administrators', 'appointment.creatorId'];

        let builder = getRepository(Appointment).createQueryBuilder('appointment');
        builder = builder.leftJoinAndSelect('appointment._administrators', 'administrators');
        builder = builder.where('appointment.link = :link', {link: link});
        builder = builder.select(select);

        const appointment = await builder.getOne();

        if (!appointment) {
            throw new EntityNotFoundException(null, null, 'appointment');
        }

        return appointment;
    }

    async checkForAppointmentExistenceAndOwnershipAndReturnForRelation(link: string, user: JWT_User) {
        const appointment = await this.getAppointmentForPermissionCheckAndReferenceAsRelation(link);

        const appointmentPermissionChecker = new AppointmentPermissionChecker(appointment);

        if (!appointmentPermissionChecker.userIsCreator(user)) {
            throw new InsufficientPermissionsException(null, "You need to be creator to execute this operation", null);
        }

        return appointment;
    }

    /* istanbul ignore next */
    private async getAppointments(user: JWT_User, pinList, before: Date, limit) {
        // add value, cuz SQL cant process empty list
        const pins = pinList.getArray();
        if (pins.length === 0) {
            pins.push('_');
        }

        const output = await getRepository(Appointment)
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.creator', 'creator')
            .leftJoinAndSelect('appointment._additions', 'additions')
            .leftJoinAndSelect('appointment.enrollments', 'enrollments')
            .leftJoinAndSelect('enrollments.passenger', 'enrollment_passenger')
            .leftJoinAndSelect('enrollments.driver', 'enrollment_driver')
            .leftJoinAndSelect('enrollments._additions', 'enrollment_additions')
            .leftJoinAndSelect('enrollments.creator', 'enrollment_creator')
            .leftJoinAndSelect('appointment.files', 'files')
            .leftJoinAndSelect('appointment.administrators', 'administrators')
            .leftJoinAndSelect('appointment.pinners', 'pinners')
            .select(['appointment', 'additions', 'enrollments',
                'enrollment_passenger', 'enrollment_driver', 'enrollment_creator',
                'creator.username', 'creator.name', 'files', 'administrators.username', 'administrators.name',
                'enrollment_additions', 'pinners'])
            .where(new Brackets(br => {
                br.where('creator.id = :creatorId', {creatorId: user.sub})
                    .orWhere('administrators.id = :admin', {admin: user.sub})
                    .orWhere('enrollments.creatorId = :user', {user: user.sub})
                    .orWhere('pinners.id = :user', {user: user.sub})
                    .orWhere('appointment._link IN (:...links)', {links: pins});
            }))
            .andWhere(before ? 'UNIX_TIMESTAMP(appointment._date) < UNIX_TIMESTAMP(:_date)' : 'UNIX_TIMESTAMP(appointment._date) > UNIX_TIMESTAMP(:date2)', {
                date: before,
                date2: new Date()
            })
            .orderBy('appointment._date', 'DESC')
            .getMany();

        if (!limit) {
            limit = output.length;
        }

        return output.splice(0, limit); // needed because .limit or .take break the joins

        // return await this.appointmentRepository.find(
        //     {
        //         join: {
        //             alias: 'appointment', innerJoin: {
        //                 administrators: 'appointment.administrators',
        //                 enrollments: 'appointment.enrollments',
        //                 enrollmentsCreator: 'enrollments.creator',
        //                 pinners: 'appointment.pinners'
        //             }
        //         },
        //         where: [
        //             {creator: {id: user.id}},
        //             {administrators: {id: user.id}},
        //             {enrollmentsCreator: {id: user.id}},
        //             {pinners: {id: user.id}},
        //             {_link: In(pins)},
        //         ],
        //         order: {
        //             _date: 'DESC'
        //         },
        //     }
        // );
    }

    private async appointmentIsHidden(link: string): Promise<boolean> {
        const appointment = await getRepository(Appointment)
            .createQueryBuilder('appointment')
            .select(['appointment.hidden'])
            .where('appointment.link = :link', {link})
            .getOne();

        if (!appointment) {
            throw new EntityNotFoundException(null, null, {
                'attribute': 'link',
                'value': link,
                'message': 'Specified appointment does not exist'
            });
        }

        return !!appointment.hidden;
    }

    private handleAdditionUpdate(appointment: Appointment, value: IAppointmentUpdateAdditionDTO[]) {
        const additionList = appointment.additions;
        additionList.updateList(value);

        appointment.additions = additionList;
    }
}
