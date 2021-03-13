import {Test, TestingModule} from '@nestjs/testing';
import {UserService} from '../user/user.service';
import {Repository} from 'typeorm';
import {Addition} from '../addition/addition.entity';
import {Appointment} from './appointment.entity';
import {FileService} from '../file/file.service';
import {AdditionService} from '../addition/addition.service';
import {AppointmentService} from './appointment.service';
import {getRepositoryToken} from '@nestjs/typeorm';
import {File} from '../file/file.entity';
import {MAILER_OPTIONS} from '@nest-modules/mailer/dist/constants/mailer-options.constant';
import {MailerService} from '@nest-modules/mailer';
import {AppointmentGateway} from './appointment.gateway';
import {Enrollment} from '../enrollment/enrollment.entity';
import {AppointmentMapper} from './appointment.mapper';
import {PushService} from '../push/push.service';
import {PushSubscription} from '../push/pushSubscription.entity';
import {instance, mock} from 'ts-mockito';
import {User} from '../user/user.model';

const crypto = require('crypto');

describe('AppointmentMapper', () => {
    let module: TestingModule;

    let appointmentService: AppointmentService;
    let appointmentGateway: AppointmentGateway;
    let userService: UserService;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [AppointmentService,
                UserService,
                AdditionService,
                FileService,
                MailerService,
                AppointmentGateway,
                PushService,
                {provide: getRepositoryToken(Appointment), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(File), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Addition), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(PushSubscription), useFactory: repositoryMockFactory},
                {
                    name: MAILER_OPTIONS,
                    provide: MAILER_OPTIONS,
                    useValue: {
                        transport: {
                            host: process.env.MAIL_HOST,
                            port: process.env.MAIL_PORT,
                            auth: {
                                user: process.env.MAIL_preferred_username,
                                pass: process.env.MAIL_PASSWORD
                            }
                        }
                    }
                },
            ],
        }).compile();

        appointmentService = module.get<AppointmentService>(AppointmentService);
        appointmentGateway = module.get<AppointmentGateway>(AppointmentGateway);
        userService = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(appointmentService).toBeDefined();
    });

    describe('* permission mapping', () => {
        describe('* iat and lud information', () => {
            let mockedUserInstance_creator;
            let mockedAppointmentInstance;

            const mockedUser_creator_keycloak = mock(User);

            const permissions = {};

            beforeEach(() => {
                const mockedUser_creator = mock(User);
                mockedUserInstance_creator = instance(mockedUser_creator);
                mockedUserInstance_creator.sub = 'bdb9ee47-75d4-45f3-914a-4eef91439f4c';

                const mockedAppointment = mock(Appointment);
                mockedAppointmentInstance = instance(mockedAppointment);
                mockedAppointmentInstance.iat = new Date(Date.now());
                mockedAppointmentInstance.lud = new Date(Date.now());
                mockedAppointmentInstance.creatorId = mockedUserInstance_creator.sub;
            });

            it('* creator should see information', async () => {
                // function mocking
                jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

                // execution
                const appointmentMapper = new AppointmentMapper(userService);
                const actual = await appointmentMapper.permission(mockedAppointmentInstance, mockedUserInstance_creator, permissions);

                // expect
                expect('iat' in actual).toBeTruthy();
                expect(actual.iat).toEqual(mockedAppointmentInstance.iat);
                expect('lud' in mockedAppointmentInstance).toBeTruthy();
                expect(actual.lud).toEqual(actual.lud);

                expect(userService.findById).toHaveBeenCalledTimes(1);
                expect(userService.findById).toHaveBeenCalledWith(mockedAppointmentInstance.creatorId);
            });

            it('* not being creator should not include', async () => {
                const mockedUser_requester = mock(User);
                const mockedUserInstance_requester = instance(mockedUser_requester);
                mockedUserInstance_requester.sub = '6dc8df21-9a38-41d7-ae24-83d2a3bdbe7b';

                // function mocking
                jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

                // execution
                const appointmentMapper = new AppointmentMapper(userService);
                const __actual = await appointmentMapper.permission(mockedAppointmentInstance, mockedUserInstance_requester, permissions);

                // expect
                expect('iat' in __actual).toBeFalsy();
                expect('lud' in __actual).toBeFalsy();
            });
        });

        describe('* hidden appointment', () => {
            let mockedUserInstance_requester;
            let mockedUserInstance_creator;
            let mockedAppointmentInstance;

            let mockedEnrollmentInstance_1;
            let mockedEnrollmentInstance_2;

            const mockedUser_creator_keycloak = mock(User);

            beforeEach(() => {
                const mockedUser_requester = mock(User);
                mockedUserInstance_requester = instance(mockedUser_requester);
                mockedUserInstance_requester.sub = '6dc8df21-9a38-41d7-ae24-83d2a3bdbe7b';

                const mockedUser_creator = mock(User);
                mockedUserInstance_creator = instance(mockedUser_creator);
                mockedUserInstance_creator.sub = 'bdb9ee47-75d4-45f3-914a-4eef91439f4c';

                const mockedAppointment = mock(Appointment);
                mockedAppointmentInstance = instance(mockedAppointment);
                mockedAppointmentInstance.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                mockedAppointmentInstance.hidden = true;
                mockedAppointmentInstance.creatorId = mockedUserInstance_creator.sub;

                const mockedEnrollment_1 = mock(Enrollment);
                mockedEnrollmentInstance_1 = instance(mockedEnrollment_1);
                mockedEnrollmentInstance_1.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                mockedEnrollmentInstance_1.name = 'Enrollment 1';

                const mockedEnrollment_2 = mock(Enrollment);
                mockedEnrollmentInstance_2 = instance(mockedEnrollment_2);
                mockedEnrollmentInstance_2.id = '8100b9fa-9f70-4e39-b33d-1e8e7b73b6b3';
                mockedEnrollmentInstance_2.name = 'Enrollment 2';

                mockedAppointmentInstance.enrollments = [mockedEnrollmentInstance_1, mockedEnrollmentInstance_2];
            });

            it('* no permissions via any way should result in empty enrollment list', async () => {
                const permissions = {};

                // function mocking
                jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

                const appointmentMapper = new AppointmentMapper(userService);
                const actual: Appointment = await appointmentMapper.permission(mockedAppointmentInstance, mockedUserInstance_requester, permissions);

                expect(actual.enrollments).toEqual([]);
            });

            describe('* correct permission for enrollment should result in spliced enrollment list', () => {
                it('* one permission - valid permission', async () => {
                    const tokenForPermission = crypto.createHash('sha256')
                        .update(mockedEnrollmentInstance_1.id + process.env.SALT_ENROLLMENT)
                        .digest('hex');

                    const permissions = {
                        perm1: mockedEnrollmentInstance_1.id,
                        token: tokenForPermission
                    };

                    // function mocking
                    jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

                    const appointmentMapper = new AppointmentMapper(userService);
                    const actual: Appointment = await appointmentMapper.permission(mockedAppointmentInstance, mockedUserInstance_requester, permissions);

                    expect(actual.enrollments).toEqual([mockedEnrollmentInstance_1]);
                });

                it('* two permissions - both valid', async () => {
                    const tokenForPermission_1 = crypto.createHash('sha256')
                        .update(mockedEnrollmentInstance_1.id + process.env.SALT_ENROLLMENT)
                        .digest('hex');

                    const tokenForPermission_2 = crypto.createHash('sha256')
                        .update(mockedEnrollmentInstance_2.id + process.env.SALT_ENROLLMENT)
                        .digest('hex');

                    const permissions = {
                        perm1: mockedEnrollmentInstance_1.id,
                        token1: tokenForPermission_1,
                        perm2: mockedEnrollmentInstance_2.id,
                        token2: tokenForPermission_2
                    };

                    // function mocking
                    jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

                    const appointmentMapper = new AppointmentMapper(userService);
                    const actual: Appointment = await appointmentMapper.permission(mockedAppointmentInstance, mockedUserInstance_requester, permissions);

                    expect(actual.enrollments)
                        .toEqual([mockedEnrollmentInstance_1, mockedEnrollmentInstance_2]);
                });

                describe('* two permissions - one valid - one invalid', () => {
                    it('* invalid token', async () => {
                        const tokenForPermission_valid = crypto.createHash('sha256')
                            .update(mockedEnrollmentInstance_1.id + process.env.SALT_ENROLLMENT)
                            .digest('hex');

                        const tokenForPermission_invalid = 'INVALIDTOKEN';

                        const permissions = {
                            perm1: mockedEnrollmentInstance_1.id,
                            token1: tokenForPermission_valid,
                            perm2: mockedEnrollmentInstance_2.id,
                            token2: tokenForPermission_invalid
                        };

                        // function mocking
                        jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

                        const appointmentMapper = new AppointmentMapper(userService);
                        const actual: Appointment = await appointmentMapper.permission(mockedAppointmentInstance, mockedUserInstance_requester, permissions);

                        expect(actual.enrollments).toEqual([mockedEnrollmentInstance_1]);
                    });

                    it('* invalid id but correct token', async () => {
                        const tokenForPermission_valid = crypto.createHash('sha256')
                            .update(mockedEnrollmentInstance_1.id + process.env.SALT_ENROLLMENT)
                            .digest('hex');

                        const invalidId = 'randomIdThatDoesNotExistsInEnrollmentList';
                        const tokenForPermission_valid_invalid_id = crypto.createHash('sha256')
                            .update(invalidId + process.env.SALT_ENROLLMENT)
                            .digest('hex');

                        const permissions = {
                            perm1: mockedEnrollmentInstance_1.id,
                            token1: tokenForPermission_valid,
                            perm2: invalidId,
                            token2: tokenForPermission_valid_invalid_id
                        };

                        // function mocking
                        jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

                        const appointmentMapper = new AppointmentMapper(userService);
                        const actual: Appointment = await appointmentMapper.permission(mockedAppointmentInstance, mockedUserInstance_requester, permissions);

                        expect(actual.enrollments).toEqual([mockedEnrollmentInstance_1]);
                    });
                });
            });

            it('* creator should see all enrollments', async () => {
                const permissions = {};

                // function mocking
                jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

                const appointmentMapper = new AppointmentMapper(userService);
                const actual: Appointment = await appointmentMapper.permission(mockedAppointmentInstance, mockedUserInstance_creator, permissions);

                expect(actual.enrollments).toEqual([mockedEnrollmentInstance_1, mockedEnrollmentInstance_2]);
            });

            it('* admin should see all enrollments', async () => {
                mockedAppointmentInstance.administrators = [mockedUserInstance_requester.sub];

                const permissions = {};

                // function mocking
                jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

                const appointmentMapper = new AppointmentMapper(userService);
                const actual: Appointment = await appointmentMapper.permission(mockedAppointmentInstance, mockedUserInstance_requester, permissions);

                expect(actual.enrollments).toEqual([mockedEnrollmentInstance_1, mockedEnrollmentInstance_2]);
            });
        });
    });

    describe('* slim', () => {
        it('* slim should remove enrollments', async () => {
            const __given_user = new User();
            __given_user.preferred_username = 'preferred_username';
            const __given_slim = true;

            const __existing_creator = new User();
            __existing_creator.sub = '6dc8df21-9a38-41d7-ae24-83d2a3bdbe7b';
            __existing_creator.preferred_username = 'creator';

            const __given_appointment = new Appointment();
            __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
            __given_appointment.hidden = false;
            __given_appointment.creatorId = __existing_creator.sub;
            __given_appointment.enrollments = [new Enrollment(), new Enrollment()];
            __given_appointment.files = [new File(), new File()];

            const __expected = {...__given_appointment};
            delete __expected.enrollments;

            const __actual = AppointmentMapper.slim(__given_appointment, __given_slim);
            expect(__actual).toEqual(__expected);
        });

        it('* !slim should !remove enrollments', async () => {
            const __given_user = new User();
            __given_user.preferred_username = 'preferred_username';
            const __given_slim = false;

            const __existing_creator = new User();
            __existing_creator.sub = '6dc8df21-9a38-41d7-ae24-83d2a3bdbe7b';
            __existing_creator.preferred_username = 'creator';

            const __given_appointment = new Appointment();
            __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
            __given_appointment.hidden = false;
            __given_appointment.creatorId = __existing_creator.sub;
            __given_appointment.enrollments = [new Enrollment(), new Enrollment()];
            __given_appointment.files = [new File(), new File()];

            const __expected = {...__given_appointment};

            const __actual = AppointmentMapper.slim(__given_appointment, __given_slim);
            expect(__actual).toEqual(__expected);
        });
    });

    describe('* basic', () => {
        it('* admins and enrollments exist', async () => {
            const __existing_enrollment = new Enrollment();
            __existing_enrollment.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
            __existing_enrollment.name = 'owning user';

            const __existing_admin = new User();
            __existing_admin.sub = 'f48de1b3-6900-4f0e-939b-78fec185b615';
            __existing_admin.preferred_username = 'admin';
            __existing_admin.name = 'Administrator';

            const __given_appointment = new Appointment();
            __given_appointment.administrators = [__existing_admin.sub];
            __given_appointment.enrollments = [__existing_enrollment];

            const __expected_admin = new User();
            __expected_admin.preferred_username = __existing_admin.preferred_username;
            __expected_admin.name = __existing_admin.name;

            const __expected_enrollment = new Enrollment();
            __expected_enrollment.id = __existing_enrollment.id;
            __expected_enrollment.name = __existing_enrollment.name;
            __expected_enrollment.createdByUser = false;

            const __expected = {...__given_appointment};
            __expected.administrators = [__expected_admin.sub];
            __expected.enrollments = [__expected_enrollment];

            const __actual = (AppointmentMapper as any).basic(__given_appointment);
            expect(__actual).toEqual(__expected);
        });

        it('* admins and enrollments undefined - do nothing', async () => {
            const __given_appointment = new Appointment();

            const __expected = {...__given_appointment};

            const __actual = (AppointmentMapper as any).basic(__given_appointment);
            expect(__actual).toEqual(__expected);
        });

        describe('* delete file data', () => {
            it('* files exist', async () => {
                const __given_appointment = new Appointment();
                __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                __given_appointment.hidden = false;
                __given_appointment.enrollments = [new Enrollment(), new Enrollment()];
                const file = new File();
                file.name = 'filename.txt';
                file.data = 'data';
                __given_appointment.files = [file];

                const __expected = {...__given_appointment};
                delete __expected.files[0].data;

                const __actual = (AppointmentMapper as any).basic(__given_appointment);
                expect(__actual).toEqual(__expected);
            });

            it('* files undefined', async () => {
                const __given_appointment = new Appointment();
                __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                __given_appointment.hidden = false;
                __given_appointment.enrollments = [new Enrollment(), new Enrollment()];

                const __expected = {...__given_appointment};

                const __actual = (AppointmentMapper as any).basic(__given_appointment);
                expect(__actual).toEqual(__expected);
            });
        });
    });

    describe('* stripAdministrator', () => {
        it('* administrators should just have attributes "name" and "preferred_username"', async () => {
            const __existing_admin = new User();
            __existing_admin.sub = 'f48de1b3-6900-4f0e-939b-78fec185b615';
            __existing_admin.preferred_username = 'admin';
            __existing_admin.name = 'Administrator';

            const __given_appointment = new Appointment();
            __given_appointment.administrators = [__existing_admin.sub];

            const __expected_admin = {
                preferred_username: __existing_admin.preferred_username,
                name: __existing_admin.name,
            };

            const __expected = [__expected_admin];

            const __actual = (AppointmentMapper as any).stripAdministrators(__given_appointment.administrators);
            expect(__actual).toEqual(__expected);
        });
    });

    describe('* enrolled by user', () => {
        it('* enrollment !created by any user should have attribute "isCreator: false"', async () => {
            const __existing_enrollment = new Enrollment();
            __existing_enrollment.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
            __existing_enrollment.name = 'owning user';

            const __given_appointment = new Appointment();
            __given_appointment.enrollments = [__existing_enrollment];

            const __expected_enrollment = {...__existing_enrollment};
            __expected_enrollment.createdByUser = false;

            const __expected = [__expected_enrollment];

            const __actual = (AppointmentMapper as any).enrolledByUser(__given_appointment.enrollments);
            expect(__actual).toEqual(__expected);
        });

        it('* enrollment created by user should have attribute "isCreator: true" and containing user information', async () => {
            const __existing_enrollment_creator = new User();
            __existing_enrollment_creator.sub = '96511a3c-cace-4a67-ad0c-436a37038c38';
            __existing_enrollment_creator.preferred_username = 'enrollment_creator';
            __existing_enrollment_creator.name = 'enrollment_creator_name';

            const __existing_enrollment = new Enrollment();
            __existing_enrollment.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
            __existing_enrollment.creator = __existing_enrollment_creator;

            const __given_appointment = new Appointment();
            __given_appointment.enrollments = [__existing_enrollment];

            const __expected_enrollment = {...__existing_enrollment};
            __expected_enrollment.creator = ({
                preferred_username: __existing_enrollment_creator.preferred_username,
                name: __existing_enrollment_creator.name,
            } as any);
            __expected_enrollment.createdByUser = true;

            const __expected = [__expected_enrollment];

            const __actual = (AppointmentMapper as any).enrolledByUser(__given_appointment.enrollments);
            expect(__actual).toEqual(__expected);
        });

    });

    it('* sort additions by order', () => {
        const __existing_addition_1 = new Addition();
        __existing_addition_1.id = '56fa2227-e93c-49fb-a834-fd07e82d64df';
        __existing_addition_1.name = 'addition1';
        __existing_addition_1.order = 0;

        const __existing_addition_2 = new Addition();
        __existing_addition_2.id = 'dc18989b-08bb-4d94-9b61-4b73af17aa51';
        __existing_addition_2.name = 'addition2';
        __existing_addition_2.order = 1;

        const __existing_addition_3 = new Addition();
        __existing_addition_3.id = 'cb51d10f-91aa-4bd0-96d0-6b26bd6a66e2';
        __existing_addition_3.name = 'addition3';
        __existing_addition_3.order = 2;

        const __given_appointment = new Appointment();
        __given_appointment.additions = [__existing_addition_2, __existing_addition_3, __existing_addition_1];

        const __expected = [__existing_addition_1, __existing_addition_2, __existing_addition_3];

        const __actual = (AppointmentMapper as any).sortAdditions(__given_appointment);
        expect(__actual.additions).toEqual(__expected);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});

// @ts-ignore
export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockReturnThis(),
    }))
}));

export type MockType<T> = {
    [P in keyof T]: jest.Mock<{}>;
};
