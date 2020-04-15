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
import {UnknownUsersException} from '../../exceptions/UnknownUsersException';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {EntityGoneException} from '../../exceptions/EntityGoneException';
import {Enrollment} from '../enrollment/enrollment.entity';
import {InvalidValuesException} from '../../exceptions/InvalidValuesException';

const crypto = require('crypto');
var logger = require('../../logger');
const appointmentMapper = require('./appointment.mapper');

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
        let appointment = this.appointmentRepository.findOne({
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
    public async get(user: User, link: string, permissions: any, slim: boolean) {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw e;
        }

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
            if (!(await this.hasPermission(user, link))) {
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

        appointment = appointmentMapper.permission(this, appointment, user, {});
        appointment = appointmentMapper.slim(this, appointment, false);
        appointment = appointmentMapper.basic(this, appointment);

        return appointment;
    }

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
            if (user != null) {
                if (AppointmentService.isAdministratorOfAppointment(fAppointment, user)) {
                    fAppointment.reference.push('ADMIN');
                }

                if (AppointmentService.isCreatorOfAppointment(fAppointment, user)) {
                    fAppointment.reference.push('CREATOR');
                }

                if (fAppointment.enrollments !== undefined
                    && fAppointment.enrollments.some(sEnrollment => {
                        return sEnrollment.creator != null
                            && sEnrollment.creator.id === user.id;
                    })) {
                    fAppointment.reference.push('ENROLLED');
                }

                if ((fAppointment.pinners !== undefined
                    && fAppointment.pinners.some(sPinner => sPinner.id === user.id))
                    || pins.includes(fAppointment.link)) {
                    fAppointment.reference.push('PINNED');
                }
            }

            if (fAppointment.enrollments) {
                fAppointment.enrollments.map(mEnrollments => {
                    mEnrollments.createdByUser = mEnrollments.creator != null;
                    delete mEnrollments.creator;
                });
            }

            delete fAppointment.pinners;
        });

        if (slim) {
            appointments = appointments.map(fAppointment => {
                delete fAppointment.enrollments;
                delete fAppointment.files;
                return fAppointment;
            });
        }

        return appointments;
    }

    public async addAdministrator(_user: User, link: string, username: string) {
        let appointment;

        try {
            appointment = await this.find(link, null, null);
        } catch (e) {
            throw e;
        }

        if (!AppointmentService.isCreatorOfAppointment(appointment, _user)) {
            throw new InsufficientPermissionsException();
        }

        const user = await this.userService.findByUsername(username);
        if (user === undefined) {
            throw new UnknownUsersException('NOT_FOUND', `User not found by username`);
        }

        appointment.administrators.push(user);

        await this.appointmentRepository.save(appointment);
    }

    public async removeAdministrator(_user: User, link: string, username: string) {
        let appointment;

        try {
            appointment = await this.find(link, null, null);
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

    async findBasic(link: string): Promise<Appointment> {
        return await getRepository(Appointment)
            .createQueryBuilder('appointment')
            .where('appointment.link = :link', {link: link})
            .leftJoinAndSelect('appointment.additions', 'additions')
            .leftJoinAndSelect('appointment.files', 'files')
            .leftJoinAndSelect('appointment.administrators', 'administrators')
            .leftJoinAndSelect('appointment.creator', 'creator')
            .select(['appointment', 'additions', 'files.name', 'files.id', 'administrators', 'creator'])
            .getOne();
    }

    makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    public async addFile(_user: User, link: string, data: any) {
        let appointment;

        try {
            appointment = await this.find(link, null, null);
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

    public async removeFile(_user: User, link: string, id: string) {
        let appointment;

        try {
            appointment = await this.find(link, null, null);
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

    public async pinAppointment(user: User, link: string) {
        let appointment;

        try {
            appointment = await this.find(link, user, null);
        } catch (e) {
            throw e;
        }

        if (!AppointmentService.isCreatorOfAppointment(appointment, user)) {
            throw new InsufficientPermissionsException();
        }

        const _user = await this.userService.findById(user.id);

        if (_user.pinned.some(sPinned => sPinned.id === appointment.id)) {
            const removeIndex = _user.pinned.indexOf(appointment);
            _user.pinned.splice(removeIndex, 1);
        } else {
            _user.pinned.push(appointment);
        }

        await this.userRepository.save(_user);
    }

    async find(link: string, user: User, permissions: any, slim: boolean = false): Promise<Appointment> {
        let appointment = await getRepository(Appointment)
            .createQueryBuilder('appointment')
            .where('appointment.link = :link', {link: link})
            .leftJoinAndSelect('appointment.creator', 'creator')
            .leftJoinAndSelect('appointment.additions', 'additions')
            .leftJoinAndSelect('appointment.enrollments', 'enrollments')
            .leftJoinAndSelect('enrollments.creator', 'enrollment_creator')
            .leftJoinAndSelect('enrollments.passenger', 'enrollment_passenger')
            .leftJoinAndSelect('enrollments.driver', 'enrollment_driver')
            .leftJoinAndSelect('enrollments.additions', 'enrollment_additions')
            .leftJoinAndSelect('appointment.files', 'files')
            .leftJoinAndSelect('appointment.administrators', 'administrators')
            .leftJoinAndSelect('appointment.pinners', 'pinners')
            .select(['appointment', 'additions', 'enrollments',
                'enrollment_passenger', 'enrollment_driver', 'enrollment_creator', 'enrollments.iat',
                'creator.username', 'creator.name', 'files.name', 'files.id', 'administrators.name', 'administrators.username',
                'enrollment_additions', 'pinners'])
            .orderBy('enrollments.iat', 'ASC')
            .getOne();

        if (appointment === undefined) {
            throw new EntityNotFoundException(null, null, 'appointment');
        }

        if (appointment.pinners !== undefined
            && user != null
            && appointment.pinners.some(sPinner => sPinner.id === user.id)) {
            appointment.reference.push('PINNED');
        }

        if (slim) {
            delete appointment.files;
        }

        if (appointment.hidden &&
            permissions != null &&
            !AppointmentService.isCreatorOfAppointment(appointment, user) &&
            !AppointmentService.isAdministratorOfAppointment(appointment, user)) {
            let ids = [];
            let tokens = [];
            for (const queryKey of Object.keys(permissions)) {
                if (queryKey.startsWith('perm')) {
                    ids.push(permissions[queryKey]);
                }

                if (queryKey.startsWith('token')) {
                    tokens.push(permissions[queryKey]);
                }
            }

            let finalIds = [];
            ids.forEach((fId, i) => {
                const token = crypto.createHash('sha256')
                    .update(fId + process.env.SALT_ENROLLMENT)
                    .digest('hex');
                if (tokens[i] !== undefined && token === tokens[i].replace(' ', '+')) {
                    finalIds.push(fId);
                }
            });

            appointment.numberOfEnrollments = appointment.enrollments.length;
            appointment.enrollments = appointment.enrollments.filter(fEnrollment => {
                if (finalIds.includes(fEnrollment.id)
                    || (fEnrollment.creator != null &&
                        user != null &&
                        fEnrollment.creator.id === user.id)) {
                    return fEnrollment;
                }
            });
        }

        appointment.enrollments.map(mEnrollment => {
            mEnrollment.createdByUser = mEnrollment.creator != null;
            delete mEnrollment.creator;
            return mEnrollment;
        });

        return appointment;
    }

    arrayBufferToBase64(buffer) {
        console.log(String.fromCharCode.apply(null, new Uint16Array(buffer)));
        return String.fromCharCode.apply(null, new Uint16Array(buffer));
    }

    public async hasPermission(user: User, link: string,): Promise<boolean> {
        let appointment;

        try {
            appointment = await this.findByLink(link);
        } catch (e) {
            throw new InsufficientPermissionsException();
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
    public permissionHandling(permissions: any, enrollments: Enrollment[]) {
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

    private async handleAppointmentLink(_link: string) {
        let link = '';

        if (_link === null || _link === undefined || _link === '') {
            do {
                link = this.makeid(5);
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
            let potExistingAddition = await this.additionService.findByNameAndAppointment(fAddition.name, appointment);
            if (potExistingAddition !== undefined) {
                if (!output.some(sAddition => sAddition === potExistingAddition)) {
                    output.push(potExistingAddition);
                }
            } else {
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
    }
}
