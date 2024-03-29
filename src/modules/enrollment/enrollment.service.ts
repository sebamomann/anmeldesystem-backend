import { JWT_User } from './../user/user.model';
import { Injectable } from '@nestjs/common';
import { Enrollment } from './enrollment.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentService } from '../appointment/appointment.service';
import { AdditionService } from '../addition/addition.service';
import { DuplicateValueException } from '../../exceptions/DuplicateValueException';
import { PassengerService } from './passenger/passenger.service';
import { DriverService } from './driver/driver.service';
import { Mail } from './mail/mail.entity';
import { MailerService } from '@nest-modules/mailer';
import { EntityNotFoundException } from '../../exceptions/EntityNotFoundException';
import { InsufficientPermissionsException } from '../../exceptions/InsufficientPermissionsException';
import { EntityGoneException } from '../../exceptions/EntityGoneException';
import { AppointmentGateway } from '../appointment/appointment.gateway';
import { DomainUtil } from '../../util/domain.util';
import { EnrollmentUtil } from './enrollment.util';
import { MissingAuthenticationException } from '../../exceptions/MissingAuthenticationException';
import { StringUtil } from '../../util/string.util';
import { InvalidAttributesException } from '../../exceptions/InvalidAttributesException';
import { EnrollmentMapper } from './enrollment.mapper';
import { UserService } from '../user/user.service';
import { AlreadyUsedException } from '../../exceptions/AlreadyUsedException';
import { EnrollmentPermissionChecker } from './enrollmentPermission.checker';

const crypto = require('crypto');
const logger = require('../../logger');

@Injectable()
export class EnrollmentService {
    constructor(@InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
        @InjectRepository(Mail)
        private readonly mailRepository: Repository<Mail>,
        private readonly appointmentService: AppointmentService,
        private readonly userService: UserService,
        private readonly additionService: AdditionService,
        private readonly passengerService: PassengerService,
        private readonly driverService: DriverService,
        private readonly mailerService: MailerService,
        private readonly appointmentGateway: AppointmentGateway) {
    }

    public async get(id: string, user: JWT_User, token: string) {
        let enrollment = await this.enrollmentRepository.createQueryBuilder('enrollment')
            .leftJoinAndSelect('enrollment.appointment', 'appointment')
            .leftJoinAndSelect('enrollment.additions', 'additions')
            .leftJoinAndSelect('enrollment.driver', 'driver')
            .leftJoinAndSelect('enrollment.passenger', 'passenger')
            .where('enrollment.id = :enrollmentId', { enrollmentId: id })
            .select(['enrollment', 'appointment._link', 'additions.name', 'additions.order', 'driver', 'passenger', 'appointment.hidden'])
            .getOne();

        if (enrollment === undefined) {
            throw new EntityNotFoundException(null, null, 'enrollment');
        }

        if (enrollment.appointment.hidden) {
            await this.checkPermissions(id, user, token); // TODO INEFFECTIVE; DUE TO DUPLICATE DB FETCH
        }

        const enrollmentMapper = new EnrollmentMapper(this.userService);

        return enrollmentMapper.basic(enrollment);
    }

    public async findById(id: string) {
        let enrollment = await this.enrollmentRepository.findOne({
            where: {
                id: id
            },
            relations: ['appointment'],
        });

        if (enrollment === undefined) {
            throw new EntityNotFoundException(null, null, 'enrollment');
        }

        return enrollment;
    }

