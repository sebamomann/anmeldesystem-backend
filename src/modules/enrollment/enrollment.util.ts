import {Enrollment} from './enrollment.entity';
import {Appointment} from '../appointment/appointment.entity';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {User} from '../user/user.entity';
import {AppointmentUtil} from '../appointment/appointment.util';
import {Driver} from './driver/driver.entity';
import {Passenger} from './passenger/passenger.entity';
import {EmptyFieldsException} from '../../exceptions/EmptyFieldsException';

const crypto = require('crypto');

export class EnrollmentUtil {
    public static hasPermission(enrollment: Enrollment, user: User, token: string) {
        let allowEditByUserId = EnrollmentUtil.permissionByUser(enrollment, user);
        let isAllowedByKey = EnrollmentUtil.permissionByToken(enrollment, token);

        return allowEditByUserId || isAllowedByKey;
    }

    public static permissionByUser(enrollment: Enrollment, user: User) {
        let isAllowedByAppointmentPermission = AppointmentUtil.isCreatorOrAdministrator(enrollment.appointment, user);
        let isCreatorOfEnrollment = EnrollmentUtil.isCreator(enrollment, user);

        return isAllowedByAppointmentPermission || isCreatorOfEnrollment;
    }

    public static permissionByToken(enrollment: Enrollment, token: string) {
        const check = crypto.createHash('sha256')
            .update(enrollment.id + process.env.SALT_ENROLLMENT)
            .digest('hex');

        return token !== null
            && token !== undefined
            && (token.replace(' ', '+') === check);
    }

    public static isCreator(enrollment: Enrollment, user: User) {
        return enrollment.creator !== undefined
            && enrollment.creator !== null
            && enrollment.creator.id === user.id;
    }

    public static filterValidAdditions(enrollment: Enrollment, appointment: Appointment) {
        let output = [];

        if (Array.isArray(enrollment.additions)) {
            for (const fAddition of enrollment.additions) {
                const additions = appointment.additions.filter(filterAddition => filterAddition.id === fAddition.id);

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

    public static parseEnrollmentObject(enrollment: Enrollment, appointment: Appointment) {
        let output = new Enrollment();

        output.name = enrollment.name;

        const trimmedComment = enrollment.comment.trim();
        output.comment = trimmedComment === '' ? null : trimmedComment;
        output.additions = EnrollmentUtil.filterValidAdditions(enrollment, appointment);

        this._handleDriverAddition(output, enrollment, appointment);

        return output;
    }

    public static handleDriverRelation(driverToBe: Driver, currentDriverObject: Driver): Driver | undefined {
        let _driver = new Driver();
        let _driver_original = new Driver();

        if (currentDriverObject !== undefined) {
            _driver = JSON.parse(JSON.stringify(currentDriverObject));
            _driver_original = JSON.parse(JSON.stringify(currentDriverObject));
        }

        _driver.seats = driverToBe?.seats;
        _driver.service = driverToBe?.service;

        if (JSON.stringify(_driver) !== JSON.stringify(_driver_original)) {
            return _driver;
        }

        return undefined;
    }

    public static handlePassengerRelation(passengerToBe: Passenger, currentPassengerObject: Passenger): Passenger | undefined {
        let _passenger = new Passenger();
        let _passenger_original = new Passenger();

        if (currentPassengerObject !== undefined) {
            _passenger = JSON.parse(JSON.stringify(currentPassengerObject));
            _passenger_original = JSON.parse(JSON.stringify(currentPassengerObject));
        }

        _passenger.requirement = passengerToBe?.requirement;

        if (JSON.stringify(_passenger) !== JSON.stringify(_passenger_original)) {
            return _passenger;
        }

        return undefined;
    }

    private static _handleDriverAddition(output: Enrollment, enrollment: Enrollment, appointment: Appointment) {
        if (appointment.driverAddition) { // if (!!_appointment.driverAddition === true) {
            if (enrollment?.driver) {
                output.driver = EnrollmentUtil.handleDriverRelation(enrollment.driver, undefined);
            } else if (enrollment?.passenger) {
                output.passenger = EnrollmentUtil.handlePassengerRelation(enrollment.passenger, undefined);
            } else {
                throw new EmptyFieldsException('EMPTY_FIELDS',
                    'Please specify one of the following values',
                    ['driver', 'passenger']);
            }
        }
    }
}
