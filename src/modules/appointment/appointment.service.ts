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
import {AppointmentPinList} from '../pinner/appointmentPinList';
import {AppointmentRepository} from './appointment.repository';
import {IAppointmentCreationResponseDTO} from './DTOs/IAppointmentCreationResponseDTO';
import {IAppointmentUpdateAdditionDTO} from './DTOs/IAppointmentUpdateAdditionDTO';
import {InvalidAttributesException} from '../../exceptions/InvalidAttributesException';
import {PermissionRelation} from '../PermissionRelation.type';
import {InvalidValuesException} from '../../exceptions/InvalidValuesException';

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

        return appointmentMapper.basic(appointment, user, new AppointmentPinList(), enrollmentPermissionList, slim);
    }

    /**
     * Fetch all {@link }Appointments}, the requester is allowed to see.<br/>
     * This includes being the creator, an {@link Administrator} or being enrolled into this {@link Appointment}.
     * Includes pinned {@link Appointment}. List of links can be passed. Treated as "PINNED" in response.
     * <br />
     * @param user              Requester - ** can be null **
     * @param queryParameter    Query parameters containing links as \pin\d\
     * @param before            Date to filter selection. Date of {@link Appointment} needs to be before this date
     * @param after             Date to filter selection. Date of {@link Appointment} needs to be after this date
     * @param limit             Number of elements to return
     * @param slim              Exclude enrollments and files to save bandwidth
     *
     * @returns Appointment[]
     */
    public async getAll(user: JWT_User, queryParameter: any, before: string, after: string, limit: number, slim: boolean): Promise<IAppointmentResponseDTO[]> {
        let pinList = new AppointmentPinList(queryParameter);
        let permissionList = new EnrollmentPermissionList(queryParameter);

        if (!this.isValidDate(new Date(before)) && before) {
            throw new InvalidValuesException(null, null, ['before']);
        }

        if (!this.isValidDate(new Date(after)) && after) {
            throw new InvalidValuesException(null, null, ['after']);
        }

        if (isNaN(limit) || (+limit < 0 && limit)) {
            throw new InvalidValuesException(null, null, ['limit']);
        }

        let appointments = await this.getAppointments(user, pinList, permissionList, new Date(before), new Date(after), +limit, slim);

        const appointmentMapper = new AppointmentMapper(this.userService);

        const output = [];

        for (const appointment of appointments) {
            output.push(await appointmentMapper.basic(appointment, user, pinList, permissionList, slim));
        }

        return output;
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
        let appointment: Appointment;

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
     * Check if passed {@link JWT_User} is {@link Administrator} or creator of the referenced {@link Appointment}
     *
     * @param user          {@link JWT_User} to check permissions for
     * @param ref           Link of  {@link Appointment}
     *
     * @returns boolean     representing condition
     *
     * @throws              See {@link findByLink} for relations
     */
    public async getAppointmentManagementRelation(user: JWT_User, ref: string): Promise<PermissionRelation[]> {
        const appointment = await this.getAppointmentForPermissionCheckAndReferenceAsRelation(ref);

        const appointmentPermissionChecker = new AppointmentPermissionChecker(appointment);

        const output: PermissionRelation[] = [];

        if (appointmentPermissionChecker.userIsAdministrator(user)) {
            output.push('ADMIN');
        }

        if (appointmentPermissionChecker.userIsCreator(user)) {
            output.push('CREATOR');
        }

        return output;
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
        let select = ['appointment', 'additions', 'files', 'administrators', 'pinners']; // TODO DO NOT SELECT PINNER

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
        }

        // data is never selected, if not specified
        builder = builder.leftJoinAndSelect('appointment._files', 'files');

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

    public async getAppointmentForPermissionCheckAndReferenceAsRelation(link: string): Promise<Appointment> {
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

    public async getAppointmentWithPinByUser(link: string, user: JWT_User) {
        let select = ['appointment.id'];

        let builder = getRepository(Appointment).createQueryBuilder('appointment');
        builder = builder.where('appointment.link = :link', {link: link});

        const cond = `
            CASE 
                WHEN pinners.userId = :userId
                THEN pinners.userId = :userId
                ELSE pinners.userId = 0
            END 
            `;

        builder = builder.leftJoinAndSelect('appointment._pinners', 'pinners', cond, {
            userId: user?.sub || 0
        });

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
            throw new InsufficientPermissionsException(null, 'You need to be creator to execute this operation', null);
        }

        return appointment;
    }

    isValidDate(d) {
        // @ts-ignore
        return d instanceof Date && !isNaN(d);
    }

    private async getAppointments(user: JWT_User, pinList: AppointmentPinList, permissionList: EnrollmentPermissionList,
                                  before: Date, after: Date,
                                  limit: number, slim: boolean) {
        let select = ['appointment', 'additions', 'files', 'administrators', 'pinners'];

        let builder = getRepository(Appointment).createQueryBuilder('appointment');

        builder = builder.leftJoinAndSelect('appointment._additions', 'additions');
        builder = builder.leftJoinAndSelect('appointment._administrators', 'administrators');

        const permittedEnrollmentsIds = permissionList.getPermittedEnrollments();

        // List in select needs to have at leas 1 item
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
        }

        // data is never selected, if not specified
        builder = builder.leftJoinAndSelect('appointment._files', 'files');

        const cond2 = `
            CASE 
                WHEN pinners.userId = :userId
                THEN pinners.userId = :userId
                ELSE pinners.userId = 0
            END 
            `;

        builder = builder.leftJoinAndSelect('appointment._pinners', 'pinners', cond2, {
            userId: user?.sub || 0
        });

        builder = builder.where(
            new Brackets(
                (br) => {
                    br.where('appointment.link IN (:...pinnedLinks)', {pinnedLinks: pinList.getArray().length > 0 ? pinList.getArray() : ['0']});
                    br.orWhere('appointment.creatorId = :userId', {userId: user?.sub || 0});
                    br.orWhere('administrators.userId = :userId', {userId: user?.sub || 0});
                    if (!slim) {
                        br.orWhere('enrollments.creatorId = :userId', {userId: user?.sub || 0});
                        br.orWhere('enrollments.id IN (:...enrollmentIds)', {enrollmentIds: permittedEnrollmentsIds});
                    }
                    br.orWhere('pinners.userId = (:...userId)', {userId: user?.sub || 0});
                }
            )
        );

        if (this.isValidDate(before)) {
            builder = builder.andWhere('UNIX_TIMESTAMP(appointment.date) > UNIX_TIMESTAMP(:date)', {
                date: before
            });
        }

        if (this.isValidDate(after)) {
            builder = builder.andWhere('UNIX_TIMESTAMP(appointment.date) < UNIX_TIMESTAMP(:date)', {
                date: after
            });
        }

        builder = builder.orderBy('appointment.date', 'DESC');

        if (limit > 0) {
            builder = builder.limit(limit);
        }

        builder = builder.select(select);

        return await builder.getMany();
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
