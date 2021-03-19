import {Injectable} from '@nestjs/common';
import {Appointment} from './appointment.entity';
import {Brackets, getRepository, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Addition} from '../addition/addition.entity';
import {File} from '../file/file.entity';
import {AdditionService} from '../addition/addition.service';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {UserService} from '../user/user.service';
import {FileService} from '../file/file.service';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {GeneratorUtil} from '../../util/generator.util';
import {UnknownUserException} from '../../exceptions/UnknownUserException';
import {AppointmentGateway} from './appointment.gateway';
import {AppointmentUtil} from './appointment.util';
import {AppointmentMapper} from './appointment.mapper';
import {PushService} from '../push/push.service';
import {JWT_User} from '../user/user.model';
import {AlreadyUsedException} from '../../exceptions/AlreadyUsedException';

const logger = require('../../logger');

@Injectable()
export class AppointmentService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        private additionService: AdditionService,
        private fileService: FileService,
        private userService: UserService,
        private appointmentGateway: AppointmentGateway,
        private pushService: PushService,
    ) {
    }

    /**
     * Find {@link Appointment} its unique link.
     *
     * @param link          Link of {@link Appointment}
     *
     * @throws EntityNotFoundException if given link does not match any {@link Appointment}
     */
    public async findByLink(link: string): Promise<Appointment> {
        let appointment = await this.appointmentRepository.findOne({
            where: {
                link: link
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

    /** MAIN FUNCTIONS  **/

    /** MAIN FUNCTIONS  **/

    /**
     * TODO
     * Dont fetch enrollments when slim
     *
     * Get an Appointment by its link. Checking for permissions by analysing query parameter,
     * being creator or being administrator.
     *
     * @param user Requester
     * @param link Link of appointment to fetch for
     * @param permissions Needed if appointment is hidden. Gives permission for enrollment
     * @param slim Exclude enrollments and files to save bandwidth
     *
     * @returns Appointment after applying filters
     *
     * @throws EntityNotFoundException if appointment not found
     */
    public async get(user: JWT_User, link: string, permissions: any, slim: boolean): Promise<Appointment> {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

        appointment = this.userBasedAppointmentPreparation(appointment, user, permissions, slim);

        return appointment;
    }

    /**
     * Fetch all !!active!! Appointments, the user is allowed to see.
     * This includes being the creator, an administrator or being enrolled into this Appointment.
     * Additionally, pinned appointments get returned. Further an array of links can be passed
     * with this request to show, that you know this Appointment too. (e.g. pinned in frontend).-
     * <br />
     * When passing a link with this request, the corresponding Appointment gets marked as "PINNED"
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
        let pins = AppointmentUtil.parsePins(params);

        let appointments = await this.getAppointments(user, pins, undefined, null);

        const output = [];

        appointments.forEach(appointment => {
            output.push(
                this.userBasedAppointmentPreparation(appointment, user, {}, slim)
            );
        });

        return output;
    }

    /**
     * Fetch all Appointments from the past, the user is allowed to see.
     * This includes being the creator, an administrator or being enrolled into this Appointment.
     * Additionally, pinned appointments get returned. Further an array of links can be passed
     * with this request to show, that you know this Appointment too. (e.g. pinned in frontend).-
     * <br />
     * When passing a link with this request, the corresponding Appointment gets marked as "PINNED"
     * <br />
     * <br />
     * All appointments include a relations. See {@link parseReferences} for more information
     *
     * @param user      Requester (if existing)
     * @param params    All query parameters to parse pinned links
     * @param _slim     Delete information overhead. See {@link AppointmentMapper.slim} for more information.
     * @param before    Date (string) for pagination. Return elements that took place before this particular date
     * @param limit     Number of elements to return
     *
     * @returns Appointment[]
     */
    public async getAllArchive(user: JWT_User, params: any, _slim: boolean, before: string, limit: number): Promise<Appointment[]> {
        let pins: any[] = AppointmentUtil.parsePins(params);

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

        let appointments = await this.getAppointments(user, pins, _before, limit);
        appointments = appointments.map(appointment => {
            this.userBasedAppointmentPreparation(appointment, user, {}, _slim);
            return appointment;
        });

        return appointments;
    }

    /**
     * Create appointment. <br/>
     * Not all options are passed here. Only the core information gets processed.
     * All other information are getting set via the specific options
     *
     * @param appointmentData Appointment data to create appointment with
     * @param user Requester
     *
     * @returns Created appointment after applying filters
     *
     * @throws DuplicateValueException if link is already in use
     */
    public async create(appointmentData: Appointment, user: JWT_User): Promise<{ id: string, link: string }> {
        let appointmentToDB = new Appointment();

        appointmentToDB.title = appointmentData.title;
        appointmentToDB.description = appointmentData.description;

        appointmentToDB.link = await this.handleAppointmentLink(appointmentData.link);

        appointmentToDB.location = appointmentData.location;

        try {
            appointmentToDB.date = await AppointmentUtil.handleDateValidation(appointmentData.date, appointmentData.deadline);
        } catch (e) {
            throw e;
        }

        appointmentToDB.deadline = appointmentData.deadline;

        if (appointmentData.maxEnrollments > 0) {
            appointmentToDB.maxEnrollments = appointmentData.maxEnrollments;
        } else {
            appointmentToDB.maxEnrollments = null;
        }

        appointmentToDB.driverAddition = !!(appointmentData.driverAddition);
        appointmentToDB.creatorId = user.sub;
        appointmentToDB.additions = await this._createAdditionEntitiesAndFilterDuplicates(appointmentData.additions);

        appointmentToDB = await this.appointmentRepository.save(appointmentToDB);

        const appointmentMapper = new AppointmentMapper(this.userService);
        return appointmentMapper.create(appointmentToDB);
    }

    /**
     *
     * Updated values passed by any object. Only overall data allowed to update like this.<br/>
     * additions, link, date deadline need special validation.
     *
     * @param toChange any {} with the values to change given Appointment with
     * @param link Current link of Appointment
     * @param user Requester
     */
    public async update(toChange: any, link: string, user: JWT_User) {
        let appointment;

        appointment = await this.findByLink(link);

        if (!appointment.isCreatorOrAdministrator(user)) {
            throw  new InsufficientPermissionsException(null, null, [
                    {
                        'attribute': 'link',
                        'in': 'path',
                        'value': link,
                        'message': 'Specified appointment is not in your ownership. You are also not permitted to administrate this appointment.'
                    }
                ]
            );
        }

        const allowedValuesToChange = ['title', 'description', 'link',
            'location', 'date', 'deadline', 'maxEnrollments', 'hidden', 'additions',
            'driverAddition'];

        for (const [key, value] of Object.entries(toChange)) { // TODO REFACTOR LIKE AT USER AND ENROLLMENT
            if (key in appointment
                && appointment[key] !== value
                && allowedValuesToChange.indexOf(key) > -1) {
                let changedValue = value;

                if (key === 'link') {
                    if (await this.linkInUse(value)) {
                        throw new AlreadyUsedException('DUPLICATE_VALUES',
                            'Provided values are already in use', [{
                                'attribute': 'link',
                                'value': value,
                                'message': 'Value is already in use by other appointment. Specify a different link'
                            }]);
                    }

                    changedValue = value;
                }

                if (key === 'additions') {
                    changedValue = await this._handleAdditionUpdate(value, appointment);
                }

                if (key === 'date') {
                    try {
                        changedValue = await AppointmentUtil.handleDateValidation(value, appointment.deadline);
                    } catch (e) {
                        throw e;
                    }
                }

                // TODO NEEDS TO ACCOUNT FOR DOUBLE CHANGE (DATE AND DEADLINE AT THE SAME TIME)
                if (key === 'deadline') {
                    try {
                        changedValue = await AppointmentUtil.handleDeadlineValidation(appointment.date, value);
                    } catch (e) {
                        throw e;
                    }
                }

                if (key === 'maxEnrollments') {
                    if (value > 0) {
                        changedValue = value;
                    } else {
                        changedValue = null;
                    }
                }

                logger.log('debug', `[${appointment.id}] ${key} changed from ${JSON.stringify(appointment[key])} to ${JSON.stringify(changedValue)}`);

                appointment[key] = changedValue;
            }
        }

        appointment = await this.appointmentRepository.save(appointment);

        this.appointmentGateway.appointmentUpdated(appointment);
        this.pushService
            .appointmentChanged(appointment)
            .catch((err) => {
                logger.error(' Push notifications could not be send', err);
            });

        return appointment;
    }

    /**
     * Add an administrator to a specific appointment. <br />
     * Operation can only be executed by the owner of the Appointment.
     *
     * @param _user Requester (should be owner of appointment)
     * @param link Link of appointment
     * @param username Username of administrator to add
     *
     * @returns void if successful
     *
     * @throws See {@link findByLink} for relations
     * @throws InsufficientPermissionsException if user is not the owner
     * @throws UnknownUserException if user to add does not exist
     */
    public async addAdministrator(_user: JWT_User, link: string, username: string) {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

        if (!appointment.isCreator(_user)) {
            throw new InsufficientPermissionsException();
        }

        let admin;

        try {
            admin = await this.userService.findByUsername(username);
        } catch (e) {
            throw new UnknownUserException('NOT_FOUND',
                `User not found by username`, username);
        }

        appointment._administrators.push(admin.sub);

        return await this.appointmentRepository.save(appointment);
    }

    /**
     * Remove an administrator of a specific appointment. <br />
     * Operation can only be executed by the owner of the Appointment.
     *
     * @param _user Requester  (should be owner of appointment)
     * @param link Link of appointment
     * @param username Username of administrator to add
     *
     * @returns void if successful
     *
     * @throws See {@link findByLink} for relations
     * @throws InsufficientPermissionsException if user is not the owner
     *
     * TODO
     * go over admin directly?
     */
    public async removeAdministrator(_user: JWT_User, link: string, username: string): Promise<void> {
        const appointment = await this.findByLink(link);

        if (!appointment.isCreator(_user)) {
            throw new InsufficientPermissionsException();
        }

        const user = await this.userService.findByUsername(username);

        appointment._administrators = appointment._administrators.filter(
            fAdministrator => {
                return fAdministrator.userId !== user.sub;
            }
        );

        await this.appointmentRepository.save(appointment);
    }

    /**
     * Add File to a specific appointment. <br />
     * Operation can only be executed by the owner of the Appointment.
     *
     * @param _user Requester (should be owner of appointment)
     * @param link Link of appointment
     * @param data Contains information about the name of the file and its data
     *
     * @returns void if successful
     *
     * @throws See {@link findByLink} for relations
     * @throws InsufficientPermissionsException if user is not the owner
     * @throws UnknownUserException if user to add does not exist
     */
    public async addFile(_user: JWT_User, link: string, data: any) {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

        if (!appointment.isCreator(_user)) {
            throw new InsufficientPermissionsException();
        }

        const file = new File();
        file.name = data.name;
        file.data = data.data;

        const savedFile = await this.fileService.__save(file);
        appointment.files.push(savedFile);

        this.appointmentGateway.appointmentUpdated(appointment);

        return await this.appointmentRepository.save(appointment);
    }

    /**
     * Remove an file of a specific appointment. <br />
     * Operation can only be executed by the owner of the Appointment. <br/>
     * In contrast to removing administrators, here the entire database entry can be removed since a file is not used in multiple appointments.
     *
     * @param _user Requester  (should be owner of appointment)
     * @param link Link of appointment
     * @param id Id of file
     *
     * @returns void if successful
     *
     * @throws See {@link findByLink} for relations
     * @throws InsufficientPermissionsException if user is not the owner
     */
    public async removeFile(_user: JWT_User, link: string, id: string) {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

        if (!appointment.isCreator(appointment, _user)) {
            throw new InsufficientPermissionsException();
        }

        let file;

        try {
            file = await this.fileService.findById(id);
            await this.fileService.__remove(file);

            const index = appointment.files.indexOf(file);
            appointment.files.splice(index, 1);

            this.appointmentGateway.appointmentUpdated(appointment);
        } catch (e) {
            //
        }

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
     * Check if passed {@link JWT_User} is administrator or creator of the referenced {@link Appointment}<br/>
     *
     * @param user          {@link JWT_User} to check permissions for
     * @param ref           Link of  {@link Appointment}
     *
     * @returns boolean     true if creator or admin - false if not
     *
     * @throws              See {@link findByLink} for relations
     */
    public async isCreatorOrAdministrator(user: JWT_User, ref: string): Promise<boolean> {
        const appointment = await this.findByLink(ref);
        return appointment.isCreatorOrAdministrator(user);
    }

    public async removeSubscriptionsByUser(appointment: any, user: JWT_User) {
        let app = await this.appointmentRepository.findOne({
            where: {
                link: appointment.link
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

    private async userBasedAppointmentPreparation(appointment: Appointment, user: JWT_User, permissions: any, slim: boolean) {
        const appointmentMapper = new AppointmentMapper(this.userService);

        appointment.relations = AppointmentUtil.parseReferences(user, appointment, [], permissions); // empty pins because fnc is only called on single appointment get request

        appointment = await appointmentMapper.permission(appointment, user, permissions);
        appointment = appointmentMapper.slim(appointment, slim);
        appointment = await appointmentMapper.basic(appointment);

        return appointment;
    }

    private async handleAppointmentLink(_link: string) {
        let link = '';

        if (_link === undefined || _link === '') {
            do {
                link = GeneratorUtil.makeid(5);
            } while (await this.linkInUse(link));
        } else {
            if (await this.linkInUse(_link)) {
                throw new AlreadyUsedException('DUPLICATE_VALUES',
                    'Provided values are already in use', [{
                        'attribute': 'link',
                        'value': _link,
                        'message': 'Value is already in use by other appointment. Specify a different link'
                    }]);
            }

            link = _link;
        }

        return link;
    }

    private async linkInUse(link) {
        try {
            await this.findByLink(link);
            return true;
        } catch (e) {
            return false;
        }
    }

    private async _createAdditionEntitiesAndFilterDuplicates(additions: Addition[]): Promise<Addition[]> {
        let output = [];

        if (!additions) {
            return output;
        }

        let _additionNames = additions.map(mMixedAdditions => mMixedAdditions.name);

        const sorted_arr = _additionNames.slice().sort();
        const duplicates = [];
        for (let i = 0; i < sorted_arr.length - 1; i++) {
            if (sorted_arr[i + 1] === sorted_arr[i]) {
                duplicates.push(sorted_arr[i]);
            }
        }

        const errors = [];
        duplicates.forEach((fDuplicate) => {
            errors.push({'object': 'addition', 'attribute': 'name', 'value': fDuplicate, 'in': 'body'});
        });

        if (duplicates.length > 0) {
            throw new DuplicateValueException('DUPLICATE_ENTRY',
                'Following values are duplicates and can not be used',
                errors);
        }

        let i = 0;
        if (Array.isArray(additions)) {
            for (const fAddition of additions) {
                let addition: Addition = new Addition();
                addition.name = fAddition.name;
                addition.order = i;

                output.push(addition);

                i++;
            }
        }

        return output;
    }

    /**
     * // TODO ALLOW UNDEFINED / NULL
     * Loop through all passed {@link Addition}. <br/>
     *      - If {@link Addition} exists by name, take it. <br/>
     *      - Else create new {@link Addition}. <br/>
     * Order of elements in passed array is important
     *
     * @param mixedAdditions
     * @param appointment
     * @private
     */
    private async _handleAdditionUpdate(mixedAdditions, appointment: Appointment) {
        let output = [];

        const _additionsNames = mixedAdditions.map(mMixedAdditions => mMixedAdditions.name);

        const sorted_arr = _additionsNames.slice().sort();
        const duplicates = [];
        for (let i = 0; i < sorted_arr.length - 1; i++) {
            if (sorted_arr[i + 1] === sorted_arr[i] && sorted_arr[i]) {
                duplicates.push(sorted_arr[i]);
            }
        }

        if (duplicates.length > 0) {
            const errors = [];
            duplicates.forEach((fDuplicate) => {
                errors.push({'object': 'addition', 'attribute': 'name', 'value': fDuplicate, 'in': 'body'});
            });

            throw new DuplicateValueException('DUPLICATE_ENTRY',
                'Following values are duplicates and can not be used',
                errors);
        }

        let index = 0;
        for (let fAddition of mixedAdditions) {
            let addition = new Addition();

            if (fAddition.id) {
                addition = appointment.additions.find(sAddition => sAddition.id === fAddition.id);

                if (!addition) {
                    throw new EntityNotFoundException(null, null, {
                        'object': 'addition',
                        'attribute': 'id',
                        'in': 'body',
                        'value': fAddition.id
                    });
                }
            }

            if (fAddition.name) {
                addition.name = fAddition.name;
            }

            addition.order = index;

            output.push(addition);

            index++;
        }

        // let i = 0;
        // for (let fAddition of mixedAdditions) {
        //     let potExistingAddition;
        //
        //     try {
        //         potExistingAddition = await this.additionService.findByNameAndAppointment(fAddition.name, appointment); // TODO get from appointment and not an extra request
        //
        //         if (!output.some(sAddition => sAddition.name === potExistingAddition.name)) {
        //             potExistingAddition.order = i;
        //             potExistingAddition = await this.additionService.__save(potExistingAddition);
        //             output.push(potExistingAddition);
        //             i++;
        //         }
        //     } catch (e) {
        //
        //         if (!output.some(sAddition => sAddition.name === fAddition.name)) {
        //             potExistingAddition = new Addition();
        //             potExistingAddition.name = fAddition.name;
        //             potExistingAddition.order = i;
        //             potExistingAddition = await this.additionService.__save(potExistingAddition);
        //             output.push(potExistingAddition);
        //         }
        //
        //         i++;
        //     }
        // }

        return output;
    }

    /* istanbul ignore next */
    private async getAppointments(user: JWT_User, pins, before: Date, limit) {
        // add value, cuz SQL cant process empty list
        if (pins.length === 0) {
            pins.push('_');
        }

        const output = await getRepository(Appointment)
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.creator', 'creator')
            .leftJoinAndSelect('appointment.additions', 'additions')
            .leftJoinAndSelect('appointment.enrollments', 'enrollments')
            .leftJoinAndSelect('enrollments.passenger', 'enrollment_passenger')
            .leftJoinAndSelect('enrollments.driver', 'enrollment_driver')
            .leftJoinAndSelect('enrollments.additions', 'enrollment_additions')
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
                    .orWhere('appointment.link IN (:...links)', {links: pins});
            }))
            .andWhere(before ? 'UNIX_TIMESTAMP(appointment.date) < UNIX_TIMESTAMP(:date)' : 'UNIX_TIMESTAMP(appointment.date) > UNIX_TIMESTAMP(:date2)', {
                date: before,
                date2: new Date()
            })
            .orderBy('appointment.date', 'DESC')
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
        //             {link: In(pins)},
        //         ],
        //         order: {
        //             date: 'DESC'
        //         },
        //     }
        // );
    }
}
