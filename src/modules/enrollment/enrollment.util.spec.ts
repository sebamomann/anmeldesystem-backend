import {EnrollmentUtil} from './enrollment.util';
import {Enrollment} from './enrollment.entity';
import {Appointment} from '../appointment/appointment.entity';
import {Addition} from '../addition/addition.entity';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {Passenger} from './passenger/passenger.entity';
import {Driver} from './driver/driver.entity';

describe('Enrollment Util', () => {
    it('should be defined', () => {
        expect(EnrollmentUtil).toBeDefined();
    });

    describe('* filter valid _additions', () => {
        describe('* successful should return addition list', () => {
            it('* valid _additions provided', async () => {
                const __existing_addition_1 = new Addition();
                __existing_addition_1.id = 'a1f6f0d6-6391-4709-a44e-f878c8754921';
                __existing_addition_1.name = 'addition1';

                const __existing_addition_2 = new Addition();
                __existing_addition_2.id = 'b27cc10b-4789-4951-9c38-86e6fdb28a59';
                __existing_addition_2.name = 'addition2';

                const __given_appointment = new Appointment();
                __given_appointment._additions = [__existing_addition_1, __existing_addition_2];

                const __given_enrollment_addition_1 = __existing_addition_1;
                const __given_enrollment_addition_2 = __existing_addition_2;

                const __given_enrollment = new Enrollment();
                __given_enrollment.additions = [__given_enrollment_addition_1, __given_enrollment_addition_2];

                const __expected = [__given_enrollment_addition_1, __given_enrollment_addition_2];

                const __actual = EnrollmentUtil.filterValidAdditions(__given_enrollment, __given_appointment);
                expect(__actual).toEqual(__expected);
            });

            it('* no _additions provided - return empty list', async () => {
                const __given_appointment = new Appointment();

                const __given_enrollment = new Enrollment();

                const __expected = [];

                const __actual = EnrollmentUtil.filterValidAdditions(__given_enrollment, __given_appointment);
                expect(__actual).toEqual(__expected);
            });
        });

        it('* addition not defined', (done) => {
            const __existing_addition_1 = new Addition();
            __existing_addition_1.id = 'a1f6f0d6-6391-4709-a44e-f878c8754921';
            __existing_addition_1.name = 'addition1';

            const __given_addition = new Addition();
            __given_addition.id = 'b27cc10b-4789-4951-9c38-86e6fdb28a59';
            __given_addition.name = 'not existing';

            const __given_appointment = new Appointment();
            __given_appointment._additions = [__existing_addition_1];

            const __given_enrollment_addition_1 = __given_addition;

            const __given_enrollment = new Enrollment();
            __given_enrollment.additions = [__given_enrollment_addition_1];

            try {
                EnrollmentUtil.filterValidAdditions(__given_enrollment, __given_appointment);
                done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
            } catch (e) {
                expect(e).toBeInstanceOf(EntityNotFoundException);
                expect(e.data).toEqual(JSON.stringify(__given_addition));
                done();
            }
        });
    });

    describe('* handle driver relation', () => {
        it('* return object if changes apply', async () => {
            const __given_driver_to_be = new Driver();
            __given_driver_to_be.service = 4;
            __given_driver_to_be.seats = 2;

            const __given_driver_existing = new Driver();
            __given_driver_existing.service = 5;
            __given_driver_existing.seats = 1;

            const __expected = __given_driver_to_be;

            const __actual = EnrollmentUtil.handleDriverRelation(__given_driver_to_be, __given_driver_existing);

            expect(__actual).toEqual(__expected);
        });

        it('* return object if changes apply - only change seats', async () => {
            const __given_driver_to_be = new Driver();
            __given_driver_to_be.seats = 2;

            const __given_driver_existing = new Driver();
            __given_driver_existing.service = 5;
            __given_driver_existing.seats = 1;

            const __expected = {
                ...__given_driver_to_be,
                service: __given_driver_existing.service
            };

            const __actual = EnrollmentUtil.handleDriverRelation(__given_driver_to_be, __given_driver_existing);

            expect(__actual).toEqual(__expected);
        });

        it('* return object if changes apply - only change service', async () => {
            const __given_driver_to_be = new Driver();
            __given_driver_to_be.service = 4;

            const __given_driver_existing = new Driver();
            __given_driver_existing.service = 5;
            __given_driver_existing.seats = 1;

            const __expected = {
                ...__given_driver_to_be,
                seats: __given_driver_existing.seats
            };

            const __actual = EnrollmentUtil.handleDriverRelation(__given_driver_to_be, __given_driver_existing);

            expect(__actual).toEqual(__expected);
        });

        it('* current object undefined', async () => {
            const __given_driver_to_be = new Driver();
            __given_driver_to_be.service = 4;
            __given_driver_to_be.seats = 2;

            const __given_driver_existing = undefined;

            const __expected = __given_driver_to_be;

            const __actual = EnrollmentUtil.handleDriverRelation(__given_driver_to_be, __given_driver_existing);

            expect(__actual).toEqual(__expected);
        });

        it('* return undefined if no changes apply', async () => {
            const __given_driver_to_be = new Driver();
            __given_driver_to_be.service = 4;
            __given_driver_to_be.seats = 2;

            const __given_driver_existing = new Driver();
            __given_driver_existing.service = 4;
            __given_driver_existing.seats = 2;

            const __actual = EnrollmentUtil.handleDriverRelation(__given_driver_to_be, __given_driver_existing);

            expect(__actual).toBeUndefined();
        });
    });

    describe('* handle passenger relation', () => {
        it('* return object if changes apply', async () => {
            const __given_passenger_to_be = new Passenger();
            __given_passenger_to_be.requirement = 2;

            const __given_passenger_existing = new Passenger();
            __given_passenger_existing.requirement = 1;

            const __expected = __given_passenger_to_be;

            const __actual = EnrollmentUtil.handlePassengerRelation(__given_passenger_to_be, __given_passenger_existing);

            expect(__actual).toEqual(__expected);
        });

        it('* current object undefined', async () => {
            const __given_passenger_to_be = new Passenger();
            __given_passenger_to_be.requirement = 2;

            const __given_passenger_existing = undefined;

            const __expected = __given_passenger_to_be;

            const __actual = EnrollmentUtil.handlePassengerRelation(__given_passenger_to_be, __given_passenger_existing);

            expect(__actual).toEqual(__expected);
        });

        it('* return undefined if no changes apply', async () => {
            const __given_passenger_to_be = new Passenger();
            __given_passenger_to_be.requirement = 2;

            const __given_passenger_existing = new Passenger();
            __given_passenger_existing.requirement = 2;

            const __actual = EnrollmentUtil.handlePassengerRelation(__given_passenger_to_be, __given_passenger_existing);

            expect(__actual).toBeUndefined();
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
