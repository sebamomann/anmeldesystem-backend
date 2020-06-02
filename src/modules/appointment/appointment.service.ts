import {Injectable} from '@nestjs/common';
import {Appointment} from './appointment.entity';
import {getRepository, Repository} from 'typeorm';
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
import {EntityGoneException} from '../../exceptions/EntityGoneException';
import {Enrollment} from '../enrollment/enrollment.entity';
import {InvalidValuesException} from '../../exceptions/InvalidValuesException';
import {GeneratorUtil} from '../../util/generator.util';
import {UnknownUserException} from '../../exceptions/UnknownUserException';

const crypto = require('crypto');
const appointmentMapper = require('./appointment.mapper');
const logger = require('../../logger');

@Injectable()
export class AppointmentService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(Addition)
        private readonly additionRepository: Repository<Addition>,
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private additionService: AdditionService,
        private userService: UserService,
        private fileService: FileService
    ) {
    }

    public static isCreatorOfAppointment(_appointment: Appointment, _user: User) {
        if (_user === undefined || _user === null || !_user) {
            return false;
        }

        return _appointment.creator.username === _user.username;
    }

    public static isAdministratorOfAppointment(_appointment: Appointment, _user: User) {
        if (_user === undefined || _user === null || !_user) {
            return false;
        }

        return _appointment.administrators !== undefined
            && _appointment.administrators.some(sAdministrator => sAdministrator.username === _user.username);
    }

    private static async _handleDateValidation(date, deadline) {
        if (date < deadline) {
            throw new InvalidValuesException(null, 'The date can not be before the deadline', ['date']);
        }

        return date;
    }

    private static async _handleDeadlineValidation(date, deadline) {
        if (deadline > date) {
            throw new InvalidValuesException(null, 'The deadline can not be after the date', ['deadline']);
        }

        return deadline;
    }

    public async findByLink(link: string): Promise<Appointment> {
        let appointment = await this.appointmentRepository.findOne({
            where: {
                link: link
            },
            relations: ['administrators']
        });

        if (appointment === undefined) {
            throw new EntityNotFoundException(null, null, 'appointment');
        }

        return appointment;
    }

    /**
     * Get a appointment by its link. Checking for permissions by query parameter,
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

        appointment.reference = this.parseReferences(user, appointment, []);

        appointment = appointmentMapper.permission(this, appointment, user, permissions);
        appointment = appointmentMapper.slim(this, appointment, slim);
        appointment = appointmentMapper.basic(this, appointment);

        return appointment;
    }

    /**
     * Create appointment. <br/>
     * Not all options are passed here. Only the core information gets processed.
     * All other information are getting set via the specific options
     *
     * @param rawData Appointment data to create appointment with
     * @param user Requester
     *
     * @returns Created appointment after applying filters
     *
     * @throws DuplicateValueException if link is already in use
     */
    public async create(rawData: Appointment, user: User) {
        let appointment = new Appointment();

        appointment.title = rawData.title;
        appointment.description = rawData.description;

        try {
            appointment.link = await this.handleAppointmentLink(rawData.link);
        } catch (e) {
            throw e;
        }

        appointment.location = rawData.location;

        // Only date validation needed
        // date < deadline === deadline > date
        try {
            appointment.date = await AppointmentService._handleDateValidation(rawData.date, rawData.deadline);
        } catch (e) {
            throw e;
        }

        appointment.deadline = rawData.deadline;

        if (rawData.maxEnrollments > 0) {
            appointment.maxEnrollments = rawData.maxEnrollments;
        } else {
            appointment.maxEnrollments = null;
        }

        appointment.driverAddition = rawData.driverAddition;
        appointment.creator = user;
        appointment.additions = await this._createAdditionEntitiesAndFilterDuplicates(rawData.additions);

        appointment = await this.appointmentRepository.save(appointment);

        appointment.reference = this.parseReferences(user, appointment, []);

        appointment = appointmentMapper.permission(this, appointment, user, {});
        appointment = appointmentMapper.slim(this, appointment, false);
        appointment = appointmentMapper.basic(this, appointment);

        return appointment;
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
                throw new InsufficientPermissionsException();
            }
        } catch (e) {
            throw new InsufficientPermissionsException();
        }

        const allowedValuesToChange = ['title', 'description', 'link',
            'location', 'date', 'deadline', 'maxEnrollments', 'hidden', 'additions',
            'driverAddition'];

        for (const [key, value] of Object.entries(toChange)) {
            if (key in appointment
                && appointment[key] !== value
                && allowedValuesToChange.indexOf(key) > -1) {
                let changedValue = value;

                if (key === 'additions') {
                    changedValue = await this._handleAdditionsUpdate(value, appointment);
                }

                if (key === 'link') {
                    if (await this.linkInUse(value)) {
                        throw new DuplicateValueException(null, null, ['link']);
                    }

                    changedValue = value;
                }

                if (key === 'date') {
                    try {
                        changedValue = await AppointmentService._handleDateValidation(value, appointment.deadline);
                    } catch (e) {
                        throw e;
                    }
                }

                if (key === 'deadline') {
                    try {
                        changedValue = await AppointmentService._handleDeadlineValidation(appointment.date, value);
                    } catch (e) {
                        throw e;
                    }
                }

                logger.log('debug', `[${appointment.id}] ${key} changed from ${JSON.stringify(appointment[key])} to ${JSON.stringify(changedValue)}`);

                appointment[key] = changedValue;
            }
        }

        appointment = await this.appointmentRepository.save(appointment);

        appointment.reference = this.parseReferences(user, appointment, []);

        appointment = appointmentMapper.permission(this, appointment, user, {});
        appointment = appointmentMapper.slim(this, appointment, false);
        appointment = appointmentMapper.basic(this, appointment);

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
     * @param slim Delete information overhead. See {@link appointmentMapper.slim} for more information.
     *
     * @returns Appointment[]
     */
    public async getAll(user: User, params: any, slim = false): Promise<Appointment[]> {
        let pins = [];
        for (const queryKey of Object.keys(params)) {
            if (queryKey.startsWith('pin')) {
                pins.push(params[queryKey]);
            }
        }

        let appointments = await this.getAppointments(user, pins);
        // let appointments = await this.appointmentRepository.find({
        //     join: {
        //         alias: "appointment",
        //         leftJoinAndSelect: {
        //             administrators: "appointment.administrators",
        //             enrollments: "appointment.enrollments",
        //             enrollmentCreator: "enrollments.creator",
        //             pinners: "appointment.pinners"
        //         }
        //     },
        //     where: [
        //         {creator: {id: user.id}},
        //         {administrators: {id: user.id}},
        //         {enrollmentCreator: {id: user.id}},
        //         {pinners: {id: user.id}},
        //         {link: In(pins)}
        //     ],
        //     order: {
        //         date: 'DESC'
        //     }
        // });

        appointments.map(fAppointment => {
            fAppointment.reference = this.parseReferences(user, fAppointment, pins);
        });

        appointments.map(appointment => {
            appointment = appointmentMapper.permission(this, appointment, user, {});
            appointment = appointmentMapper.slim(this, appointment, slim);
            appointment = appointmentMapper.basic(this, appointment);
            return appointment;
        });

        return appointments;
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

        if (!AppointmentService.isCreatorOfAppointment(appointment, _user)) {
            throw new InsufficientPermissionsException();
        }

        let admin;

        try {
            admin = await this.userService.findByUsername(username);

        } catch (e) {
            throw new UnknownUserException('NOT_FOUND',
                `User not found by username`);
        }

        appointment.administrators.push(admin);

        await this.appointmentRepository.save(appointment);
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

        if (!AppointmentService.isCreatorOfAppointment(appointment, _user)) {
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

        if (!AppointmentService.isCreatorOfAppointment(appointment, _user)) {
            throw new InsufficientPermissionsException();
        }

        const file = new File();
        file.name = data.name;
        file.data = data.data;

        const savedFile = await this.fileRepository.save(file);
        appointment.files.push(savedFile);

        await this.appointmentRepository.save(appointment);
    }

    /**
     * Remove an file of a specific appointment. <br />
     * Operation can only be executed by the owner of the Appointment.
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

        if (!AppointmentService.isCreatorOfAppointment(appointment, _user)) {
            throw new InsufficientPermissionsException();
        }

        let file;

        try {
            file = await this.fileService.findById(id);
        } catch (e) {
            throw new EntityGoneException(null, null, 'file');
        }

        await this.fileRepository.remove(file);
    }

    /**
     * Toggle the pinning state of an appointment in relation to the user.
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
            _user = await this.userService.findById(user.id);
        } catch (e) {
            throw e;
        }

        if (_user.pinned.some(sPinned => sPinned.id === appointment.id)) {
            const removeIndex = _user.pinned.indexOf(appointment);
            _user.pinned.splice(removeIndex, 1);
        } else {
            _user.pinned.push(appointment);
        }

        _user = await this.userRepository.save(_user);

        return _user.pinned;
    }

    /**
     * Checks if a user is administrator orCreator of an Appointment
     *
     * @param user to check permissions for
     * @param ref (1) link of appointment
     *            (2) appointment itself
     *
     * @returns boolean true if creator or admin - false if not
     *
     * @throws See {@link findByLink} for reference
     */
    public async isCreatorOrAdministrator(user: User, ref: string | Appointment,): Promise<boolean> {
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

        return AppointmentService.isCreatorOfAppointment(appointment, user)
            || AppointmentService.isAdministratorOfAppointment(appointment, user);
    }

    /**
     * Filters out all enrollments, the requester is not allowed to see.<br />
     * Done by validation the query parameters (id and token) passed with te request.
     * If the token is valid and the enrollment id exists in the enrollments array, then return it.<br/>
     * <br />
     * The query parameters are determined by the starting sequence
     * <br />
     * "perm" for the id (e.g. perm1, perm2, perm3) <br />
     * "token" for the validation token of the id (e.g. token1, token2, token3) <br/>
     * <br />
     *
     * IMPORTANT - The order of the ids with their corresponding token is important!.
     * The second id passed, will be verified with the second passed token!
     *
     * @param permissions All raw query parameters
     * @param enrollments Enrollments to filter
     *
     * @returns Enrollment[] ALl filtered enrollments
     */
    public filterPermittedEnrollments(permissions: any, enrollments: Enrollment[]) {
        let extractedIds = [];
        let extractedTokens = [];
        for (const queryKey of Object.keys(permissions)) {
            if (queryKey.startsWith('perm')) {
                extractedIds.push(permissions[queryKey]);
            } else if (queryKey.startsWith('token')) {
                extractedTokens.push(permissions[queryKey]);
            }
        }

        let validIds = [];
        extractedIds.forEach((fId, i) => {
            const token = crypto.createHash('sha256')
                .update(fId + process.env.SALT_ENROLLMENT)
                .digest('hex');
            if (extractedTokens[i] !== undefined
                && token === extractedTokens[i].replace(' ', '+')) {
                validIds.push(fId);
            }
        });

        return enrollments.filter(fEnrollment => {
            if (validIds.includes(fEnrollment.id)) {
                return fEnrollment;
            }
        });
    }

    /**
     * Check the users correlation to the appointment. <br />
     * Following correlations (references) are possible
     * <ol>
     *     <li>CREATOR</li>
     *     <li>ADMIN</li>
     *     <li>ENROLLED</li>
     *     <li>PINNED</li>
     * </ol>
     * Note that a permission granted via passing a link, the correlation is also marked as "PINNED".<br/>
     * Multiple correlations are possible without any restrictions.
     *
     * @param user Requester (if existing) to correlate
     * @param appointment Appointment to correlate user with
     * @param pins Links of pinned Appointments (passed via query parameter)
     *
     * @returns string[] Array of all correlations regarding User and Appointment
     */
    public parseReferences(user: User, appointment: Appointment, pins: string[]) {
        const reference = [];

        if (user != null) {
            if (AppointmentService.isAdministratorOfAppointment(appointment, user)) {
                reference.push('ADMIN');
            }

            if (AppointmentService.isCreatorOfAppointment(appointment, user)) {
                reference.push('CREATOR');
            }

            if (appointment.enrollments !== undefined
                && appointment.enrollments.some(sEnrollment => {
                    return sEnrollment.creator != null
                        && sEnrollment.creator.id === user.id;
                })) {
                reference.push('ENROLLED');
            }

            if ((appointment.pinners !== undefined
                && appointment.pinners.some(sPinner => sPinner.id === user.id))
                || pins.includes(appointment.link)) {
                reference.push('PINNED');
            }
        }

        return reference;
    }

    private async handleAppointmentLink(_link: string) {
        let link = '';

        if (_link === null || _link === undefined || _link === '') {
            do {
                link = GeneratorUtil.makeid(5);
            } while (await this.linkInUse(link));
        } else {
            console.log(_link);
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

    private async _createAdditionEntitiesAndFilterDuplicates(_additions) {
        let output = [];

        if (_additions !== undefined) {
            for (const fAddition of _additions) {
                if (!output.some(sAddition => sAddition.name === fAddition.name)) {
                    let _addition: Addition = new Addition();
                    _addition.name = fAddition.name;
                    await this.additionRepository.save(_addition);
                    output.push(_addition);
                }
            }
        }

        return output;
    }

    private async _handleAdditionsUpdate(mixedAdditions, appointment: Appointment) {
        let output = [];

        for (let fAddition of mixedAdditions) {
            let potExistingAddition;

            try {
                potExistingAddition = await this.additionService.findByNameAndAppointment(fAddition.name, appointment);

                if (!output.some(sAddition => sAddition === potExistingAddition)) {
                    output.push(potExistingAddition);
                }
            } catch (e) {
                potExistingAddition = new Addition();
                potExistingAddition.name = fAddition.name;
                potExistingAddition = await this.additionRepository.save(potExistingAddition);
                output.push(potExistingAddition);
            }
        }

        return output;
    }

    public async getAppointments(user: User, pins) {
        return await getRepository(Appointment)
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
            .where('creator.id = :creatorId', {creatorId: user.id})
            .orWhere('administrators.id = :admin', {admin: user.id})
            .orWhere('enrollments.creatorId = :user', {user: user.id})
            .orWhere('pinners.id = :user', {user: user.id})
            .orWhere('appointment.link IN (:...links)', {links: pins})
            .orderBy('appointment.date', 'DESC')
            .getMany();

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
