import {Injectable} from '@nestjs/common';
import {Appointment} from './appointment.entity';
import {Brackets, getRepository, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Addition} from '../addition/addition.entity';
import {File} from '../file/file.entity';
import {User} from '../user/user.entity';
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

const logger = require('../../logger');

@Injectable()
export class AppointmentService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        private additionService: AdditionService,
        private fileService: FileService,
        private userService: UserService,
        private appointmentGateway: AppointmentGateway
    ) {
    }

    private static userBasedAppointmentPreparation(appointment: Appointment, user: User, permissions: any, slim: boolean) {
        appointment.reference = AppointmentUtil.parseReferences(user, appointment, []); // empty pins because fnc is only called on single appointment get request

        appointment = AppointmentMapper.sortAdditions(appointment);
        appointment = AppointmentMapper.permission(appointment, user, permissions);
        appointment = AppointmentMapper.slim(appointment, slim);
        appointment = AppointmentMapper.basic(appointment);

        return appointment;
    }

    /** MAIN FUNCTIONS  **/

    /** MAIN FUNCTIONS  **/

    /**
     * Find Appointment with its relations by its link.
     *
     * @param link String link of Appointment
     *
     * @throws EntityNotFoundException if given link does not match any appointment
     */
    public async findByLink(link: string): Promise<Appointment> {
        let appointment = await this.appointmentRepository.findOne({
            where: {
                link: link
            },
            relations: ['administrators', 'creator'] // might not be needed anymore
        });

        if (appointment === undefined) {
            throw new EntityNotFoundException(null, null, 'appointment');
        }

        return appointment;
    }

    /**
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
    public async get(user: User, link: string, permissions: any, slim: boolean): Promise<Appointment> {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

        appointment = AppointmentService.userBasedAppointmentPreparation(appointment, user, permissions, slim);

        return appointment;
    }

    /**
     * Fetch all Appointments, the user is allowed to see.
     * This includes being the creator, an administrator or being enrolled into this appoinment.
     * Additionally, pinned appointments get returned. Further an array of links can be passed
     * with this request to show, that you know this Appointment too. (e.g. pinned in frontend).-
     * <br />
     * When passing a link with this request, the corresponding Appointment gets marked as "PINNED" <br />
     * <br />
     * All appointments include a reference. See {@link parseReferences} for more information
     *
     * @param user Requester (if existing)
     * @param params All query parameters to parse pinned links
     * @param slim Delete information overhead. See {@link AppointmentMapper.slim} for more information.
     * @param before
     * @param limit
     *
     * @returns Appointment[]
     */
    public async getAll(user: User, params: any, slim, before, limit): Promise<Appointment[]> {

        let pins = [];
        for (const queryKey of Object.keys(params)) {
            if (queryKey.startsWith('pin')) {
                pins.push(params[queryKey]);
            }
        }

        let appointments = await this.getAppointments(user, pins, before, limit);
        appointments = appointments.map(appointment => AppointmentService.userBasedAppointmentPreparation(appointment, user, {}, slim));

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
    public async create(appointmentData: Appointment, user: User): Promise<Appointment> {
        let appointmentToDB = new Appointment();

        appointmentToDB.title = appointmentData.title;
        appointmentToDB.description = appointmentData.description;

        try {
            appointmentToDB.link = await this.handleAppointmentLink(appointmentData.link);
        } catch (e) {
            throw e;
        }

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

        appointmentToDB.driverAddition = appointmentData.driverAddition;
        appointmentToDB.creator = user;
        appointmentToDB.additions = await this._createAdditionEntitiesAndFilterDuplicates(appointmentData.additions);

        appointmentToDB = await this.appointmentRepository.save(appointmentToDB);

        appointmentToDB = AppointmentService.userBasedAppointmentPreparation(appointmentToDB, user, {}, false);

        return appointmentToDB;
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
    public async update(toChange: any, link: string, user: User) {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

        try {
            if (!(await this.isCreatorOrAdministrator(user, appointment))) {
                throw  new InsufficientPermissionsException();
            }
        } catch (e) {
            throw new InsufficientPermissionsException();
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
                        throw new DuplicateValueException(null, null, ['link']);
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

        appointment = AppointmentService.userBasedAppointmentPreparation(appointment, user, {}, false);

        this.appointmentGateway.appointmentUpdated(appointment);

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
     * @throws See {@link findByLink} for reference
     * @throws InsufficientPermissionsException if user is not the owner
     * @throws UnknownUserException if user to add does not exist
     */
    public async addAdministrator(_user: User, link: string, username: string) {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

        if (!AppointmentUtil.isCreatorOfAppointment(appointment, _user)) {
            throw new InsufficientPermissionsException();
        }

        let admin;

        try {
            admin = await this.userService.findByUsername(username);

        } catch (e) {
            throw new UnknownUserException('NOT_FOUND',
                `User not found by username`, username);
        }

        appointment.administrators.push(admin);

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
     * @throws See {@link findByLink} for reference
     * @throws InsufficientPermissionsException if user is not the owner
     */
    public async removeAdministrator(_user: User, link: string, username: string) {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

        if (!AppointmentUtil.isCreatorOfAppointment(appointment, _user)) {
            throw new InsufficientPermissionsException();
        }

        appointment.administrators = appointment.administrators.filter(fAdministrator => {
            return fAdministrator.username !== username;
        });

        return this.appointmentRepository.save(appointment);
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
     * @throws See {@link findByLink} for reference
     * @throws InsufficientPermissionsException if user is not the owner
     * @throws UnknownUserException if user to add does not exist
     */
    public async addFile(_user: User, link: string, data: any) {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

        if (!AppointmentUtil.isCreatorOfAppointment(appointment, _user)) {
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
     * @throws See {@link findByLink} for reference
     * @throws InsufficientPermissionsException if user is not the owner
     */
    public async removeFile(_user: User, link: string, id: string) {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

        if (!AppointmentUtil.isCreatorOfAppointment(appointment, _user)) {
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
    public async togglePinningAppointment(user: User, link: string) {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

        let _user;

        try {
            _user = await this.userService.findById(user.id); // check if user even exists anymore or not
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
     * Checks if a user is administrator or creator of an Appointment.<br/>
     * Appointment can be passed as reference or just the link of the appointment
     *
     * @param user to check permissions for
     * @param ref (1) link of Appointment
     *            (2) Appointment itself
     *
     * @returns boolean true if creator or admin - false if not
     *
     * @throws See {@link findByLink} for reference
     */
    public async isCreatorOrAdministrator(user: User, ref: string | Appointment): Promise<boolean> {
        let appointment;

        if (typeof ref === 'string') {
            try {
                appointment = await this.findByLink(ref);
            } catch (e) {
                throw e;
            }
        } else {
            appointment = ref;
        }

        return AppointmentUtil.isCreatorOrAdministrator(appointment, user);
    }

    private async handleAppointmentLink(_link: string) {
        let link = '';

        if (_link === undefined || _link === '') {
            do {
                link = GeneratorUtil.makeid(5);
            } while (await this.linkInUse(link));
        } else {
            if (await this.linkInUse(_link)) {
                throw new DuplicateValueException(null, null, ['link']);
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

    private async _createAdditionEntitiesAndFilterDuplicates(additions: Addition[]) {
        let output = [];

        let i = 0;
        if (additions !== undefined) {
            for (const fAddition of additions) {
                if (!output.some(sAddition => sAddition.name === fAddition.name)) {
                    let addition: Addition = new Addition();
                    addition.name = fAddition.name;
                    addition.order = i;

                    await this.additionService.__save(addition);

                    output.push(addition);

                    i++;
                }
            }
        }

        return output;
    }

    private async _handleAdditionUpdate(mixedAdditions, appointment: Appointment) {
        let output = [];

        let i = 0;
        for (let fAddition of mixedAdditions) {
            let potExistingAddition;

            try {
                potExistingAddition = await this.additionService.findByNameAndAppointment(fAddition.name, appointment);

                if (!output.some(sAddition => sAddition.name === potExistingAddition.name)) {
                    potExistingAddition.order = i;
                    potExistingAddition = await this.additionService.__save(potExistingAddition);
                    output.push(potExistingAddition);
                    i++;
                }
            } catch (e) {

                potExistingAddition = new Addition();
                potExistingAddition.name = fAddition.name;
                potExistingAddition.order = i;
                potExistingAddition = await this.additionService.__save(potExistingAddition);
                output.push(potExistingAddition);

                i++;
            }
        }

        return output;
    }

    /* istanbul ignore next */
    private async getAppointments(user: User, pins, before, limit) {
        if (!before || before === 'undefined' || before === 'null') {
            const currentYear = new Date().getFullYear();

            const d = new Date();
            before = d.setFullYear(d.getFullYear() + (2037 - currentYear)); // undefined get from 100 years in future MAX 2038 DUE TO UNIX OVERFLOW
        }

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
                br.where('creator.id = :creatorId', {creatorId: user.id})
                    .orWhere('administrators.id = :admin', {admin: user.id})
                    .orWhere('enrollments.creatorId = :user', {user: user.id})
                    .orWhere('pinners.id = :user', {user: user.id})
                    .orWhere('appointment.link IN (:...links)', {links: pins});
            }))
            .andWhere('UNIX_TIMESTAMP(appointment.date) < UNIX_TIMESTAMP(:date2)', {date2: (new Date(before))})
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
