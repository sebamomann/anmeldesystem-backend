import {Injectable} from '@nestjs/common';
import {Enrollment} from './enrollment.entity';
import {getConnection, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Appointment} from '../appointment/appointment.entity';
import {AppointmentService} from '../appointment/appointment.service';
import {AdditionService} from '../addition/addition.service';
import {Driver} from './driver/driver.entity';
import {Passenger} from './passenger/passenger.entity';
import {EmptyFieldsException} from '../../exceptions/EmptyFieldsException';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {User} from '../user/user.entity';
import {Key} from './key/key.entity';
import {PassengerService} from './passenger/passenger.service';
import {DriverService} from './driver/driver.service';
import {Mail} from './mail/mail.entity';
import {MailerService} from '@nest-modules/mailer';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';

const crypto = require('crypto');
const enrollmentMapper = require('./enrollment.mapper');

@Injectable()
export class EnrollmentService {
    constructor(@InjectRepository(Enrollment)
                private readonly enrollmentRepository: Repository<Enrollment>,
                @InjectRepository(Driver)
                private readonly driverRepository: Repository<Driver>,
                @InjectRepository(Passenger)
                private readonly passengerRepository: Repository<Passenger>,
                @InjectRepository(Key)
                private readonly keyRepository: Repository<Key>,
                @InjectRepository(Mail)
                private readonly mailRepository: Repository<Mail>,
                private readonly appointmentService: AppointmentService,
                private readonly additionService: AdditionService,
                private readonly passengerService: PassengerService,
                private readonly driverService: DriverService,
                private readonly mailerService: MailerService,) {

    }

    public static allowEditByToken(enrollment: Enrollment, token: string) {
        const check = crypto.createHash('sha256')
            .update(enrollment.id + process.env.SALT_ENROLLMENT)
            .digest('hex');

        return enrollment.token !== null
            && enrollment.token !== undefined
            && (token.replace(' ', '+') === check);
    }

    private static checkForEmptyValues(enrollment: Enrollment, user: User, isEdit = false) {
        let emptyValues = [];
        let mailAddition = '';

        if (enrollment.name === ''
            || enrollment.name === null) {
            emptyValues.push('name');
        }
        if (!!user === false
            && ((enrollment.editMail == ''
                || enrollment.editMail == null)
                && !isEdit)) {
            emptyValues.push('mail');
            mailAddition = '. Since you are not logged in, you need to provide an email address to to enroll.';
        }
        if (emptyValues.length > 0) {
            throw  new EmptyFieldsException(null,
                'Please specify following values' + mailAddition, emptyValues);
        }
    }

    private static _handleAdditions(_enrollment: Enrollment, _appointment: Appointment) {
        let output = [];

        if (Array.isArray(_enrollment.additions)) {
            for (const fAddition of _enrollment.additions) {
                const additions = _appointment.additions.filter(filterAddition => filterAddition.id === fAddition.id);

                if (additions.length > 0) {
                    output.push(additions[0]);
                } else {
                    throw new EntityNotFoundException(null,
                        'The following addition can not be found in the appointment',
                        JSON.stringify(fAddition));
                }
            }
        }

        return output;
    }

    private static allowedToEdit(enrollment: Enrollment, user: User, token: string) {
        let allowEditByUserId = EnrollmentService.allowEditByUserId(enrollment, user);
        let isAllowedByKey = EnrollmentService.allowEditByToken(enrollment, token);

        return (allowEditByUserId
            || isAllowedByKey);
    }

    private static allowEditByUserId(enrollment: Enrollment, user: User) {
        let isAppointmentCreator = (enrollment.appointment.creator !== null
            && user.id === enrollment.appointment.creator.id);
        let isAppointmentAdministrator = (enrollment.appointment.administrators !== null
            && enrollment.appointment.administrators.some(iAdministrators => {
                return iAdministrators.mail === user.mail;
            }));
        let isEnrollmentCreator = (enrollment.creator !== null
            && enrollment.creator.id === user.id);

        return isAppointmentCreator || isAppointmentAdministrator || isEnrollmentCreator;
    }

    public async get(id: string) {
        let enrollment;

        try {
            enrollment = await this.findById(id);
        } catch (e) {
            throw e;
        }

        enrollment = enrollmentMapper.basic(this, enrollment);

        return enrollment;
    }

