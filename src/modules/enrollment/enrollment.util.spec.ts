import {EnrollmentUtil} from './enrollment.util';
import {Enrollment} from './enrollment.entity';
import {User} from '../user/user.entity';
import {Appointment} from '../appointment/appointment.entity';
import {Addition} from '../addition/addition.entity';
import {AppointmentUtil} from '../appointment/appointment.util';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

const crypto = require('crypto');

describe('AppointmentUtil', () => {
    it('should be defined', () => {
        expect(EnrollmentUtil).toBeDefined();
    });

    describe('* check permissions', () => {
        describe('* has permission', () => {
            describe('* successful should return true', () => {
                describe('* is permitted by user', () => {
                    const __given_token = '';

                    const __given_user = new User();
                    __given_user.id = '7efff1cc-a623-459f-b665-90d22446cc49';
                    __given_user.username = 'username';

                    const __existing_creator = new User();
                    __existing_creator.id = 'ef662243-489a-49c4-8e69-5aee1e2bd23b';
                    __existing_creator.username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.id = '3f091325-1fb1-4dde-bd89-3298236a730b';
                    __existing_appointment.creator = __existing_creator;

                    const __given_enrollment = new Enrollment();
                    __given_enrollment.id = '3eb442bd-9708-451f-a55b-902cab48c2f8';
                    __given_enrollment.name = 'name';
                    __given_enrollment.appointment = __existing_appointment;
                    __given_enrollment.creator = __given_user;

                    const __actual = EnrollmentUtil.hasPermission(__given_enrollment, __given_user, __given_token);
                    expect(__actual).toBeTruthy();
                });

                describe('* is permitted by token', () => {
                    const __given_user = new User();
                    __given_user.id = '7efff1cc-a623-459f-b665-90d22446cc49';
                    __given_user.username = 'username';

                    const __existing_creator = new User();
                    __existing_creator.id = 'ef662243-489a-49c4-8e69-5aee1e2bd23b';
                    __existing_creator.username = 'creator';

                    const __existing_enrollment_creator = new User();
                    __existing_enrollment_creator.id = '2fde4357-ae16-4345-b322-3ce1a12ebb03';
                    __existing_enrollment_creator.username = 'enrollment_creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.id = '3f091325-1fb1-4dde-bd89-3298236a730b';
                    __existing_appointment.creator = __existing_creator;

                    const __given_enrollment = new Enrollment();
                    __given_enrollment.id = '3eb442bd-9708-451f-a55b-902cab48c2f8';
                    __given_enrollment.name = 'name';
                    __given_enrollment.appointment = __existing_appointment;
                    __given_enrollment.creator = __existing_enrollment_creator;

                    const __given_token = crypto.createHash('sha256')
                        .update(__given_enrollment.id + process.env.SALT_ENROLLMENT)
                        .digest('hex');

                    const __actual = EnrollmentUtil.hasPermission(__given_enrollment, __given_user, __given_token);
                    expect(__actual).toBeTruthy();
                });

            });

            it('* failure should return false', async () => {
                const __given_user = new User();
                __given_user.id = '7efff1cc-a623-459f-b665-90d22446cc49';
                __given_user.username = 'username';

                const __given_token = '';

                const __existing_enrollment_creator = new User();
                __existing_enrollment_creator.id = '2fde4357-ae16-4345-b322-3ce1a12ebb03';
                __existing_enrollment_creator.username = 'enrollment_creator';

                const __existing_creator = new User();
                __existing_creator.id = 'ef662243-489a-49c4-8e69-5aee1e2bd23b';
                __existing_creator.username = 'creator';

                const __existing_appointment = new Appointment();
                __existing_appointment.id = '3f091325-1fb1-4dde-bd89-3298236a730b';
                __existing_appointment.creator = __existing_creator;

                const __given_enrollment = new Enrollment();
                __given_enrollment.id = '3eb442bd-9708-451f-a55b-902cab48c2f8';
                __given_enrollment.name = 'name';
                __given_enrollment.appointment = __existing_appointment;
                __given_enrollment.creator = __existing_enrollment_creator;

                const __actual = EnrollmentUtil.hasPermission(__given_enrollment, __given_user, __given_token);
                expect(__actual).toBeFalsy();
            });
        });
        describe('* permission by user', () => {
            describe('* successful should return true', () => {
                describe('* is permitted by appointment', () => {
                    it('* is creator', async () => {
                        const __given_user = new User();
                        __given_user.id = '7efff1cc-a623-459f-b665-90d22446cc49';
                        __given_user.username = 'username';

                        const __existing_appointment = new Appointment();
                        __existing_appointment.id = '3f091325-1fb1-4dde-bd89-3298236a730b';
                        __existing_appointment.creator = __given_user;

                        const __given_enrollment = new Enrollment();
                        __given_enrollment.name = 'name';
                        __given_enrollment.appointment = __existing_appointment;

                        const __actual = EnrollmentUtil.permissionByUser(__given_enrollment, __given_user);
                        expect(__actual).toBeTruthy();
                    });

                    it('* is admin', async () => {
                        const __given_user = new User();
                        __given_user.id = '7efff1cc-a623-459f-b665-90d22446cc49';
                        __given_user.username = 'username';

                        const __existing_creator = new User();
                        __existing_creator.id = 'ef662243-489a-49c4-8e69-5aee1e2bd23b';
                        __existing_creator.username = 'creator';

                        const __existing_appointment = new Appointment();
                        __existing_appointment.id = '3f091325-1fb1-4dde-bd89-3298236a730b';
                        __existing_appointment.creator = __existing_creator;
                        __existing_appointment.administrators = [__given_user];

                        const __given_enrollment = new Enrollment();
                        __given_enrollment.name = 'name';
                        __given_enrollment.appointment = __existing_appointment;

                        const __actual = EnrollmentUtil.permissionByUser(__given_enrollment, __given_user);
                        expect(__actual).toBeTruthy();
                    });
                });
                it('* is permitted by enrollment', async () => {
                    const __given_user = new User();
                    __given_user.id = '7efff1cc-a623-459f-b665-90d22446cc49';
                    __given_user.username = 'username';

                    const __existing_creator = new User();
                    __existing_creator.id = 'ef662243-489a-49c4-8e69-5aee1e2bd23b';
                    __existing_creator.username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.id = '3f091325-1fb1-4dde-bd89-3298236a730b';
                    __existing_appointment.creator = __existing_creator;

                    const __given_enrollment = new Enrollment();
                    __given_enrollment.name = 'name';
                    __given_enrollment.appointment = __existing_appointment;
                    __given_enrollment.creator = __given_user;

                    const __actual = EnrollmentUtil.permissionByUser(__given_enrollment, __given_user);
                    expect(__actual).toBeTruthy();
                });
            });

            describe('* failure should return false', () => {
                const __given_user = new User();
                __given_user.id = '7efff1cc-a623-459f-b665-90d22446cc49';
                __given_user.username = 'username';

                const __existing_creator = new User();
                __existing_creator.id = 'ef662243-489a-49c4-8e69-5aee1e2bd23b';
                __existing_creator.username = 'creator';

                const __existing_enrollment_creator = new User();
                __existing_enrollment_creator.id = '2761e446-6d02-4c3e-96a4-22c13ca18d20';
                __existing_enrollment_creator.username = 'enrollment_creator';

                const __existing_appointment = new Appointment();
                __existing_appointment.id = '3f091325-1fb1-4dde-bd89-3298236a730b';
                __existing_appointment.creator = __existing_creator;

                const __given_enrollment = new Enrollment();
                __given_enrollment.name = 'name';
                __given_enrollment.appointment = __existing_appointment;
                __given_enrollment.creator = __existing_enrollment_creator;

                const __actual = EnrollmentUtil.permissionByUser(__given_enrollment, __given_user);
                expect(__actual).toBeFalsy();
            });
        });

        describe('* permission by token', () => {
            it('* successful should return true', async () => {
                const __given_enrollment = new Enrollment();
                __given_enrollment.id = 'd242958a-9d57-4676-9352-31b4fc884f83';
                __given_enrollment.name = 'my name';

                const __given_token = crypto.createHash('sha256')
                    .update(__given_enrollment.id + process.env.SALT_ENROLLMENT)
                    .digest('hex');

                const __actual = EnrollmentUtil.permissionByToken(__given_enrollment, __given_token);
                expect(__actual).toBeTruthy();
            });

            describe('* failure should return false', () => {
                it('* token undefined', async () => {
                    const __given_enrollment = new Enrollment();
                    __given_enrollment.id = 'd242958a-9d57-4676-9352-31b4fc884f83';
                    __given_enrollment.name = 'my name';

                    const __given_token = undefined;

                    const __actual = EnrollmentUtil.permissionByToken(__given_enrollment, __given_token);
                    expect(__actual).toBeFalsy();
                });

                it('* token invalid', async () => {
                    const __given_enrollment = new Enrollment();
                    __given_enrollment.id = 'd242958a-9d57-4676-9352-31b4fc884f83';
                    __given_enrollment.name = 'my name';

                    const __given_token = 'random token';

                    const __actual = EnrollmentUtil.permissionByToken(__given_enrollment, __given_token);
                    expect(__actual).toBeFalsy();
                });
            });
        });

        describe('* is creator', () => {
            it('* successful should return true', async () => {
                const __existing_user = new User();
                __existing_user.id = '961ea50a-f8d0-4e97-976d-06afbf56e847';

                const __given_user = __existing_user;

                const __given_enrollment = new Enrollment();
                __given_enrollment.id = 'd242958a-9d57-4676-9352-31b4fc884f83';
                __given_enrollment.name = 'my name';
                __given_enrollment.creator = __existing_user;

                const __actual = EnrollmentUtil.isCreator(__given_enrollment, __given_user);
                expect(__actual).toBeTruthy();
            });

            describe('* failure should return false', () => {
                it('* creator undefined', async () => {
                    const __existing_user = undefined;

                    const __given_user = __existing_user;

                    const __given_enrollment = new Enrollment();
                    __given_enrollment.id = 'd242958a-9d57-4676-9352-31b4fc884f83';
                    __given_enrollment.name = 'my name';
                    __given_enrollment.creator = __existing_user;

                    const __actual = EnrollmentUtil.isCreator(__given_enrollment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* different creator', async () => {
                    const __existing_creator = new User();
                    __existing_creator.id = '7efff1cc-a623-459f-b665-90d22446cc49';

                    const __given_user = new User();
                    __given_user.id = '961ea50a-f8d0-4e97-976d-06afbf56e847';

                    const __given_enrollment = new Enrollment();
                    __given_enrollment.id = 'd242958a-9d57-4676-9352-31b4fc884f83';
                    __given_enrollment.name = 'my name';
                    __given_enrollment.creator = __existing_creator;

                    const __actual = EnrollmentUtil.isCreator(__given_enrollment, __given_user);
                    expect(__actual).toBeFalsy();
                });
            });
        });
    });

    describe('* filter valid additions', () => {
        describe('* successful should return addition list', () => {
            it('* valid additions provided', async () => {
                const __existing_addition_1 = new Addition();
                __existing_addition_1.id = 'a1f6f0d6-6391-4709-a44e-f878c8754921';
                __existing_addition_1.name = 'addition1';

                const __existing_addition_2 = new Addition();
                __existing_addition_2.id = 'b27cc10b-4789-4951-9c38-86e6fdb28a59';
                __existing_addition_2.name = 'addition2';

                const __given_appointment = new Appointment();
                __given_appointment.additions = [__existing_addition_1, __existing_addition_2];

                const __given_enrollment_addition_1 = __existing_addition_1;
                const __given_enrollment_addition_2 = __existing_addition_2;

                const __given_enrollment = new Enrollment();
                __given_enrollment.additions = [__given_enrollment_addition_1, __given_enrollment_addition_2];

                const __expected = [__given_enrollment_addition_1, __given_enrollment_addition_2];

                const __actual = EnrollmentUtil.filterValidAdditions(__given_enrollment, __given_appointment);
                expect(__actual).toEqual(__expected);
            });

            it('* no additions provided - return empty list', async () => {
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
            __given_appointment.additions = [__existing_addition_1];

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

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
