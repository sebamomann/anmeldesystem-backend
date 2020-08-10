import {Injectable} from '@nestjs/common';
import {Enrollment} from './enrollment.entity';
import {Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Appointment} from '../appointment/appointment.entity';
import {AppointmentService} from '../appointment/appointment.service';
import {AdditionService} from '../addition/addition.service';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {User} from '../user/user.entity';
import {PassengerService} from './passenger/passenger.service';
import {DriverService} from './driver/driver.service';
import {Mail} from './mail/mail.entity';
import {MailerService} from '@nest-modules/mailer';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {EntityGoneException} from '../../exceptions/EntityGoneException';
import {AppointmentGateway} from '../appointment/appointment.gateway';
import {DomainUtil} from '../../util/domain.util';
import {EnrollmentUtil} from './enrollment.util';
import {MissingAuthenticationException} from '../../exceptions/MissingAuthenticationException';

const crypto = require('crypto');
const logger = require('../../logger');
const enrollmentMapper = require('./enrollment.mapper');

@Injectable()
export class EnrollmentService {
    constructor(@InjectRepository(Enrollment)
                private readonly enrollmentRepository: Repository<Enrollment>,
                @InjectRepository(Mail)
                private readonly mailRepository: Repository<Mail>,
                private readonly appointmentService: AppointmentService,
                private readonly additionService: AdditionService,
                private readonly passengerService: PassengerService,
                private readonly driverService: DriverService,
                private readonly mailerService: MailerService,
                private readonly appointmentGateway: AppointmentGateway) {
    }

    public async findById(id: string) {
        let enrollment = await this.enrollmentRepository.findOne({
            where: {
                id: id
            },
            relations: ['appointment', 'creator'],
        });

        if (enrollment === undefined) {
            throw new EntityNotFoundException(null, null, 'enrollment');
        }

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
     * @throws See {@link parseEnrollmentObject} for reference
     */
    public async create(_enrollment: Enrollment, user: User, domain: string) {
        let appointment;

        try {
            appointment = await this.appointmentService.findByLink(_enrollment.appointment.link);
        } catch (e) {
            throw e;
        }

        if (await this._existsByName(_enrollment.name, appointment)) {
            throw new DuplicateValueException(null, null, ['name']);
        }

        let enrollment;

        try {
            enrollment = await EnrollmentUtil.parseEnrollmentObject(_enrollment, appointment);
        } catch (e) {
            throw e;
        }

        this._storeDriverAdditions(enrollment, appointment);

        let enrolledByUser = false;

        if (_enrollment.editMail != null &&
            _enrollment.editMail != '') {
            const mail = new Mail();
            mail.mail = _enrollment.editMail;
            enrollment.mail = await this.mailRepository.save(mail);
        } else if (user !== undefined) {
            enrolledByUser = true;
            enrollment.creator = user;
        } else {
            throw new MissingAuthenticationException(null, 'Valid authentication by email or authentication header needed', null);
        }

        enrollment.appointment = appointment;

        let savedEnrollment = await this.enrollmentRepository.save(enrollment);

        if (!enrolledByUser) {
            savedEnrollment.token = crypto.createHash('sha256')
                .update(savedEnrollment.id + process.env.SALT_ENROLLMENT)
                .digest('hex');

            let url = `https://${DomainUtil.replaceDomain(domain, savedEnrollment.id, savedEnrollment.token)}`;

            await this.mailerService
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
                    /* istanbul ignore next */
                    logger.log('error', 'Could not send enrollment mail to %s', savedEnrollment.mail.mail);
                });
        }

        savedEnrollment = enrollmentMapper.basic(savedEnrollment);

        this.appointmentGateway.appointmentUpdated(_enrollment.appointment);