    /**
     * Create a new enrollment. <br />
     * The enrollment can either be created by a logged in user, or by providing an email adress.
     * When providing an email address, then a mail with the edit token gets send to it.
     *
     * @param _enrollment Enrollment data to save into database
     * @param user optional logged in user
     * @param domain Domain to build link for edit/delete with
     *
     * @return Enrollment entity that was created
     *
     * @throws See {@link findByLink} for reference
     * @throws DuplicateValueException if name is already in use
     * @throws See {@link _parseEnrollmentObject} for reference
     */
    public async create(_enrollment: Enrollment, user: User, domain: string) {
        let appointment;

        try {
            appointment = await this.appointmentService.findByLink(_enrollment.appointment.link);
        } catch (e) {
            throw e;
        }

        if (await this.existsByName(_enrollment.name, appointment)) {
            throw new DuplicateValueException(null, null, ['name']);
        }

        let enrollment = await this._parseEnrollmentObject(_enrollment, appointment)
            .catch((err => {
                throw err;
            }));

        if (_enrollment.editMail != null &&
            _enrollment.editMail != '') {
            const mail = new Mail();
            mail.mail = _enrollment.editMail;
            enrollment.mail = await this.mailRepository.save(mail);
        } else {
            enrollment.creator = user;
        }

        enrollment.appointment = appointment;

        let savedEnrollment = await this.enrollmentRepository.save(enrollment);

        if (savedEnrollment.creator === null ||
            savedEnrollment.creator === undefined) {
            savedEnrollment.token = crypto.createHash('sha256')
                .update(savedEnrollment.id + process.env.SALT_ENROLLMENT)
                .digest('hex');

            let url = `https://${domain}`;
            url += `/${savedEnrollment.id}/${savedEnrollment.token}`;

            this.mailerService
                .sendMail({
                    to: savedEnrollment.mail.mail,
                    from: process.env.MAIL_ECA,
                    subject: 'Deine Anmeldung zu ' + appointment.title,
                    template: 'enroll', // The `.pug` or `.hbs` extension is appended automatically.
                    context: {  // Data to be sent to template engine.
                        title: appointment.title,
                        name: savedEnrollment.name,
                        url: url
                    },
                })
                .then(() => {
                })
                .catch(() => {
                    logger.log('error', 'Could not send enrollment mail to %s', user.mail);
                });
        }

        savedEnrollment = enrollmentMapper.basic(this, savedEnrollment);

        return savedEnrollment;
    }

    /**
     * Change a existing Enrollment with the given values. <br/>
     * The allowedValuesToChange array shows all updatable options.
     *
     * @param toChange Values to change
     * @param id Id of Enrollment to change Values for
     * @param user Optional user
     * @param token Optional token to verify permission do change Enrollment
     */
    public async update(toChange: any, id: string, user: User, token: string) {
        let enrollment;

        try {
            enrollment = await this.findById(id);
        } catch (e) {
            throw e;
        }

        const appointment = enrollment.appointment;

        if (!EnrollmentService.allowedToEdit(enrollment, user, token)) {
            throw new InsufficientPermissionsException();
        }

        const allowedValuesToChange = ['name', 'comment', 'driver', 'passenger', 'additions'];

        for (const [key, value] of Object.entries(toChange)) {
            if (key in enrollment
                && enrollment[key] !== value
                && allowedValuesToChange.indexOf(key) > -1) {
                let changedValue = value;

                if (key === 'name'
                    && enrollment.name !== toChange.name) {
                    if (await this.existsByName(toChange.name, appointment)) {
                        throw new DuplicateValueException('DUPLICATE_ENTRY',
                            'Following values are already taken',
                            ['name']);
                    }
                }

                if (key === 'driver'
                    && appointment.driverAddition) {
                    changedValue = await this._handleDriverRelation(toChange);
                    enrollment.passenger = null;
                }

                if (key === 'passenger'
                    && appointment.driverAddition) {
                    changedValue = await this._handlePassengerRelation(toChange);
                    enrollment.driver = null;
                }

                if (key === 'additions') {
                    try {
                        changedValue = EnrollmentService._handleAdditions(toChange, appointment);
                    } catch (e) {
                        throw e;
                    }
                }

                enrollment[key] = changedValue;
            }
        }

        let savedEnrollment = await this.enrollmentRepository.save(enrollment);

        savedEnrollment = enrollmentMapper.basic(this, savedEnrollment);

        return savedEnrollment;
    }

