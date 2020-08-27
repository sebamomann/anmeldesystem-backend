import {Test, TestingModule} from '@nestjs/testing';
import {UserService} from '../user/user.service';
import {Repository} from 'typeorm';
import {User} from '../user/user.entity';
import {Addition} from '../addition/addition.entity';
import {Appointment} from './appointment.entity';
import {FileService} from '../file/file.service';
import {AdditionService} from '../addition/addition.service';
import {AppointmentService} from './appointment.service';
import {getRepositoryToken} from '@nestjs/typeorm';
import {File} from '../file/file.entity';
import {TelegramUser} from '../user/telegram/telegram-user.entity';
import {PasswordReset} from '../user/password-reset/password-reset.entity';
import {PasswordChange} from '../user/password-change/password-change.entity';
import {EmailChange} from '../user/email-change/email-change.entity';
import {MAILER_OPTIONS} from '@nest-modules/mailer/dist/constants/mailer-options.constant';
import {MailerService} from '@nest-modules/mailer';
import {AppointmentGateway} from './appointment.gateway';
import {Session} from '../user/session.entity';
import {Enrollment} from '../enrollment/enrollment.entity';
import {AppointmentMapper} from './appointment.mapper';

const crypto = require('crypto');

describe('AppointmentService', () => {
    let module: TestingModule;

    let appointmentService: AppointmentService;
    let appointmentGateway: AppointmentGateway;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [AppointmentService,
                UserService,
                AdditionService,
                FileService,
                MailerService,
                AppointmentGateway,
                {provide: getRepositoryToken(Appointment), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(User), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Session), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(File), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Addition), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(TelegramUser), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(PasswordReset), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(PasswordChange), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(EmailChange), useFactory: repositoryMockFactory},
                {
                    name: MAILER_OPTIONS,
                    provide: MAILER_OPTIONS,
                    useValue: {
                        transport: {
                            host: process.env.MAIL_HOST,
                            port: process.env.MAIL_PORT,
                            auth: {
                                user: process.env.MAIL_USERNAME,
                                pass: process.env.MAIL_PASSWORD
                            }
                        }
                    }
                },
            ],
        }).compile();

        appointmentService = module.get<AppointmentService>(AppointmentService);
        appointmentGateway = module.get<AppointmentGateway>(AppointmentGateway);
    });

    it('should be defined', () => {
        expect(appointmentService).toBeDefined();
    });

    describe('* permission', () => {
        describe('iat and lud inclusion', () => {
            it('* being creator should include', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_permissions = {};
                const __given_appointment = new Appointment();
                __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                __given_appointment.creator = __given_user;
                __given_appointment.lud = new Date(Date.now());
                __given_appointment.iat = new Date(Date.now());

                const __expected = __given_appointment;

                const __actual = AppointmentMapper.permission(__given_appointment, __given_user, __given_permissions);

                expect(__actual).toEqual(__expected);
            });

            it('* not being creator should not include', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_permissions = {};

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __given_appointment = new Appointment();
                __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                __given_appointment.creator = __existing_creator;
                __given_appointment.lud = new Date(Date.now());
                __given_appointment.iat = new Date(Date.now());

                const __expected = {...__given_appointment};
                delete __expected.iat;
                delete __expected.lud;

                const __actual = AppointmentMapper.permission(__given_appointment, __given_user, __given_permissions);

                expect(__actual).toEqual(__expected);
            });
        });

        describe('* hidden appointment', () => {
            it('* !(creator || admin) and no permissions should have empty enrollment list', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_permissions = {};

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __given_appointment = new Appointment();
                __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                __given_appointment.hidden = true;
                __given_appointment.creator = __existing_creator;
                __given_appointment.enrollments = [new Enrollment(), new Enrollment()];

                const __expected = {...__given_appointment};
                __expected.enrollments = [];

                const __actual = AppointmentMapper.permission(__given_appointment, __given_user, __given_permissions);
                expect(__actual).toEqual(__expected);
            });

            describe('* !(creator || admin) but correct permissions should have !empty enrollment list', () => {
                it('* one valid permission', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __given_appointment = new Appointment();
                    __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                    __given_appointment.hidden = true;
                    __given_appointment.creator = __existing_creator;

                    const __existing_enrollment_perm = new Enrollment();
                    __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                    __existing_enrollment_perm.name = 'owning user';

                    const __existing_enrollment_no_perm = new Enrollment();
                    __existing_enrollment_no_perm.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                    __existing_enrollment_no_perm.name = 'not owning user';

                    __given_appointment.enrollments = [__existing_enrollment_perm, __existing_enrollment_no_perm];

                    const token = crypto.createHash('sha256')
                        .update(__existing_enrollment_perm.id + process.env.SALT_ENROLLMENT)
                        .digest('hex');

                    const __given_permissions = {perm1: __existing_enrollment_perm.id, token};

                    const __expected = {...__given_appointment};
                    __expected.enrollments = [__existing_enrollment_perm];

                    const __actual = AppointmentMapper.permission(__given_appointment, __given_user, __given_permissions);
                    expect(__actual).toEqual(__expected);
                });

                it('* two valid permissions', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __given_appointment = new Appointment();
                    __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                    __given_appointment.hidden = true;
                    __given_appointment.creator = __existing_creator;

                    const __existing_enrollment_perm = new Enrollment();
                    __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                    __existing_enrollment_perm.name = 'owning user';

                    const __existing_enrollment_perm_2 = new Enrollment();
                    __existing_enrollment_perm_2.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                    __existing_enrollment_perm_2.name = 'not owning user';

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

                    const __expected = {...__given_appointment};
                    __expected.enrollments = [__existing_enrollment_perm, __existing_enrollment_perm_2];

                    const __actual = AppointmentMapper.permission(__given_appointment, __given_user, __given_permissions);
                    expect(__actual).toEqual(__expected);
                });

                describe('* one valid and one invalid permission', () => {
                    it('* invalid token', async () => {
                        const __given_user = new User();
                        __given_user.username = 'username';

                        const __existing_creator = new User();
                        __existing_creator.username = 'creator';

                        const __given_appointment = new Appointment();
                        __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                        __given_appointment.hidden = true;
                        __given_appointment.creator = __existing_creator;

                        const __existing_enrollment_perm = new Enrollment();
                        __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                        __existing_enrollment_perm.name = 'owning user';

                        const __existing_enrollment_perm_2 = new Enrollment();
                        __existing_enrollment_perm_2.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                        __existing_enrollment_perm_2.name = 'not owning user';

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

                        const __expected = {...__given_appointment};
                        __expected.enrollments = [__existing_enrollment_perm];

                        const __actual = AppointmentMapper.permission(__given_appointment, __given_user, __given_permissions);
                        expect(__actual).toEqual(__expected);
                    });

                    it('* non existing enrollment (id) but correct crresponding token', async () => {
                        const __given_user = new User();
                        __given_user.username = 'username';

                        const __existing_creator = new User();
                        __existing_creator.username = 'creator';

                        const __given_appointment = new Appointment();
                        __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                        __given_appointment.hidden = true;
                        __given_appointment.creator = __existing_creator;

                        const __existing_enrollment_perm = new Enrollment();
                        __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                        __existing_enrollment_perm.name = 'owning user';

                        const __existing_enrollment_perm_2 = new Enrollment();
                        __existing_enrollment_perm_2.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                        __existing_enrollment_perm_2.name = 'not owning user';

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

                        const __expected = {...__given_appointment};
                        __expected.enrollments = [__existing_enrollment_perm];

                        const __actual = AppointmentMapper.permission(__given_appointment, __given_user, __given_permissions);
                        expect(__actual).toEqual(__expected);
                    });
                });
            });

            it('* creator should see all enrollments', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_permissions = {};

                const __given_appointment = new Appointment();
                __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                __given_appointment.hidden = true;
                __given_appointment.creator = __given_user;
                __given_appointment.enrollments = [new Enrollment(), new Enrollment()];

                const __expected = {...__given_appointment};

                const __actual = AppointmentMapper.permission(__given_appointment, __given_user, __given_permissions);
                expect(__actual).toEqual(__expected);
            });

            it('* admin should see all enrollments', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_permissions = {};

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __given_appointment = new Appointment();
                __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                __given_appointment.hidden = true;
                __given_appointment.creator = __existing_creator;
                __given_appointment.administrators = [__given_user];
                __given_appointment.enrollments = [new Enrollment(), new Enrollment()];

                const __expected = {...__given_appointment};

                const __actual = AppointmentMapper.permission(__given_appointment, __given_user, __given_permissions);
                expect(__actual).toEqual(__expected);
            });
        });
    });

    describe('* slim', () => {
        it('* slim should remove enrollments', async () => {
            const __given_user = new User();
            __given_user.username = 'username';
            const __given_slim = true;

            const __existing_creator = new User();
            __existing_creator.username = 'creator';

            const __given_appointment = new Appointment();
            __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
            __given_appointment.hidden = false;
            __given_appointment.creator = __existing_creator;
            __given_appointment.enrollments = [new Enrollment(), new Enrollment()];
            __given_appointment.files = [new File(), new File()];

            const __expected = {...__given_appointment};
            delete __expected.enrollments;

            const __actual = AppointmentMapper.slim(__given_appointment, __given_slim);
            expect(__actual).toEqual(__expected);
        });

        it('* !slim should !remove enrollments', async () => {
            const __given_user = new User();
            __given_user.username = 'username';
            const __given_slim = false;

            const __existing_creator = new User();
            __existing_creator.username = 'creator';

            const __given_appointment = new Appointment();
            __given_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
            __given_appointment.hidden = false;
            __given_appointment.creator = __existing_creator;
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
            __existing_admin.id = 'f48de1b3-6900-4f0e-939b-78fec185b615';
            __existing_admin.username = 'admin';
            __existing_admin.name = 'Administrator';

            const __given_appointment = new Appointment();
            __given_appointment.administrators = [__existing_admin];
            __given_appointment.enrollments = [__existing_enrollment];

            const __expected_admin = new User();
            __expected_admin.username = __existing_admin.username;
            __expected_admin.name = __existing_admin.name;

            const __expected_enrollment = new Enrollment();
            __expected_enrollment.id = __existing_enrollment.id;
            __expected_enrollment.name = __existing_enrollment.name;
            __expected_enrollment.createdByUser = false;

            const __expected = {...__given_appointment};
            __expected.administrators = [__expected_admin];
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
        it('* administrators should just have attributes "name" and "username"', async () => {
            const __existing_admin = new User();
            __existing_admin.id = 'f48de1b3-6900-4f0e-939b-78fec185b615';
            __existing_admin.username = 'admin';
            __existing_admin.name = 'Administrator';

            const __given_appointment = new Appointment();
            __given_appointment.administrators = [__existing_admin];

            const __expected_admin = {
                username: __existing_admin.username,
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

        it('* enrollment created by any user should have attribute "isCreator: true"', async () => {
            const __existing_enrollment_creator = new User();
            __existing_enrollment_creator.id = '96511a3c-cace-4a67-ad0c-436a37038c38';
            __existing_enrollment_creator.username = 'enrollment_creator';

            const __existing_enrollment = new Enrollment();
            __existing_enrollment.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
            __existing_enrollment.name = 'owning user';
            __existing_enrollment.creator = __existing_enrollment_creator;

            const __given_appointment = new Appointment();
            __given_appointment.enrollments = [__existing_enrollment];

            const __expected_enrollment = {...__existing_enrollment};
            __expected_enrollment.createdByUser = true;
            delete __expected_enrollment.creator;

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