        return savedEnrollment;
    }

    /**
     * Change a existing Enrollment with the given values. <br/>
     * The allowedValuesToChange array shows all updatable options.
     *
     * @param toChange Values to change
     * @param id Id of Enrollment to change Values for
     * @param user Optional user
     */
    public async update(toChange: any, id: string, user: User) {
        let enrollment;

        try {
            enrollment = await this.findById(id);
        } catch (e) {
            throw e;
        }

        const appointment = enrollment.appointment;

        if (!EnrollmentUtil.hasPermission(enrollment, user, toChange.token)) {
            throw new InsufficientPermissionsException();
        }

        const allowedValuesToChange = ['name', 'comment', 'driver', 'passenger', 'additions'];

        for (const [key, value] of Object.entries(toChange)) {
            if (key in enrollment
                && enrollment[key] !== value
                && allowedValuesToChange.indexOf(key) > -1) {
                let changedValue: any = value;

                if (key === 'name'
                    && enrollment.name !== toChange.name) {
                    if (await this._existsByName(toChange.name, appointment)) {
                        throw new DuplicateValueException('DUPLICATE_ENTRY',
                            'Following values are already taken',
                            ['name']);
                    }
                }

                if (key === 'driver'
                    && appointment.driverAddition) {
                    let current_driver = undefined;

                    await this.driverService
                        .findByEnrollment(enrollment)
                        .then((res) => {
                            current_driver = res;
                        })
                        .catch(() => {
                        });
                    changedValue = await EnrollmentUtil.handleDriverRelation(toChange.driver, current_driver);

                    if (changedValue !== undefined) {
                        this.driverService.__save(changedValue);
                        enrollment.driver = changedValue;
                    } else {
                        changedValue = toChange.driver;
                    }

                    enrollment.passenger = null;
                }

                if (key === 'passenger'
                    && appointment.driverAddition) {
                    let current_passenger = undefined;

                    await this.passengerService
                        .findByEnrollment(enrollment)
                        .then((res) => {
                            current_passenger = res;
                        })
                        .catch(() => {
                        });
                    changedValue = await EnrollmentUtil.handlePassengerRelation(toChange.passenger, current_passenger);

                    if (changedValue !== undefined) {
                        this.passengerService.__save(changedValue);
                        enrollment.passenger = changedValue;
                    } else {
                        changedValue = toChange.passenger;
                    }

                    enrollment.driver = null;
                }

                if (key === 'additions') {
                    try {
                        changedValue = EnrollmentUtil.filterValidAdditions(toChange, appointment);
                    } catch (e) {
                        throw e;
                    }
                }

                enrollment[key] = changedValue;
            }
        }

        let savedEnrollment = await this.enrollmentRepository.save(enrollment);

        savedEnrollment = enrollmentMapper.basic(savedEnrollment);

        this.appointmentGateway.appointmentUpdated(appointment);

        return savedEnrollment;
    }

    private async _existsByName(name: string, appointment: Appointment) {
        return this._findByEnrollmentNameAndAppointment(name, appointment)
            .then(() => {
                return true;
            })
            .catch(() => {
                return false;
            });
    }

    private async _findByEnrollmentNameAndAppointment(name: string, appointment: Appointment) {
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

    /**
     * Delete enrollment by its id
     *
     * @param id Id of Enrollment to delete
     * @param token Optional token to prove edit/delete permissions
     * @param user Optional when user is in a administrative position of the appointment or enrollment
     *
     * @throws EntityGoneException if enrollment doesn't exist anymore
     * @throws InsufficientPermissionsException if user is not allowed to edit/delete
     */
    async delete(id: string, token: string, user: User) {
        let enrollment;

        try {
            enrollment = await this.findById(id);
        } catch (e) {
            throw new EntityGoneException(null, null, 'enrollment');
        }

        if (!(await EnrollmentUtil.hasPermission(enrollment, user, token))) {
            throw new InsufficientPermissionsException();
        }

        await this.enrollmentRepository.remove(enrollment);

        this.appointmentGateway.appointmentUpdated(enrollment.appointment);
    }

    /**
     * Check if user is allowed to edit/delete an Enrollment
     *
     * @param id Id of enrollment to delete
     * @param user Optional user sending the request
     * @param token Optional token to prove ownership of enrollment
     *
     * @returns allowances Object with either "user" or "token" (or both), depending on successful authorization
     *
     * @throws InsufficientPermissionsException if user is not authorized
     */
    public async checkPermissions(id: string, user: User, token: string) {
        let enrollment;

        try {
            enrollment = await this.findById(id);
        } catch (e) {
            throw e;
        }

        let allowances = [];

        if (await EnrollmentUtil.permissionByUser(enrollment, user)) {
            allowances.push('user');
        }

        if (EnrollmentUtil.permissionByToken(enrollment, token)) {
            allowances.push('token');
        }

        if (allowances.length === 0) {
            throw new InsufficientPermissionsException();
        }

        return allowances;
    }

    private _storeDriverAdditions(enrollment: any, appointment: Appointment) {
        /* Needed due to malicious comparison fo tinyint to boolean */
        if (!!appointment.driverAddition === true) {
            let string = '';
            if (enrollment.driver !== undefined) { // check for none of both not needed, because error would be thrown beforehand
                string = 'driver';
            } else {
                string = 'passenger';
            }

            this[string + 'Service'].__save(enrollment[string]);
        }
    }
}