    /**
     * Create a new enrollment. <br />
     * The {@link Enrollment} can either be created by a logged in {@link JWT_User}, or by providing an email address.
     * When providing an email address, an email with the edit token gets send to it.
     *
     * @param enrollment_raw Enrollment data to save into database
     * @param user optional logged in user
     * @param domain Domain to build _link for edit/delete with
     *
     * @return Enrollment entity that was created
     *
     * @throws See {@link findByLink} for relations
     * @throws DuplicateValueException if name is already in use
     * @throws See {@link parseEnrollmentObject} for relations
     * 
     * @todo
     * Store information in db if logged in user creates a non self enrollment instead of sending the token back
     * Requires extra db call when validation permission to modify enrollment afterwards
     */
    public async create(enrollment_raw: Enrollment, user: JWT_User, domain: string) {
        let appointment_referenced: Appointment;

        try {
            appointment_referenced = await this.appointmentService
                .findByLink(enrollment_raw.appointment.link);
        } catch (e) {
            throw new EntityNotFoundException(null, null, {
                'object': "appointment",
                'attribute': 'link',
                'in': 'body',
                'value': enrollment_raw.appointment.link
            });
        }
        const enrollment_output = await EnrollmentUtil.parseEnrollmentObject(enrollment_raw, appointment_referenced);

        // TODO
        // VALIDATE IF IS VALID MAIL
        if (enrollment_raw.editMail) {
            if (await this._existsByName(enrollment_raw.name, appointment_referenced)) {
                throw new AlreadyUsedException('DUPLICATE_VALUES',
                    'Provided values are already in use', [{
                        'attribute': 'name',
                        'in': 'body',
                        'value': enrollment_raw.name,
                        'message': 'Enrollment with specified name already existing.'
                    }]);
            }

            await this._setMailAttribute(enrollment_raw, enrollment_output);
        } else if (user) { // IF USER AUTH
            if (await this._existsByCreator(user, appointment_referenced)) {
                throw new AlreadyUsedException('DUPLICATE_VALUES',
                    'Provided values are already in use', [{
                        'object': 'user',
                        'attribute': 'sub',
                        'in': 'authorization-header',
                        'value': user.sub,
                        'message': 'Authenticated user already enrolled'
                    }]);
            }

            enrollment_output.creatorId = user.sub;

            enrollment_output.name = null;
        } else {
            throw new MissingAuthenticationException(null,
                'Missing or invalid Authorization. Email or Authorization header needed',
                [{
                    'attribute': 'editMail',
                    'value': undefined,
                    'in': 'body',
                    'message': 'Provide email address for enrollment linking'
                }, {
                    'object': 'user',
                    'attribute': 'sub',
                    'in': 'authorization-header',
                    'value': undefined,
                    'message': 'Enroll as authenticated user'
                }]);
        }

        enrollment_output.appointment = appointment_referenced;

        await this._storeDriverAndPassengerObjects(enrollment_output, appointment_referenced);

        let savedEnrollment = await this.enrollmentRepository.save(enrollment_output);

        if (!enrollment_output.creatorId) {
            await this._sendEmailToEnrollmentCreator(savedEnrollment, domain, appointment_referenced);
        }

        this.appointmentGateway.appointmentUpdated(enrollment_raw.appointment);

        const enrollmentMapper = new EnrollmentMapper(this.userService);
        return enrollmentMapper.create(savedEnrollment);
    }

