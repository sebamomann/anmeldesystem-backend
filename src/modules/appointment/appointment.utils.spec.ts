import {User} from '../user/user.entity';
import {Appointment} from './appointment.entity';
import {Enrollment} from '../enrollment/enrollment.entity';
import {InvalidValuesException} from '../../exceptions/InvalidValuesException';
import {AppointmentUtil} from './appointment.util';

describe('AppointmentUtil', () => {
    it('should be defined', () => {
        expect(AppointmentUtil).toBeDefined();
    });

    describe('* handle date validation', () => {
        it('* on valid date return date (date > deadline)', () => {
            const __given_date = new Date();
            const __given_deadline = new Date(__given_date.getTime() - 15 * 60000);

            const __actual = AppointmentUtil.handleDateValidation(__given_date, __given_deadline);
            expect(__actual).toEqual(__given_date);
        });

        it('* on invalid date return error (date < deadline)', (done) => {
            const __given_date = new Date();
            const __given_deadline = new Date(__given_date.getTime() + 15 * 60000);

            try {
                AppointmentUtil.handleDateValidation(__given_date, __given_deadline);
                done.fail(new Error('I have failed you, Anakin. Should have gotten an InvalidValuesException'));
            } catch (e) {
                expect(e).toBeInstanceOf(InvalidValuesException);
                expect(e.data).toEqual(['date']);
                done();
            }
        });
    });

    describe('* handle deadline validation', () => {
        it('* on valid deadline return deadline (date > deadline)', () => {
            const __given_date = new Date();
            const __given_deadline = new Date(__given_date.getTime() - 15 * 60000);

            const __actual = AppointmentUtil.handleDeadlineValidation(__given_date, __given_deadline);
            expect(__actual).toEqual(__given_deadline);
        });

        it('* on invalid deadline return error (date < deadline)', (done) => {
            const __given_date = new Date();
            const __given_deadline = new Date(__given_date.getTime() + 15 * 60000);

            try {
                AppointmentUtil.handleDeadlineValidation(__given_date, __given_deadline);
                done.fail(new Error('I have failed you, Anakin. Should have gotten an InvalidValuesException'));
            } catch (e) {
                expect(e).toBeInstanceOf(InvalidValuesException);
                expect(e.data).toEqual(['deadline']);
                done();
            }
        });
    });

    describe('* permission checking', () => {
        describe('* is creator', () => {
            it('* valid should return true', () => {
                const __given_user = new User();
                __given_user.username = 'username';

                const __given_appointment = new Appointment();
                __given_appointment.creator = __given_user;

                const __actual = AppointmentUtil.isCreatorOfAppointment(__given_appointment, __given_user);
                expect(__actual).toBeTruthy();
            });

            describe('* invalid should return false', () => {
                it('* invalid user object - null', () => {
                    const __given_user = undefined;

                    const __appointment_creator = new User();
                    __appointment_creator.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.creator = __appointment_creator;

                    const __actual = AppointmentUtil.isCreatorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* invalid user object - undefined', () => {
                    const __given_user = null;

                    const __appointment_creator = new User();
                    __appointment_creator.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.creator = __appointment_creator;

                    const __actual = AppointmentUtil.isCreatorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* wrong username', () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __appointment_creator = new User();
                    __appointment_creator.username = 'creator';

                    const __given_appointment = new Appointment();
                    __given_appointment.creator = __appointment_creator;

                    const __actual = AppointmentUtil.isCreatorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });
            });
        });

        describe('* is administrator', () => {
            it('* valid should return true', () => {
                const __given_user = new User();
                __given_user.username = 'username';

                const __given_appointment = new Appointment();
                __given_appointment.administrators = [__given_user];

                const __actual = AppointmentUtil.isAdministratorOfAppointment(__given_appointment, __given_user);
                expect(__actual).toBeTruthy();
            });

            describe('* invalid should return false', () => {
                it('* invalid user object - null', () => {
                    const __given_user = undefined;

                    const __appointment_admin = new User();
                    __appointment_admin.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.administrators = [__appointment_admin];

                    const __actual = AppointmentUtil.isAdministratorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* invalid user object - undefined', () => {
                    const __given_user = null;

                    const __appointment_admin = new User();
                    __appointment_admin.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.administrators = [__appointment_admin];

                    const __actual = AppointmentUtil.isAdministratorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* wrong username', () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __appointment_admin = new User();
                    __appointment_admin.username = 'administrator';

                    const __given_appointment = new Appointment();
                    __given_appointment.administrators = [__appointment_admin];

                    const __actual = AppointmentUtil.isAdministratorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* undefined administrator list', () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.administrators = undefined;

                    const __actual = AppointmentUtil.isAdministratorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* empty administrator list', () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.administrators = [];

                    const __actual = AppointmentUtil.isAdministratorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });
            });
        });
    });

    describe('* parse references', () => {
        describe('* successful should return correct references array', () => {
            it('* is creator', async () => {
                const __given_user = new User();
                __given_user.username = 'username';

                const __given_pins = [];

                const __given_appointment = new Appointment();
                __given_appointment.creator = __given_user;

                const __expected = ['CREATOR'];

                const __actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins);
                expect(__actual).toEqual(__expected);
            });

            it('* is administrator', async () => {
                const __given_user = new User();
                __given_user.username = 'username';

                const __given_pins = [];

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __given_appointment = new Appointment();
                __given_appointment.creator = __existing_creator;
                __given_appointment.administrators = [__given_user];

                const __expected = ['ADMIN'];

                const __actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins);
                expect(__actual).toEqual(__expected);
            });

            it('* is enrolled', async () => {
                const __given_user = new User();
                __given_user.username = 'username';

                const __given_pins = [];

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.creator = __given_user;

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __given_appointment = new Appointment();
                __given_appointment.id = '1';
                __given_appointment.creator = __existing_creator;
                __given_appointment.enrollments = [__existing_enrollment];

                const __expected = ['ENROLLED'];

                const actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins);
                expect(actual).toEqual(__expected);
            });

            describe('* is pinned', () => {
                it('* as account', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_pins = [];

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __given_appointment = new Appointment();
                    __given_appointment.id = '1';
                    __given_appointment.creator = __existing_creator;
                    __given_appointment.pinners = [__given_user];

                    const __expected = ['PINNED'];

                    const actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins);
                    expect(actual).toEqual(__expected);
                });

                it('* by parameter', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __given_appointment = new Appointment();
                    __given_appointment.id = '1';
                    __given_appointment.creator = __existing_creator;
                    __given_appointment.link = 'myLink';

                    const __given_pins = [__given_appointment.link];

                    const __expected = ['PINNED'];

                    const actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins);
                    expect(actual).toEqual(__expected);
                });
            });

            it('* is creator and enrolled', async () => {
                const __given_user = new User();
                __given_user.username = 'username';

                const __given_pins = [];

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.creator = __given_user;

                const __given_appointment = new Appointment();
                __given_appointment.creator = __given_user;
                __given_appointment.enrollments = [__existing_enrollment];

                const __expected = ['CREATOR', 'ENROLLED'];

                const __actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins);
                expect(__actual).toEqual(__expected);
            });

            describe('* is creator and pinned', () => {
                it('* as account', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_pins = [];

                    const __given_appointment = new Appointment();
                    __given_appointment.creator = __given_user;
                    __given_appointment.pinners = [__given_user];

                    const __expected = ['CREATOR', 'PINNED'];

                    const __actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins);
                    expect(__actual).toEqual(__expected);
                });

                it('* by parameter', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.creator = __given_user;
                    __given_appointment.pinners = [__given_user];
                    __given_appointment.link = 'link';

                    const __given_pins = [__given_appointment.link];

                    const __expected = ['CREATOR', 'PINNED'];

                    const __actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins);
                    expect(__actual).toEqual(__expected);
                });
            });
        });

        describe('* invalid should return empty references array', () => {
            it('* no references', async () => {
                const __given_user = new User();
                __given_user.username = 'username';

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __existing_admin = new User();
                __existing_admin.username = 'admin';

                const __given_appointment = new Appointment();
                __given_appointment.id = '1';
                __given_appointment.creator = __existing_creator;
                __given_appointment.administrators = [__existing_admin];

                const __given_pins = [];

                const __expected = [];

                const __actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins);
                expect(__actual).toEqual(__expected);
            });

            it('* invalid user object', async () => {
                const __given_user = null;

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __existing_admin = new User();
                __existing_admin.username = 'admin';

                const __given_appointment = new Appointment();
                __given_appointment.id = '1';
                __given_appointment.creator = __existing_creator;
                __given_appointment.administrators = [__existing_admin];

                const __given_pins = [];

                const __expected = [];

                const __actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins);
                expect(__actual).toEqual(__expected);
            });
        });
    });

    // TODO
    // missing function filterPermittedEnrollments();

    afterEach(() => {
        jest.restoreAllMocks();
    });
});