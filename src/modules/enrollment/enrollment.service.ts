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
import {StringUtil} from '../../util/string.util';

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
     * The Enrollment can either be created by a logged in User, or by providing an email address.
     * When providing an email address, then a mail with the edit token gets send to it.
     *
     * @param enrollment_raw Enrollment data to save into database
     * @param user optional logged in user
     * @param domain Domain to build link for edit/delete with
     *
     * @return Enrollment entity that was created
     *
     * @throws See {@link findByLink} for reference
     * @throws DuplicateValueException if name is already in use
     * @throws See {@link parseEnrollmentObject} for reference
     */
    public async create(enrollment_raw: Enrollment, user: User, domain: string) {
        const appointment_referenced = await this.appointmentService
            .findByLink(enrollment_raw.appointment.link);

        if (await this._existsByName(enrollment_raw.name, appointment_referenced)) {
            throw new DuplicateValueException(null, null, ['name']);
        }

        const enrollment_output = await EnrollmentUtil.parseEnrollmentObject(enrollment_raw, appointment_referenced);

        enrollment_output.appointment = appointment_referenced;

        await this._handleEnrollmentAuthentication(enrollment_raw, enrollment_output, user);
        await this._storeDriverAndPassengerObjects(enrollment_output, appointment_referenced);

        let savedEnrollment = await this.enrollmentRepository.save(enrollment_output);

        if (enrollment_output.creator === undefined) {
            await this._sendEmailToEnrollmentCreator(savedEnrollment, domain, appointment_referenced);
        }

        this.appointmentGateway.appointmentUpdated(enrollment_raw.appointment);
        // noinspection UnnecessaryLocalVariableJS
        const output = enrollmentMapper.basic(savedEnrollment);

        return output;
    }

    /**
     * Change a existing Enrollment with the given values. <br/>
     * The allowedValuesToChange array shows all updatable options.
     *
     * @param enrollment_to_change_values Values to change
     * @param enrollment_id Id of Enrollment to change Values for
     * @param user Optional user
     */
    public async update(enrollment_to_change_values: any, enrollment_id: string, user: User) {
        const enrollment_referenced = await this.findById(enrollment_id);

        if (!EnrollmentUtil.hasPermission(enrollment_referenced, user, enrollment_to_change_values.token)) {
            throw new InsufficientPermissionsException();
        }

        const allowedValuesToChange = ['name', 'comment', 'driver', 'passenger', 'additions'];

        for (const [key, value] of Object.entries(enrollment_to_change_values)) {
            if (key in enrollment_referenced
                && enrollment_referenced[key] !== value
                && allowedValuesToChange.indexOf(key) > -1) {
                let changedValue: any;

                // check needed for correct catch of actual errors
                if (typeof this['_update' + StringUtil.capitalizeFirstLetter(key)] === 'function') {
                    try {
                        changedValue = await this['_update' + StringUtil.capitalizeFirstLetter(key)](enrollment_to_change_values, enrollment_referenced);
                    } catch (e) {
                        throw e;
                    }
                }

                if (changedValue === undefined) {
                    changedValue = value;
                }

                enrollment_referenced[key] = changedValue;
            }
        }

        let savedEnrollment = await this.enrollmentRepository.save(enrollment_referenced);

        savedEnrollment = enrollmentMapper.basic(savedEnrollment);

        this.appointmentGateway.appointmentUpdated(enrollment_referenced.appointment);

        return savedEnrollment;
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

    private async _setMailAttribute(enrollment_raw: Enrollment, enrollment_output: Enrollment) {
        const mail = new Mail();
        mail.mail = enrollment_raw.editMail;

        enrollment_output.mail = await this.mailRepository.save(mail);
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

    private async _storeDriverAndPassengerObjects(enrollment: any, appointment: Appointment) {
        /* Needed due to malicious comparison fo tinyint to boolean */
        if (!!appointment.driverAddition === true) {
            let string;
            if (enrollment.driver !== undefined) { // check for none of both not needed, because error would be thrown beforehand
                string = 'driver';
            } else {
                string = 'passenger';
            }

            await this[string + 'Service'].__save(enrollment[string]);
        }
    }

    private async _sendEmailToEnrollmentCreator(savedEnrollment: Enrollment, domain: string, appointment) {
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

    private async _handleEnrollmentAuthentication(enrollment_raw: Enrollment, enrollment_output: Enrollment, user: User) {
        if (enrollment_raw.editMail != null &&
            enrollment_raw.editMail != '') {
            await this._setMailAttribute(enrollment_raw, enrollment_output);
        } else if (user !== undefined) {
            enrollment_output.creator = user;
        } else {
            throw new MissingAuthenticationException(null,
                'Valid authentication by email or authentication header needed',
                null);
        }
    }

    private async _updateName(enrollment_to_change_values: any, enrollment_referenced: Enrollment) {
        if (enrollment_referenced.name !== enrollment_to_change_values.name) {
            if (await this._existsByName(enrollment_to_change_values.name, enrollment_referenced.appointment)) {
                throw new DuplicateValueException('DUPLICATE_ENTRY',
                    'Following values are already taken',
                    ['name']);
            }
        }

        return enrollment_to_change_values.name;
    }

    private async _updateDriver(enrollment_to_change_values: Enrollment, enrollment_referenced: Enrollment) {
        await this._updateDriverAndPassenger(enrollment_to_change_values, enrollment_referenced, 'driver');
    }

    private async _updatePassenger(enrollment_to_change_values: Enrollment, enrollment_referenced: Enrollment) {
        await this._updateDriverAndPassenger(enrollment_to_change_values, enrollment_referenced, 'passenger');
    }

    private async _updateDriverAndPassenger(enrollment_to_change_values: Enrollment, enrollment_referenced: Enrollment, key: string) {
        let changedValue: any;
        const counterKeys = {
            passenger: 'driver',
            driver: 'passenger',
        };

        if (enrollment_referenced.appointment.driverAddition) {
            let current_value = undefined;

            await this[key + 'Service']
                .findByEnrollment(enrollment_referenced)
                .then((res) => {
                    current_value = res;
                })
                .catch(() => {
                });

            changedValue = await EnrollmentUtil['handle' + StringUtil.capitalizeFirstLetter(key) + 'Relation'](enrollment_to_change_values[key], current_value);

            if (changedValue !== undefined) {
                this[key + 'Service'].__save(changedValue);
                enrollment_referenced[key] = changedValue;
            } else {
                changedValue = enrollment_to_change_values[key];
            }

            enrollment_referenced[counterKeys[key]] = null;
        }

        return changedValue;
    }

    private async _updateAdditions(enrollment_to_change_values: any, enrollment_referenced: Enrollment) {
        EnrollmentUtil.filterValidAdditions(enrollment_to_change_values, enrollment_referenced.appointment);
    }
}