    /**
     * Change an existing Enrollment with the given values. <br/>
     * The allowedValuesToChange array shows all updatable options.
     *
     * @param enrollment_to_change_values Values to change
     * @param enrollment_id Id of Enrollment to change Values for
     * @param user Optional user
     * @param token
     */
    public async update(enrollment_to_change_values: any, enrollment_id: string, user: JWT_User, token: string) {
        const enrollment_referenced = await this.findById(enrollment_id);
        const enrollment_updated = { ...enrollment_referenced };

        const enrollmentPermissionChecker = new EnrollmentPermissionChecker(enrollment_referenced)

        if (!enrollment_referenced.hasPermissionToManipulate(user, token)) {
            throw new InsufficientPermissionsException(null, null, {
                'attribute': 'id',
                'in': 'path',
                'value': enrollment_id,
                'message': 'Specified enrollment is not in your ownership. You are also not permitted by being a manager of the related appointment.'
            }
            );
        }

        const allowedValuesToChange = ['name', 'comment', 'driver', 'passenger', 'additions'];

        for (const [key, value] of Object.entries(enrollment_to_change_values)) { // TODO INVALID ATTRIBUTE
            if (key in enrollment_referenced
                && enrollment_referenced[key] !== value
                && allowedValuesToChange.indexOf(key) > -1) {
                let changedValue: any;

                const fnName = '_update' + StringUtil.capitalizeFirstLetter(key); // e.g. _updateName || _updateAdditions ...
                if (typeof this[fnName] === 'function') { // check needed for correct catch of actual errors
                    try {
                        changedValue = await this[fnName](enrollment_to_change_values, enrollment_updated);
                    } catch (e) {
                        throw e;
                    }
                }

                if (changedValue === undefined) {
                    changedValue = value;
                }

                if (key === 'comment') {
                    const trimmedComment = changedValue.trim();
                    enrollment_updated[key] = trimmedComment === '' ? null : trimmedComment;
                } else {
                    enrollment_updated[key] = changedValue;
                }
            }
        }

        // TODO only update if anything actually changed

        let savedEnrollment = await this.enrollmentRepository.save(enrollment_updated);

        const enrollmentMapper = new EnrollmentMapper(this.userService);
        const ret = await enrollmentMapper.basic(savedEnrollment);

        this.appointmentGateway.appointmentUpdated(enrollment_updated.appointment);

        return ret;
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
    async delete(id: string, token: string, user: JWT_User) {
        let enrollment;

        try {
            enrollment = await this.findById(id);
        } catch (e) {
            throw new EntityGoneException(null, null, 'enrollment');
        }

        if (!(await enrollment.hasPermissionToManipulate(user, token))) {
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
    public async checkPermissions(id: string, user: JWT_User, token: string) {
        let enrollment;

        enrollment = await this.findById(id);

        let allowances = [];

        if (await enrollment.hasPermissionToManipulateByIdentity(user)) {
            allowances.push('user');
        }

        if (enrollment.hasPermissionToManipulateByToken(token)) {
            allowances.push('token');
        }

        if (allowances.length === 0) {
            throw new InsufficientPermissionsException(null, null, {
                'attribute': 'id',
                'in': 'path',
                'value': enrollment.id,
                'message': 'Specified enrollment is not in your ownership. You are also not permitted by being a manager of the related appointment.'
            }
            );
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

    private async _findByCreatorAndAppointment(creator: JWT_User, appointment: Appointment) {
        let enrollment = await this.enrollmentRepository.findOne({
            where: {
                creatorId: creator.sub,
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
            .update(savedEnrollment.id + process.env.SALT_ENROLLMENT + '')
            .digest('hex');

        let url = `https://${DomainUtil.replaceDomain(domain, savedEnrollment.id, savedEnrollment.token)}`;

        await this.mailerService
            .sendMail({
                to: savedEnrollment.mail.mail,
                from: {
                    name: "GJM-Bot",
                    address: process.env.MAIL_GJM
                },
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
            .catch((e) => {
                console.log(e);
                logger.log('error', 'Could not send enrollment mail to %s', savedEnrollment.mail.mail);
            });
    }

    /**
     * CAN BE COMBINED WITH OTHER PART
     * @param enrollment_raw
     * @param enrollment_output
     * @param user
     */
    private async _handleEnrollmentAuthentication(enrollment_raw: Enrollment, enrollment_output: Enrollment, user: JWT_User) {
        if (enrollment_raw.editMail) {
            await this._setMailAttribute(enrollment_raw, enrollment_output);
        } else if (user !== undefined) {
            enrollment_output.creatorId = user.sub;
        } else {
            throw new MissingAuthenticationException(null,
                'Valid authentication by email or authentication header needed',
                null);
        }
    }

    // noinspection JSUnusedLocalSymbols
    // function called dynamically
    /**
     * Update the name of a given appointment.
     * The name can only be updated, if the enrollment didnt got created by a user.<br/>
     * Validate, that the given name is not already in use.
     *
     * @param enrollment_to_change_values       Values of the enrollment to update
     * @param enrollment_referenced             Current enrollment object
     */
    private async _updateName(enrollment_to_change_values: any, enrollment_referenced: Enrollment) {
        if (!enrollment_referenced.creatorId) {
            if (await this._existsByName(enrollment_to_change_values.name, enrollment_referenced.appointment)) {
                throw new DuplicateValueException('DUPLICATE_ENTRY',
                    'Following values are duplicates and can not be used',
                    [{
                        'attribute': 'name',
                        'in': 'body',
                        'value': enrollment_to_change_values.name,
                        'message': 'The specified name is already used by another enrollment. A person can only be enrolled once.'
                    }]);
            }

            return enrollment_to_change_values.name;
        } else {
            throw new InvalidAttributesException('INVALID_ATTRIBUTE',
                'Following attributes are not allowed to be updated',
                [{
                    'attribute': 'name',
                    'in': 'body',
                    'value': enrollment_to_change_values.name,
                    'message': 'The specified enrollment got created by an authenticated user. Thus the name can not be modified.'
                }]);
        }
    }

    // TODO dynamic call cann be directly lead to _driverAndPassenger function
    /// noinspection JSUnusedLocalSymbols
    // function called dynamically
    private async _updateDriver(enrollment_to_change_values: Enrollment, enrollment_referenced: Enrollment) {
        return await this._updateDriverAndPassenger(enrollment_to_change_values, enrollment_referenced, 'driver');
    }

    // noinspection JSUnusedLocalSymbols
    // function called dynamically
    private async _updatePassenger(enrollment_to_change_values: Enrollment, enrollment_referenced: Enrollment) {
        return await this._updateDriverAndPassenger(enrollment_to_change_values, enrollment_referenced, 'passenger');
    }

    private async _updateDriverAndPassenger(enrollment_to_change_values: Enrollment, enrollment_referenced: Enrollment, key: string) {
        // TODO CHECK DRIVER CHANGE BOTH VALUES GET RETURNED

        let changedValue: any;
        const counterKeys = {
            passenger: 'driver',
            driver: 'passenger',
        };

        if (!enrollment_to_change_values[key]) {
            return;
        }

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

    // noinspection JSUnusedLocalSymbols,JSMethodCanBeStatic
    // function called dynamically
    private async _updateAdditions(enrollment_to_change_values: any, enrollment_referenced: Enrollment) {
        EnrollmentUtil.filterValidAdditions(enrollment_to_change_values, enrollment_referenced.appointment);
    }

    private _existsByCreator(user: JWT_User, appointment: Appointment) {
        return this._findByCreatorAndAppointment(user, appointment)
            .then(() => {
                return true;
            })
            .catch(() => {
                return false;
            });
    }
}