    async delete(id: string, token: string, user: User) {
        const enrollment: Enrollment = await this.get(id);

        if (!EnrollmentService.allowedToEdit(enrollment, user, token)) {
            throw new Error();
        }

        await getConnection()
            .createQueryBuilder()
            .delete()
            .from(Enrollment)
            .where('id = :id', {id: id['id']})
            .execute();
    }

    /**
     * tell if by token or user or both
     * @param id
     * @param user
     * @param token
     */
    public async checkPermissions(id: string, user: User, token: string) {
    }

    private async findById(id: string) {
        let enrollment = await this.enrollmentRepository.findOne({
            where: {
                id: id
            }
        });

        if (enrollment === undefined) {
            throw new EntityNotFoundException(null, null, 'enrollment');
        }

        return enrollment;
    }

    private async findByName(name: string) {
        let enrollment = await this.enrollmentRepository.findOne({
            where: {
                name: name
            }
        });

        if (enrollment === undefined) {
            throw new EntityNotFoundException(null, null, 'enrollment');
        }

        return enrollment;
    }

    private async findByNameAndAppointment(name: string, appointment: Appointment) {
        let enrollment = await this.enrollmentRepository.findOne({
            where: {
                name: name,
                appointment: {
                    id: appointment.id
                }
            }
        });

        if (enrollment === undefined) {
            throw new EntityNotFoundException(null, null, 'enrollment');
        }

        return enrollment;
    }

    private async _parseEnrollmentObject(_enrollment: Enrollment, _appointment: Appointment) {
        let output = new Enrollment();

        output.name = _enrollment.name;
        output.comment = _enrollment.comment === '' ? null : _enrollment.comment;

        try {
            output.additions = EnrollmentService._handleAdditions(_enrollment, _appointment);
        } catch (e) {
            throw e;
        }

        /* Needed due to malicious comparison fo tinyint to boolean */
        if (!!_appointment.driverAddition === true) {
            if (_enrollment.driver !== null && _enrollment.driver !== undefined) {
                output.driver = await this._handleDriverRelation(_enrollment)
                    .catch((err => {
                        throw err;
                    }));
                output.passenger = null;
            } else if (_enrollment.passenger !== null && _enrollment.passenger !== undefined) {
                output.passenger = await this._handlePassengerRelation(_enrollment)
                    .catch((err => {
                        throw err;
                    }));
                output.driver = null;
            } else {
                throw new EmptyFieldsException('EMPTY_FIELDS',
                    'Please specify one of the following values',
                    ['driver', 'passenger']);
            }
        }

        return output;
    }

    private async existsByName(name: string, appointment: Appointment) {
        return this.findByNameAndAppointment(name, appointment)
            .then(() => {
                return true;
            })
            .catch(() => {
                return false;
            });
    }

    private async _handlePassengerRelation(_enrollment: Enrollment) {
        let output = new Passenger();

        this.passengerService.findByEnrollment(_enrollment)
            .then((res) => {
                output = res;
            })
            .catch(() => {
            });

        // if (_enrollment.passenger.requirement === undefined) {
        //     throw new EmptyFieldsException('EMPTY_FIELDS', 'Please specify following values', ['passenger_requirement']);
        // }

        output.requirement = _enrollment.passenger.requirement;

        return await this.passengerRepository.save(output);
    }

    private async _handleDriverRelation(_enrollment: Enrollment) {
        let output = new Driver();

        this.driverService.findByEnrollment(_enrollment)
            .then((res) => {
                output = res;
            })
            .catch(() => {
            });

        // let emptyFields = [];
        // if (_enrollment.driver.seats === undefined) {
        //     emptyFields.push('driver_seats');
        // }
        // if (_enrollment.driver.service === undefined) {
        //     emptyFields.push('driver_service');
        // }
        //
        // if (emptyFields.length > 0) {
        //     throw new EmptyFieldsException('EMPTY_FIELDS', 'Please specify following values', emptyFields);
        // }
        //
        // if (_enrollment.driver.seats <= 0) {
        //     throw new InvalidValuesException('INVALID_VALUE', 'Minimum of 1 needed', ['driver_seats']);
        // }

        output.seats = _enrollment.driver.seats;
        output.service = _enrollment.driver.service;

        return await this.driverRepository.save(output);
    }
}
