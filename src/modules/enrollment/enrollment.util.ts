import {Enrollment} from './enrollment.entity';
import {Appointment} from '../appointment/appointment.entity';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {Driver} from './driver/driver.entity';
import {Passenger} from './passenger/passenger.entity';
import {MissingValuesException} from '../../exceptions/MissingValuesException';

export class EnrollmentUtil {
    public static filterValidAdditions(enrollment: Enrollment, appointment: Appointment) {
        let output = [];

        if (Array.isArray(enrollment.additions)) {
            for (const fAddition of enrollment.additions) {
                const additions = appointment._additions.filter(filterAddition => filterAddition.id === fAddition.id);

                if (additions.length > 0) {
                    output.push(additions[0]);
                } else {
                    throw new EntityNotFoundException(null, null, {
                        'object': 'addition',
                        'attribute': 'id',
                        'in': 'body',
                        'value': fAddition.id,
                        'message': 'Specified addition does not exist in this appointment'
                    });
                }
            }
        }

        return output;
    }

    public static parseEnrollmentObject(enrollment: Enrollment, appointment: Appointment) {
        let output = new Enrollment();

        output.name = enrollment.name;

        const trimmedComment = enrollment.comment?.trim();
        output.comment = trimmedComment === '' ? null : trimmedComment;

        output.additions = EnrollmentUtil.filterValidAdditions(enrollment, appointment);

        this._parseDriverAddition(output, enrollment, appointment);

        return output;
    }

    /** TODO WTF */
    public static handleDriverRelation(driverToBe: Driver, currentDriverObject: Driver): Driver | undefined {
        if (!driverToBe) {
            return undefined;
        }

        let _driver = new Driver();
        let _driver_original = new Driver();

        if (currentDriverObject !== undefined) {
            _driver = JSON.parse(JSON.stringify(currentDriverObject));
            _driver_original = JSON.parse(JSON.stringify(currentDriverObject));
        }

        // TODO
        // When change from passenger to driver
        // then only providing seats or service
        // the counter part WILL be undefined
        // thats bad

        _driver.seats = driverToBe.seats ? driverToBe.seats : _driver_original.seats; // happens if user just updated the seats or service
        _driver.service = driverToBe.service ? driverToBe.service : _driver_original.service;

        if (JSON.stringify(_driver) !== JSON.stringify(_driver_original)) {
            return _driver;
        }

        return undefined;
    }

    public static handlePassengerRelation(passengerToBe: Passenger, currentPassengerObject: Passenger): Passenger | undefined {
        if (!passengerToBe) {
            return undefined;
        }

        let _passenger = new Passenger();
        let _passenger_original = new Passenger();

        if (currentPassengerObject !== undefined) {
            _passenger = JSON.parse(JSON.stringify(currentPassengerObject));
            _passenger_original = JSON.parse(JSON.stringify(currentPassengerObject));
        }

        _passenger.requirement = passengerToBe.requirement;

        if (JSON.stringify(_passenger) !== JSON.stringify(_passenger_original)) {
            return _passenger;
        }

        return undefined;
    }

    private static _parseDriverAddition(output: Enrollment, enrollment: Enrollment, appointment: Appointment) {
        if (appointment.driverAddition) { // if (!!_appointment.driverAddition === true) {
            if (enrollment.driver) {
                output.driver = EnrollmentUtil.handleDriverRelation(enrollment.driver, undefined);
            } else if (enrollment.passenger) {
                output.passenger = EnrollmentUtil.handlePassengerRelation(enrollment.passenger, undefined);
            } else {
                throw new MissingValuesException(null,
                    'Please specify one of the following values',
                    ['driver', 'passenger']);
            }
        }
    }
}
