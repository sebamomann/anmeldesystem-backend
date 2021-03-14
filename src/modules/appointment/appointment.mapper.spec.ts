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
import {instance, mock, when} from 'ts-mockito';
import {User} from '../user/user.model';
import {Administrator} from './administrator.entity';

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
            let mockedAppointment;
            let mockedAppointmentInstance;

            const mockedUser_creator_keycloak = mock(User);

            const permissions = {};

            beforeEach(() => {
                const mockedUser_creator = mock(User);
                mockedUserInstance_creator = instance(mockedUser_creator);
                mockedUserInstance_creator.sub = 'bdb9ee47-75d4-45f3-914a-4eef91439f4c';

                mockedAppointment = mock(Appointment);
                mockedAppointmentInstance = instance(mockedAppointment);
                mockedAppointmentInstance.iat = new Date(Date.now());
                mockedAppointmentInstance.lud = new Date(Date.now());
                mockedAppointmentInstance.creatorId = mockedUserInstance_creator.sub;
            });

            it('* creator should see information', async () => {
                // function mocking
                jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

                when(mockedAppointment.isCreator(mockedUserInstance_creator)).thenReturn(true);

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
                when(mockedAppointment.isCreator(mockedUserInstance_creator)).thenReturn(false);
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

            let mockedAppointment;
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

                mockedAppointment = mock(Appointment);
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
                when(mockedAppointment.isCreator(mockedUserInstance_creator)).thenReturn(false);
                when(mockedAppointment.isCreatorOrAdministrator(mockedUserInstance_creator)).thenReturn(false);
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
                    when(mockedAppointment.isCreator(mockedUserInstance_creator)).thenReturn(false);
                    when(mockedAppointment.isCreatorOrAdministrator(mockedUserInstance_creator)).thenReturn(false);
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
                    when(mockedAppointment.isCreator(mockedUserInstance_creator)).thenReturn(false);
                    when(mockedAppointment.isCreatorOrAdministrator(mockedUserInstance_creator)).thenReturn(false);
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

                        const tokenForPermission_invalid = 'INVALID_TOKEN';

                        const permissions = {
                            perm1: mockedEnrollmentInstance_1.id,
                            token1: tokenForPermission_valid,
                            perm2: mockedEnrollmentInstance_2.id,
                            token2: tokenForPermission_invalid
                        };

                        // function mocking
                        when(mockedAppointment.isCreator(mockedUserInstance_creator)).thenReturn(false);
                        when(mockedAppointment.isCreatorOrAdministrator(mockedUserInstance_creator)).thenReturn(false);
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

            it('* creator/admin should see all enrollments', async () => {
                const permissions = {};

                // function mocking
                when(mockedAppointment.isCreator(mockedUserInstance_creator)).thenReturn(false);
                when(mockedAppointment.isCreatorOrAdministrator(mockedUserInstance_creator)).thenReturn(true);
                jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

                const appointmentMapper = new AppointmentMapper(userService);
                const actual: Appointment = await appointmentMapper.permission(mockedAppointmentInstance, mockedUserInstance_creator, permissions);

                expect(actual.enrollments).toEqual([mockedEnrollmentInstance_1, mockedEnrollmentInstance_2]);
            });
        });
    });

    describe('* slim', () => {
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

        it('* true should remove enrollments', async () => {
            const slim = true;

            // function mocking
            jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

            const appointmentMapper = new AppointmentMapper(userService);
            const actual: Appointment = appointmentMapper.slim(mockedAppointmentInstance, slim);

            expect('enrollments' in actual).toBeFalsy();
        });

        it('* false should not remove enrollments', async () => {
            const slim = false;

            // function mocking
            jest.spyOn(userService, 'findById').mockResolvedValueOnce(mockedUser_creator_keycloak);

            const appointmentMapper = new AppointmentMapper(userService);
            const actual: Appointment = appointmentMapper.slim(mockedAppointmentInstance, slim);

            expect(actual.enrollments).toEqual([mockedEnrollmentInstance_1, mockedEnrollmentInstance_2]);
        });
    });

    describe('* basic', () => {
        let mockedUserInstance_requester;
        let mockedUserInstance_creator;
        let mockedAppointmentInstance;

        let mockedEnrollmentInstance_1;
        let mockedEnrollmentInstance_2;

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
            mockedAppointmentInstance.files = [];
        });

        it('* correctly strip enrollment creator', async () => {
            const orig = {...mockedAppointmentInstance};

            const appointmentMapper = new AppointmentMapper(userService);
            const actual = await appointmentMapper.basic(mockedAppointmentInstance);

            expect(actual.enrollments.length).toBe(orig.enrollments.length);
        });

        it('* correctly strip administrators', async () => {
            const mockedAdministrator_1 = mock(Administrator);
            const mockedAdministratorInstance_1 = instance(mockedAdministrator_1);
            mockedAdministratorInstance_1.userId =   '0a18ecf4-8168-4a06-b7bb-ec4b45bb70eb';

            const mockedAdministrator_2 = mock(Administrator);
            const mockedAdministratorInstance_2 = instance(mockedAdministrator_2);
            mockedAdministratorInstance_2.userId =   '480c1668-dba1-4bec-b85c-9de751eff21a';

            const mockedAdministrator_3 = mock(Administrator);
            const mockedAdministratorInstance_3 = instance(mockedAdministrator_3);
            mockedAdministratorInstance_3.userId =   'fe3b132c-4baa-4ff2-a7e1-8ace79cca158';

            mockedAppointmentInstance._administrators = [mockedAdministrator_1,mockedAdministrator_2,mockedAdministrator_3]

            const mockedUser1 = mock(User);
            const mockedUserInstance1 = instance(mockedUser1);
            mockedUserInstance1.preferred_username = 'username1';
            mockedUserInstance1.name = 'name1';

            const mockedUser2 = mock(User);
            const mockedUserInstance2 = instance(mockedUser2);
            mockedUserInstance2.preferred_username = 'username2';
            mockedUserInstance2.name = 'name2';

            const mockedUser3 = mock(User);
            const mockedUserInstance3 = instance(mockedUser3);
            mockedUserInstance3.preferred_username = 'username3';
            mockedUserInstance3.name = 'name3';

            jest.spyOn<any, any>(userService, 'findById')
                .mockResolvedValueOnce(mockedUserInstance1)
                .mockResolvedValueOnce(mockedUserInstance2)
                .mockResolvedValueOnce(mockedUserInstance3);

            const orig = {...mockedAppointmentInstance};

            const appointmentMapper = new AppointmentMapper(userService);
            const actual = await appointmentMapper.basic(mockedAppointmentInstance);

            expect(actual.administrators.length).toBe(orig._administrators.length);
            expect(userService.findById).toHaveBeenCalledTimes(orig._administrators.length);
            expect(userService.findById).toHaveBeenNthCalledWith(1, orig._administrators[0].userId);
            expect(userService.findById).toHaveBeenNthCalledWith(2, orig._administrators[1].userId);
            expect(userService.findById).toHaveBeenNthCalledWith(3, orig._administrators[2].userId);
            expect(actual.administrators).toEqual([
                {username: mockedUserInstance1.preferred_username, name: mockedUserInstance1.name},
                {username: mockedUserInstance2.preferred_username, name: mockedUserInstance2.name},
                {username: mockedUserInstance3.preferred_username, name: mockedUserInstance3.name},
            ]);
        });

        it('* enrollments undefined should be replaced by empty array', async () => {
            mockedAppointmentInstance.enrollments = undefined;

            const appointmentMapper = new AppointmentMapper(userService);
            const actual = await appointmentMapper.basic(mockedAppointmentInstance);

            expect(actual.enrollments).toEqual([]);
        });

        it('* administrators undefined should be replaced by empty array', async () => {
            mockedAppointmentInstance._administrators = undefined;

            const appointmentMapper = new AppointmentMapper(userService);
            const actual = await appointmentMapper.basic(mockedAppointmentInstance);

            expect(actual.administrators).toEqual([]);
        });

        describe('* strip files', () => {
            it('* should remove file (binary)', async () => {
                const mockedFile = mock(File);
                const mockedFileInstance = instance(mockedFile);
                mockedFileInstance.name = 'filename.txt';
                mockedFileInstance.data = 'data';

                mockedAppointmentInstance.files = [mockedFileInstance];

                const appointmentMapper = new AppointmentMapper(userService);
                const actual = await appointmentMapper.basic(mockedAppointmentInstance);

                const expected = {...mockedFileInstance};
                delete expected.data;

                expect(actual.files).toEqual([expected]);
            });

            it('* undefined files should be replaced by empty list', async () => {
                mockedAppointmentInstance.files = undefined;

                const appointmentMapper = new AppointmentMapper(userService);
                const actual = await appointmentMapper.basic(mockedAppointmentInstance);

                expect(actual.files).toEqual([]);
            });
        });

        it('* sort additions by order', async () => {
            const mockedAddition_1 = mock(Addition);
            const mockedAdditionInstance_1 = instance(mockedAddition_1);
            mockedAdditionInstance_1.id = '56fa2227-e93c-49fb-a834-fd07e82d64df';
            mockedAdditionInstance_1.name = 'addition1';
            mockedAdditionInstance_1.order = 0;

            const mockedAddition_2 = mock(Addition);
            const mockedAdditionInstance_2 = instance(mockedAddition_2);
            mockedAdditionInstance_2.id = 'dc18989b-08bb-4d94-9b61-4b73af17aa51';
            mockedAdditionInstance_2.name = 'addition2';
            mockedAdditionInstance_2.order = 1;

            const mockedAddition_3 = mock(Addition);
            const mockedAdditionInstance_3 = instance(mockedAddition_3);
            mockedAdditionInstance_3.id = 'cb51d10f-91aa-4bd0-96d0-6b26bd6a66e2';
            mockedAdditionInstance_3.name = 'addition3';
            mockedAdditionInstance_3.order = 2;

            mockedAppointmentInstance.additions = [mockedAdditionInstance_2, mockedAdditionInstance_3, mockedAdditionInstance_1];

            const appointmentMapper = new AppointmentMapper(userService);
            const actual = await appointmentMapper.basic(mockedAppointmentInstance);

            expect(actual.additions).toEqual([mockedAdditionInstance_1, mockedAdditionInstance_2, mockedAdditionInstance_3]);
        });
    });

    // describe('* stripAdministrator', () => {
    //     it('* administrators should just have attributes "name" and "preferred_username"', async () => {
    //         const __existing_admin = new User();
    //         __existing_admin.sub = 'f48de1b3-6900-4f0e-939b-78fec185b615';
    //         __existing_admin.preferred_username = 'admin';
    //         __existing_admin.name = 'Administrator';
    //
    //         const __given_appointment = new Appointment();
    //         __given_appointment._administrators = [__existing_admin.sub];
    //
    //         const __expected_admin = {
    //             preferred_username: __existing_admin.preferred_username,
    //             name: __existing_admin.name,
    //         };
    //
    //         const __expected = [__expected_admin];
    //
    //         const __actual = (AppointmentMapper as any).stripAdministrators(__given_appointment._administrators);
    //         expect(__actual).toEqual(__expected);
    //     });
    // });

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
