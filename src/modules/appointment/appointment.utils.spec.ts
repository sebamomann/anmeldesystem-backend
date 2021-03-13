import {User} from '../user/user.entity';
import {Appointment} from './appointment.entity';
import {Enrollment} from '../enrollment/enrollment.entity';
import {InvalidValuesException} from '../../exceptions/InvalidValuesException';
import {AppointmentUtil} from './appointment.util';

const crypto = require('crypto');

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
        describe('* is creator or administrator', () => {
            it('* valid should return true (creator)', () => {
                const __given_user = new User();
                __given_user.username = 'username';

                const __given_appointment = new Appointment();
                __given_appointment.creator = __given_user;

                const __actual = AppointmentUtil.isCreatorOrAdministrator(__given_appointment, __given_user);
                expect(__actual).toBeTruthy();
            });

            it('* valid should return true (administrator)', async () => {
                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __given_user = new User();
                __given_user.username = 'username';

                const __given_appointment = new Appointment();
                __given_appointment.creator = __existing_creator;
                __given_appointment._administrators = [__given_user];

                const __actual = AppointmentUtil.isCreatorOrAdministrator(__given_appointment, __given_user);
                expect(__actual).toBeTruthy();
            });

            it('* invalid user object - null', () => {
                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __given_user = new User();
                __given_user.username = 'username';

                const __given_appointment = new Appointment();
                __given_appointment.creator = __existing_creator;
                __given_appointment._administrators = [__given_user];

                const __actual = AppointmentUtil.isCreatorOrAdministrator(__given_appointment, __given_user);
                expect(__actual).toBeTruthy();
            });
        });

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
                __given_appointment._administrators = [__given_user];

                const __actual = AppointmentUtil.isAdministratorOfAppointment(__given_appointment, __given_user);
                expect(__actual).toBeTruthy();
            });

            describe('* invalid should return false', () => {
                it('* invalid user object - null', () => {
                    const __given_user = undefined;

                    const __appointment_admin = new User();
                    __appointment_admin.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment._administrators = [__appointment_admin];

                    const __actual = AppointmentUtil.isAdministratorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* invalid user object - undefined', () => {
                    const __given_user = null;

                    const __appointment_admin = new User();
                    __appointment_admin.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment._administrators = [__appointment_admin];

                    const __actual = AppointmentUtil.isAdministratorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* wrong username', () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __appointment_admin = new User();
                    __appointment_admin.username = 'administrator';

                    const __given_appointment = new Appointment();
                    __given_appointment._administrators = [__appointment_admin];

                    const __actual = AppointmentUtil.isAdministratorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* undefined administrator list', () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment._administrators = undefined;

                    const __actual = AppointmentUtil.isAdministratorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* empty administrator list', () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment._administrators = [];

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
                __given_appointment._administrators = [__given_user];

                const __expected = ['ADMIN'];

                const __actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins);
                expect(__actual).toEqual(__expected);
            });

            describe('* is enrolled', () => {
                it('* by account', async () => {
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

                describe('* by parameter', () => {
                    it('* normal parameter', async () => {
                        const __given_user = new User();
                        __given_user.username = 'username';

                        const __given_pins = [];
                        const __given_permissions = {perm1: '996fe741-1142-4899-96fd-767a577f5268'};

                        const __existing_enrollment = new Enrollment();
                        __existing_enrollment.id = '996fe741-1142-4899-96fd-767a577f5268';

                        const __existing_creator = new User();
                        __existing_creator.username = 'creator';

                        const __given_appointment = new Appointment();
                        __given_appointment.id = '1';
                        __given_appointment.creator = __existing_creator;
                        __given_appointment.enrollments = [__existing_enrollment];

                        const __expected = ['ENROLLED'];

                        const actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins, __given_permissions);
                        expect(actual).toEqual(__expected);
                    });

                    it('* including invalid attribute', async () => {
                        const __given_user = new User();
                        __given_user.username = 'username';

                        const __given_pins = [];
                        const __given_permissions = {perm1: '996fe741-1142-4899-96fd-767a577f5268', invalid: 'attribute'};

                        const __existing_enrollment = new Enrollment();
                        __existing_enrollment.id = '996fe741-1142-4899-96fd-767a577f5268';

                        const __existing_creator = new User();
                        __existing_creator.username = 'creator';

                        const __given_appointment = new Appointment();
                        __given_appointment.id = '1';
                        __given_appointment.creator = __existing_creator;
                        __given_appointment.enrollments = [__existing_enrollment];

                        const __expected = ['ENROLLED'];

                        const actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins, __given_permissions);
                        expect(actual).toEqual(__expected);
                    });
                });
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
                it('* pinned by account', async () => {
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

                it('* pinned by parameter', async () => {
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
                __given_appointment._administrators = [__existing_admin];

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
                __given_appointment._administrators = [__existing_admin];

                const __given_pins = [];

                const __expected = [];

                const __actual = AppointmentUtil.parseReferences(__given_user, __given_appointment, __given_pins);
                expect(__actual).toEqual(__expected);
            });
        });
    });

    describe('* filter permitted enrollments', () => {
        describe('* !(creator || admin) but correct permissions should have !empty enrollment list', () => {
            it('* one valid permission', async () => {
                const __existing_enrollment_perm = new Enrollment();
                __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                __existing_enrollment_perm.name = 'owning user';

                const __existing_enrollment_no_perm = new Enrollment();
                __existing_enrollment_no_perm.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                __existing_enrollment_no_perm.name = 'not owning user';

                const __given_appointment = new Appointment();
                __given_appointment.enrollments = [__existing_enrollment_perm, __existing_enrollment_no_perm];

                const token = crypto.createHash('sha256')
                    .update(__existing_enrollment_perm.id + process.env.SALT_ENROLLMENT)
                    .digest('hex');

                const __given_permissions = {perm1: __existing_enrollment_perm.id, token};

                const __expected = [__existing_enrollment_perm];

                const __actual = AppointmentUtil.filterPermittedEnrollments(__given_permissions, __given_appointment.enrollments);
                expect(__actual).toEqual(__expected);
            });

            it('* two valid permissions', async () => {
                const __existing_enrollment_perm = new Enrollment();
                __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                __existing_enrollment_perm.name = 'owning user';

                const __existing_enrollment_perm_2 = new Enrollment();
                __existing_enrollment_perm_2.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                __existing_enrollment_perm_2.name = 'not owning user';

                const __given_appointment = new Appointment();
                __given_appointment.enrollments = [__existing_enrollment_perm, __existing_enrollment_perm_2];

                const token = crypto.createHash('sha256')
                    .update(__existing_enrollment_perm.id + process.env.SALT_ENROLLMENT)
                    .digest('hex');

                const token_2 = crypto.createHash('sha256')
                    .update(__existing_enrollment_perm_2.id + process.env.SALT_ENROLLMENT)
                    .digest('hex');

                const __given_permissions = {
                    perm1: __existing_enrollment_perm.id,
                    token1: token,
                    perm2: __existing_enrollment_perm_2.id,
                    token2: token_2
                };

                const __expected = [__existing_enrollment_perm, __existing_enrollment_perm_2];

                const __actual = AppointmentUtil.filterPermittedEnrollments(__given_permissions, __given_appointment.enrollments);
                expect(__actual).toEqual(__expected);
            });

            describe('* one valid and one invalid permission', () => {
                it('* invalid token', async () => {
                    const __existing_enrollment_perm = new Enrollment();
                    __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                    __existing_enrollment_perm.name = 'owning user';

                    const __existing_enrollment_perm_2 = new Enrollment();
                    __existing_enrollment_perm_2.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                    __existing_enrollment_perm_2.name = 'not owning user';

                    const __given_appointment = new Appointment();
                    __given_appointment.enrollments = [__existing_enrollment_perm, __existing_enrollment_perm_2];

                    const token = crypto.createHash('sha256')
                        .update(__existing_enrollment_perm.id + process.env.SALT_ENROLLMENT)
                        .digest('hex');

                    const token_2 = 'INVALID_TOKEN';

                    const __given_permissions = {
                        perm1: __existing_enrollment_perm.id,
                        token1: token,
                        perm2: __existing_enrollment_perm_2.id,
                        token2: token_2
                    };

                    const __expected = [__existing_enrollment_perm];

                    const __actual = AppointmentUtil.filterPermittedEnrollments(__given_permissions, __given_appointment.enrollments);
                    expect(__actual).toEqual(__expected);
                });

                it('* non existing enrollment (id) but correct corresponding token', async () => {
                    const __existing_enrollment_perm = new Enrollment();
                    __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                    __existing_enrollment_perm.name = 'owning user';

                    const __existing_enrollment_perm_2 = new Enrollment();
                    __existing_enrollment_perm_2.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                    __existing_enrollment_perm_2.name = 'not owning user';

                    const __given_appointment = new Appointment();
                    __given_appointment.enrollments = [__existing_enrollment_perm, __existing_enrollment_perm_2];

                    const token = crypto.createHash('sha256')
                        .update(__existing_enrollment_perm.id + process.env.SALT_ENROLLMENT)
                        .digest('hex');

                    const fakeId = 'NON_EXISTING_ID';

                    const token_2 = crypto.createHash('sha256')
                        .update(fakeId + process.env.SALT_ENROLLMENT)
                        .digest('hex');

                    const __given_permissions = {
                        perm1: __existing_enrollment_perm.id,
                        token1: token,
                        perm2: fakeId,
                        token2: token_2
                    };

                    const __expected = [__existing_enrollment_perm];

                    const __actual = AppointmentUtil.filterPermittedEnrollments(__given_permissions, __given_appointment.enrollments);
                    expect(__actual).toEqual(__expected);
                });
            });
        });

        describe('* ignore invalid attributes', () => {
            it('* two valid permissions', async () => {
                const __existing_enrollment_perm = new Enrollment();
                __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                __existing_enrollment_perm.name = 'owning user';

                const __existing_enrollment_perm_2 = new Enrollment();
                __existing_enrollment_perm_2.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                __existing_enrollment_perm_2.name = 'not owning user';

                const __given_appointment = new Appointment();
                __given_appointment.enrollments = [__existing_enrollment_perm, __existing_enrollment_perm_2];

                const token = crypto.createHash('sha256')
                    .update(__existing_enrollment_perm.id + process.env.SALT_ENROLLMENT)
                    .digest('hex');

                const token_2 = crypto.createHash('sha256')
                    .update(__existing_enrollment_perm_2.id + process.env.SALT_ENROLLMENT)
                    .digest('hex');

                const __given_permissions = {
                    perm1: __existing_enrollment_perm.id,
                    token1: token,
                    perm2: __existing_enrollment_perm_2.id,
                    token2: token_2,
                    invalid1: '',
                    invalid2: '',
                };

                const __expected = [__existing_enrollment_perm, __existing_enrollment_perm_2];

                const __actual = AppointmentUtil.filterPermittedEnrollments(__given_permissions, __given_appointment.enrollments);
                expect(__actual).toEqual(__expected);
            });
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
