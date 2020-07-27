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
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {InvalidValuesException} from '../../exceptions/InvalidValuesException';
import {UnknownUserException} from '../../exceptions/UnknownUserException';
import {AppointmentGateway} from './appointment.gateway';
import {Session} from '../user/session.entity';
import {Enrollment} from '../enrollment/enrollment.entity';

const crypto = require('crypto');

describe('AppointmentService', () => {
    let module: TestingModule;

    let appointmentService: AppointmentService;
    let appointmentGateway: AppointmentGateway;

    let appointmentRepositoryMock: MockType<Repository<Appointment>>;
    let userRepositoryMock: MockType<Repository<User>>;
    let fileRepositoryMock: MockType<Repository<File>>;
    let additionRepositoryMock: MockType<Repository<Addition>>;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [AppointmentService,
                AppointmentGateway,
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

        appointmentRepositoryMock = module.get(getRepositoryToken(Appointment));
        userRepositoryMock = module.get(getRepositoryToken(User));
        fileRepositoryMock = module.get(getRepositoryToken(File));
        additionRepositoryMock = module.get(getRepositoryToken(Addition));
    });

    it('should be defined', () => {
        expect(appointmentService).toBeDefined();
    });

    describe('* is creator or administrator', () => {
        describe('* pass link', () => {
            describe('* should return true if successful', () => {
                it('* requesting as creator', async () => {
                    const __given_link = 'link';

                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.link = __given_link;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    const __actual = appointmentService.isCreatorOrAdministrator(__given_user, __given_link);
                    expect(__actual).toBeTruthy();
                });

                it('* requesting as administrator', async () => {
                    const __given_link = 'link';

                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creator = __existing_creator;
                    __existing_appointment.administrators = [__given_user];
                    __existing_appointment.link = __given_link;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    const __actual = appointmentService.isCreatorOrAdministrator(__given_user, __given_link);
                    expect(__actual).toBeTruthy();
                });

                it('* requesting as creator and administrator', async () => {
                    const __given_link = 'link';

                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.administrators = [__given_user];
                    __existing_appointment.link = __given_link;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    const __actual = appointmentService.isCreatorOrAdministrator(__given_user, __given_link);
                    expect(__actual).toBeTruthy();
                });
            });

            describe('* should return false if failed', () => {
                it('invalid appointment link provided', async () => {
                    const __given_link = 'nonExistantLink';

                    const __given_user = new User();
                    __given_user.username = 'username';

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    appointmentService
                        .isCreatorOrAdministrator(__given_user, __given_link)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                            expect(err.data).toBe('appointment');
                        });
                });
            });

            it('* not being creator or administrator', async () => {
                const __given_link = 'link';

                const __given_user = new User();
                __given_user.username = 'username';

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __existing_admin = new User();
                __existing_admin.username = 'admin';

                const __existing_appointment = new Appointment();
                __existing_appointment.creator = __existing_creator;
                __existing_appointment.administrators = [__existing_admin];
                __existing_appointment.link = __given_link;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                const __actual = await appointmentService.isCreatorOrAdministrator(__given_user, __given_link);
                expect(__actual).toBeFalsy();
            });
        });

        describe('* pass appointment object', () => {
            describe('* should return true if successful', () => {
                it('* requesting as creator', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creator = __given_user;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    const __actual = appointmentService.isCreatorOrAdministrator(__given_user, __existing_appointment);
                    expect(__actual).toBeTruthy();
                });

                it('* requesting as administrator', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creator = __existing_creator;
                    __existing_appointment.administrators = [__given_user];

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    const __actual = appointmentService.isCreatorOrAdministrator(__given_user, __existing_appointment);
                    expect(__actual).toBeTruthy();
                });

                it('* requesting as creator and administrator', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.administrators = [__given_user];

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    const __actual = appointmentService.isCreatorOrAdministrator(__given_user, __existing_appointment);
                    expect(__actual).toBeTruthy();
                });
            });

            describe('* should return false if failed', () => {
                it('* not being creator or administrator', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __existing_admin = new User();
                    __existing_admin.username = 'admin';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creator = __existing_creator;
                    __existing_appointment.administrators = [__existing_admin];

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    const __actual = await appointmentService.isCreatorOrAdministrator(__given_user, __existing_appointment);
                    expect(__actual).toBeFalsy();
                });
            });
        });
    });

    describe('* find appointment', () => {
        describe('* by link', () => {
            it('* successful should return appointment object', async () => {
                const __given_link = 'link';

                const __existing_appointment = new Appointment();
                __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                __existing_appointment.link = __given_link;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                const __expected = __existing_appointment;
                __expected.reference = [];

                const __actual = await appointmentService.findByLink(__given_link);
                expect(__actual).toEqual(__expected);
            });

            describe('* failure should return error', () => {
                it('* appointment not found', async () => {
                    const __given_link = 'link';

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    appointmentService.findByLink(__given_link)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                            expect(err.data).toBe('appointment');
                        });
                });
            });
        });
    });

    describe('* get appointment', () => {
        describe('* should return appointment object if successful', () => {
            it('* having no reference to the appointment', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_link = 'link';
                const __given_permissions = {};
                const __given_slim = false;

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __existing_appointment = new Appointment();
                __existing_appointment.creator = __existing_creator;

                appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);
                expect(__actual).toEqual(__existing_appointment);
            });

            describe('iat and lud inclusion', () => {
                it('* being creator should include', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_permissions = {};
                    const __given_slim = false;

                    const __existing_appointment = new Appointment();
                    __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.lud = new Date(Date.now());
                    __existing_appointment.iat = new Date(Date.now());

                    appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                    const __expected = {...__existing_appointment};
                    __expected.reference = ['CREATOR'];

                    const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);

                    expect(__actual).toEqual(__expected);
                });

                it('* not being creator should not include', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_permissions = {};
                    const __given_slim = false;

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                    __existing_appointment.creator = __existing_creator;
                    __existing_appointment.lud = new Date(Date.now());
                    __existing_appointment.iat = new Date(Date.now());

                    appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                    const __expected = {...__existing_appointment};
                    delete __expected.iat;
                    delete __expected.lud;
                    __expected.reference = [];

                    const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);

                    expect(__actual).toEqual(__expected);
                });
            });

            describe('* hidden appointment', () => {
                it('* !(creator || admin) and no permissions should have empty enrollment list', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_permissions = {};
                    const __given_slim = false;

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                    __existing_appointment.hidden = true;
                    __existing_appointment.creator = __existing_creator;
                    __existing_appointment.enrollments = [new Enrollment(), new Enrollment()];

                    appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                    const __expected = {...__existing_appointment};
                    __expected.enrollments = [];

                    const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);
                    expect(__actual).toEqual(__expected);
                });

                describe('* !(creator || admin) but correct permissions should have !empty enrollment list', () => {
                    it('* one valid permission', async () => {
                        const __given_user = new User();
                        __given_user.username = 'username';
                        const __given_link = 'link';
                        const __given_slim = false;

                        const __existing_creator = new User();
                        __existing_creator.username = 'creator';

                        const __existing_appointment = new Appointment();
                        __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                        __existing_appointment.hidden = true;
                        __existing_appointment.creator = __existing_creator;

                        const __existing_enrollment_perm = new Enrollment();
                        __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                        __existing_enrollment_perm.name = 'owning user';

                        const __existing_enrollment_no_perm = new Enrollment();
                        __existing_enrollment_no_perm.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                        __existing_enrollment_no_perm.name = 'not owning user';

                        __existing_appointment.enrollments = [__existing_enrollment_perm, __existing_enrollment_no_perm];

                        const token = crypto.createHash('sha256')
                            .update(__existing_enrollment_perm.id + process.env.SALT_ENROLLMENT)
                            .digest('hex');

                        const __given_permissions = {perm1: __existing_enrollment_perm.id, token};

                        appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                        const __expected = {...__existing_appointment};
                        __expected.enrollments = [__existing_enrollment_perm];

                        const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);
                        expect(__actual).toEqual(__expected);
                    });

                    it('* two valid permissions', async () => {
                        const __given_user = new User();
                        __given_user.username = 'username';
                        const __given_link = 'link';
                        const __given_slim = false;

                        const __existing_creator = new User();
                        __existing_creator.username = 'creator';

                        const __existing_appointment = new Appointment();
                        __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                        __existing_appointment.hidden = true;
                        __existing_appointment.creator = __existing_creator;

                        const __existing_enrollment_perm = new Enrollment();
                        __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                        __existing_enrollment_perm.name = 'owning user';

                        const __existing_enrollment_perm_2 = new Enrollment();
                        __existing_enrollment_perm_2.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                        __existing_enrollment_perm_2.name = 'not owning user';

                        __existing_appointment.enrollments = [__existing_enrollment_perm, __existing_enrollment_perm_2];

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

                        appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                        const __expected = {...__existing_appointment};
                        __expected.enrollments = [__existing_enrollment_perm, __existing_enrollment_perm_2];

                        const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);
                        expect(__actual).toEqual(__expected);
                    });

                    describe('* one valid and one invalid permission', () => {
                        it('* invalid token', async () => {
                            const __given_user = new User();
                            __given_user.username = 'username';
                            const __given_link = 'link';
                            const __given_slim = false;

                            const __existing_creator = new User();
                            __existing_creator.username = 'creator';

                            const __existing_appointment = new Appointment();
                            __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                            __existing_appointment.hidden = true;
                            __existing_appointment.creator = __existing_creator;

                            const __existing_enrollment_perm = new Enrollment();
                            __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                            __existing_enrollment_perm.name = 'owning user';

                            const __existing_enrollment_perm_2 = new Enrollment();
                            __existing_enrollment_perm_2.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                            __existing_enrollment_perm_2.name = 'not owning user';

                            __existing_appointment.enrollments = [__existing_enrollment_perm, __existing_enrollment_perm_2];

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

                            appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                            const __expected = {...__existing_appointment};
                            __expected.enrollments = [__existing_enrollment_perm];

                            const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);
                            expect(__actual).toEqual(__expected);
                        });

                        it('* non existing enrollment (id) but correct crresponding token', async () => {
                            const __given_user = new User();
                            __given_user.username = 'username';
                            const __given_link = 'link';
                            const __given_slim = false;

                            const __existing_creator = new User();
                            __existing_creator.username = 'creator';

                            const __existing_appointment = new Appointment();
                            __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                            __existing_appointment.hidden = true;
                            __existing_appointment.creator = __existing_creator;

                            const __existing_enrollment_perm = new Enrollment();
                            __existing_enrollment_perm.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                            __existing_enrollment_perm.name = 'owning user';

                            const __existing_enrollment_perm_2 = new Enrollment();
                            __existing_enrollment_perm_2.id = '507b1d1a-1f03-4927-bfad-babfa90ca6a6';
                            __existing_enrollment_perm_2.name = 'not owning user';

                            __existing_appointment.enrollments = [__existing_enrollment_perm, __existing_enrollment_perm_2];

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

                            appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                            const __expected = {...__existing_appointment};
                            __expected.enrollments = [__existing_enrollment_perm];

                            const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);
                            expect(__actual).toEqual(__expected);
                        });
                    });
                });

                it('* creator should see all enrollments', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_permissions = {};
                    const __given_slim = false;

                    const __existing_appointment = new Appointment();
                    __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                    __existing_appointment.hidden = true;
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.enrollments = [new Enrollment(), new Enrollment()];

                    appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                    const __expected = {...__existing_appointment};
                    __expected.reference = ['CREATOR'];

                    const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);
                    expect(__actual).toEqual(__expected);
                });

                it('*admin should see all enrollments', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_permissions = {};
                    const __given_slim = false;

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                    __existing_appointment.hidden = true;
                    __existing_appointment.creator = __existing_creator;
                    __existing_appointment.administrators = [__given_user];
                    __existing_appointment.enrollments = [new Enrollment(), new Enrollment()];

                    appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                    const __expected = {...__existing_appointment};
                    __expected.reference = ['ADMIN'];

                    const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);
                    expect(__actual).toEqual(__expected);
                });
            });

            it('* slim should remove files and enrollments', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_link = 'link';
                const __given_permissions = {};
                const __given_slim = true;

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __existing_appointment = new Appointment();
                __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                __existing_appointment.hidden = false;
                __existing_appointment.creator = __existing_creator;
                __existing_appointment.enrollments = [new Enrollment(), new Enrollment()];
                __existing_appointment.files = [new File(), new File()];

                appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                const __expected = {...__existing_appointment};
                delete __expected.enrollments;
                delete __expected.files;

                const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);
                expect(__actual).toEqual(__expected);
            });

            it('* administrators should just have attributes "name" and "username"', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_link = 'link';
                const __given_permissions = {};
                const __given_slim = false;

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __existing_admin = new User();
                __existing_admin.id = 'f48de1b3-6900-4f0e-939b-78fec185b615';
                __existing_admin.username = 'admin';
                __existing_admin.name = 'Administrator';

                const __existing_appointment = new Appointment();
                __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                __existing_appointment.hidden = false;
                __existing_appointment.creator = __existing_creator;
                __existing_appointment.administrators = [__existing_admin];

                appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                const __expected = {...__existing_appointment};
                const __expected_admin = new User();
                __expected_admin.name = __existing_admin.name;
                __expected_admin.username = __existing_admin.username;
                __expected.administrators = [__expected_admin];

                const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);
                expect(__actual).toEqual(__expected);
            });

            it('* enrollment !created by any user should have attribute "isCreator: false"', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_link = 'link';
                const __given_slim = false;
                const __given_permissions = {};

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __existing_appointment = new Appointment();
                __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                __existing_appointment.hidden = false;
                __existing_appointment.creator = __existing_creator;

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                __existing_enrollment.name = 'owning user';

                __existing_appointment.enrollments = [__existing_enrollment];

                appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                const __expected_enrollment = {...__existing_enrollment};
                __expected_enrollment.createdByUser = false;

                const __expected = {...__existing_appointment};
                __expected.enrollments = [__expected_enrollment];

                const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);
                expect(__actual).toEqual(__expected);
            });

            it('* enrollment created by any user should have attribute "isCreator: true"', async () => {
                const __given_user = new User();
                __given_user.id = '7f4147ed-495a-4971-a970-8e5f86795a50';
                __given_user.username = 'username';
                const __given_link = 'link';
                const __given_slim = false;
                const __given_permissions = {};

                const __existing_enrollment_creator = new User();
                __existing_enrollment_creator.id = '96511a3c-cace-4a67-ad0c-436a37038c38';
                __existing_enrollment_creator.username = 'enrollment_creator';

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __existing_appointment = new Appointment();
                __existing_appointment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';
                __existing_appointment.hidden = false;
                __existing_appointment.creator = __existing_creator;

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
                __existing_enrollment.name = 'owning user';
                __existing_enrollment.creator = __existing_enrollment_creator;

                __existing_appointment.enrollments = [__existing_enrollment];

                appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                const __expected_enrollment = {...__existing_enrollment};
                __expected_enrollment.createdByUser = true;
                delete __expected_enrollment.creator;

                const __expected = {...__existing_appointment};
                __expected.enrollments = [__expected_enrollment];

                const __actual = await appointmentService.get(__given_user, __given_link, __given_permissions, __given_slim);
                expect(__actual).toEqual(__expected);
            });
        });

        describe('* failure should return error', () => {
            it('* appointment not found', async () => {
                const __given_user = new User();
                __given_user.id = '7f4147ed-495a-4971-a970-8e5f86795a50';
                __given_user.username = 'username';
                const __given_link = 'link';
                const __given_slim = false;
                const __given_permissions = {};

                const __existing_appointment = undefined;

                appointmentRepositoryMock.findOne.mockReturnValue(__existing_appointment);

                appointmentService
                    .get(__given_user, __given_link, __given_permissions, __given_slim)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toBe('appointment');
                    });
            });
        });
    });

    describe('* create appointment', () => {
        describe('* successful should return created entity', () => {
            describe('* link handling', () => {
                it('* link specified', async () => {
                    const __given_appointment = new Appointment();
                    __given_appointment.link = 'unusedLink';

                    const __given_user = new User();
                    __given_user.username = 'username';

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // cant find appointment with specific link
                    appointmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                    const __actual = await appointmentService.create(__given_appointment, __given_user);
                    expect(__actual.link).toEqual(__given_appointment.link);
                });

                describe('* link not specified', () => {
                    it('* empty', async () => {
                        const __given_appointment = new Appointment();
                        __given_appointment.link = '';

                        const __given_user = new User();
                        __given_user.username = 'username';

                        appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // cant find appointment with specific link
                        appointmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                        const __actual = await appointmentService.create(__given_appointment, __given_user);
                        expect(__actual.link).toMatch(/^[A-Za-z0-9]{5}$/);
                    });

                    it('* undefined', async () => {
                        const __given_appointment = new Appointment();

                        const __given_user = new User();
                        __given_user.username = 'username';

                        appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // cant find appointment with specific link
                        appointmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                        const __actual = await appointmentService.create(__given_appointment, __given_user);
                        expect(__actual.link).toMatch(/^[A-Za-z0-9]{5}$/);
                    });
                });
            });

            describe('* enrollment limit handling', () => {
                it('* valid limit set', async () => {
                    const __given_appointment = new Appointment();
                    __given_appointment.maxEnrollments = 10;

                    const __given_user = new User();
                    __given_user.username = 'username';

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // cant find appointment with specific link
                    appointmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                    const __actual = await appointmentService.create(__given_appointment, __given_user);
                    expect(__actual.maxEnrollments).toEqual(__given_appointment.maxEnrollments);
                });

                describe('* no limit should set limit to null', () => {
                    it('* limit < min boundary', async () => {
                        const __given_appointment = new Appointment();
                        __given_appointment.maxEnrollments = 0;

                        const __given_user = new User();
                        __given_user.username = 'username';

                        appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // cant find appointment with specific link
                        appointmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                        const __actual = await appointmentService.create(__given_appointment, __given_user);
                        expect(__actual.maxEnrollments).toEqual(null);
                    });

                    it('* limit undefined', async () => {
                        const __given_appointment = new Appointment();

                        const __given_user = new User();
                        __given_user.username = 'username';

                        appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // cant find appointment with specific link
                        appointmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                        const __actual = await appointmentService.create(__given_appointment, __given_user);
                        expect(__actual.maxEnrollments).toEqual(null);
                    });
                });
            });

            describe('* addition handling', () => {
                it('* add (2) additions', async () => {
                    const __given_addition_1 = new Addition();
                    __given_addition_1.name = 'addition1';
                    const __given_addition_2 = new Addition();
                    __given_addition_2.name = 'addition2';

                    const __given_appointment = new Appointment();
                    __given_appointment.additions = [
                        __given_addition_1,
                        __given_addition_2
                    ];

                    const __given_user = new User();
                    __given_user.username = 'username';

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // link not in use
                    appointmentRepositoryMock.save.mockImplementation((val) => val);

                    additionRepositoryMock.save.mockImplementation((val) => val);

                    const __actual = await appointmentService.create(__given_appointment, __given_user);
                    expect(__actual.additions).toHaveLength(2);
                    expect(__actual.additions.sort()).toEqual([__given_addition_1, __given_addition_2].sort());
                });

                it('add additions correctly (2) - remove duplicates (1)', async () => {
                    const __given_addition_1 = new Addition();
                    __given_addition_1.name = 'addition';
                    const __given_addition_2 = new Addition();
                    __given_addition_2.name = 'addition';

                    const __given_appointment = new Appointment();
                    __given_appointment.additions = [
                        __given_addition_1,
                        __given_addition_2
                    ];

                    const __given_user = new User();
                    __given_user.username = 'username';

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // link not in use
                    appointmentRepositoryMock.save.mockImplementation((val) => val);

                    additionRepositoryMock.save.mockImplementation((val) => val);

                    const __actual = await appointmentService.create(__given_appointment, __given_user);
                    expect(__actual.additions).toHaveLength(1);
                    expect(__actual.additions).toEqual([__given_addition_1]);
                });
            });
        });

        describe('* failure should return error', () => {
            it('* specified link in use', async () => {
                const __existing_appointment = new Appointment();
                __existing_appointment.link = 'link';

                const __given_appointment = new Appointment();
                __given_appointment.link = __existing_appointment.link;

                const __given_user = new User();
                __given_user.username = 'username';

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                appointmentService.create(__given_appointment, __given_user)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have returned DuplicateValueException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(DuplicateValueException);
                        expect(err.data).toEqual(['link']);
                    });
            });

            it('* deadline date after actual date', async () => {
                const __given_appointment = new Appointment();
                __given_appointment.date = new Date(Date.now() + (3 * 60 * 60 * 2000));
                __given_appointment.deadline = new Date(Date.now() + (4 * 60 * 60 * 2000));

                const __given_user = new User();
                __given_user.username = 'username';

                appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                appointmentService
                    .create(__given_appointment, __given_user)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have returned InvalidValuesException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(InvalidValuesException);
                        expect(err.data).toEqual(['date']);
                    });
            });
        });
    });

    describe('* update appointment', () => {
        describe('* successful should return updated entity', () => {
            describe('* update additions', () => {
                it('* add (1) to (2)', async () => {
                    const __given_user = new User();

                    const __existing_addition_1 = new Addition();
                    __existing_addition_1.id = 'id1';
                    __existing_addition_1.name = 'addition1';
                    const __existing_addition_2 = new Addition();
                    __existing_addition_2.id = 'id2';
                    __existing_addition_2.name = 'addition2';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.additions = [__existing_addition_1, __existing_addition_2];

                    const __given_appointment_change_addition = new Addition();
                    __given_appointment_change_addition.name = 'addition3';
                    const __given_appointment_change_data = {
                        additions: [
                            __existing_addition_1,
                            __existing_addition_2,
                            __given_appointment_change_addition
                        ]
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    additionRepositoryMock.findOne.mockReturnValueOnce(__existing_addition_1); // addition 1 exists
                    additionRepositoryMock.findOne.mockReturnValueOnce(__existing_addition_2); // addition 2 exists
                    additionRepositoryMock.findOne.mockReturnValueOnce(undefined); // addition 3 doesnt exist

                    const createdAdditionId = '3';

                    additionRepositoryMock.save.mockImplementation((val) => {
                        val.id = createdAdditionId;
                        return val;
                    });

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __expected_addition_3 = {...__given_appointment_change_addition};
                    __expected_addition_3.id = createdAdditionId;

                    const __expected = [__existing_addition_1, __existing_addition_2, __expected_addition_3];

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.additions).toHaveLength(3);
                    expect(__actual.additions.sort()).toEqual(__expected);
                });

                it('* add (1) to (2) - duplicate name', async () => {
                    const __given_user = new User();

                    const __existing_addition_1 = new Addition();
                    __existing_addition_1.id = 'id1';
                    __existing_addition_1.name = 'addition1';
                    const __existing_addition_2 = new Addition();
                    __existing_addition_2.id = 'id2';
                    __existing_addition_2.name = 'TAKENNAME';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.additions = [__existing_addition_1, __existing_addition_2];

                    const __given_appointment_change_addition = new Addition();
                    __given_appointment_change_addition.name = 'TAKENNAME';
                    const __given_appointment_change_data = {
                        additions: [
                            __existing_addition_1,
                            __existing_addition_2,
                            __given_appointment_change_addition
                        ]
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    additionRepositoryMock.findOne.mockReturnValueOnce(__existing_addition_1); // addition 1 exists
                    additionRepositoryMock.findOne.mockReturnValueOnce(__existing_addition_2); // addition 2 exists
                    additionRepositoryMock.findOne.mockReturnValueOnce(__existing_addition_2); // addition 3 doesnt exist

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __expected = [__existing_addition_1, __existing_addition_2];

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.additions).toHaveLength(2);
                    expect(__actual.additions.sort()).toEqual(__expected);
                });

                it('* remove (1) from (2)', async () => {
                    const __given_user = new User();

                    const __existing_addition_1 = new Addition();
                    __existing_addition_1.id = 'id1';
                    __existing_addition_1.name = 'addition1';
                    const __existing_addition_2 = new Addition();
                    __existing_addition_2.id = 'id2';
                    __existing_addition_2.name = 'addition2';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.additions = [__existing_addition_1, __existing_addition_2];

                    const __given_appointment_change_data = {
                        additions: [
                            __existing_addition_1,
                        ]
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    additionRepositoryMock.findOne.mockReturnValueOnce(__existing_addition_1); // addition 1 exists

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __expected = [__existing_addition_1];

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.additions).toHaveLength(1);
                    expect(__actual.additions.sort()).toEqual(__expected);
                });
            });

            it('* update link', async () => {
                const __given_user = new User();

                const __existing_appointment = new Appointment();
                __existing_appointment.link = 'link';
                __existing_appointment.creator = __given_user;

                const __given_appointment_change_data = {
                    link: 'newLink'
                };

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // new link not in use

                appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                    return;
                });

                const __expected = __given_appointment_change_data.link;

                const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                expect(__actual.link).toEqual(__expected);
            });

            describe('* update dates', () => {
                it('* update date', async () => {
                    const __given_user = new User();

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.date = new Date(Date.now() + (3 * 60 * 60 * 1000));
                    __existing_appointment.deadline = new Date(Date.now() + (2 * 60 * 60 * 1000));

                    const __given_appointment_change_data = {
                        date: new Date(Date.now() + (5 * 60 * 60 * 1000))
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __expected = __given_appointment_change_data.date;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.date).toEqual(__expected);
                });

                it('* update deadline', async () => {
                    const __given_user = new User();

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.date = new Date(Date.now() + (3 * 60 * 60 * 1000));
                    __existing_appointment.deadline = new Date(Date.now() + (2 * 60 * 60 * 1000));

                    const __given_appointment_change_data = {
                        deadline: new Date(Date.now() + (2.5 * 60 * 60 * 1000))
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __expected = __given_appointment_change_data.deadline;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.deadline).toEqual(__expected);
                });
            });

            describe('* update direct attributes', () => {
                it('* update title', async () => {
                    const __given_user = new User();

                    const __existing_appointment = new Appointment();
                    __existing_appointment.title = 'title';
                    __existing_appointment.link = 'link';
                    __existing_appointment.creator = __given_user;

                    const __given_appointment_change_data = {
                        title: 'newTitle'
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __expected = __given_appointment_change_data.title;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.title).toEqual(__expected);
                });

                it('* update description', async () => {
                    const __given_user = new User();

                    const __existing_appointment = new Appointment();
                    __existing_appointment.description = 'description';
                    __existing_appointment.link = 'link';
                    __existing_appointment.creator = __given_user;

                    const __given_appointment_change_data = {
                        description: 'newDescription'
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __expected = __given_appointment_change_data.description;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.description).toEqual(__expected);
                });

                it('* update location', async () => {
                    const __given_user = new User();

                    const __existing_appointment = new Appointment();
                    __existing_appointment.location = 'location';
                    __existing_appointment.link = 'link';
                    __existing_appointment.creator = __given_user;

                    const __given_appointment_change_data = {
                        location: 'newLocation'
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __expected = __given_appointment_change_data.location;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.location).toEqual(__expected);
                });

                it('* update hidden', async () => {
                    const __given_user = new User();

                    const __existing_appointment = new Appointment();
                    __existing_appointment.hidden = false;
                    __existing_appointment.link = 'link';
                    __existing_appointment.creator = __given_user;

                    const __given_appointment_change_data = {
                        hidden: true
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __expected = __given_appointment_change_data.hidden;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.hidden).toEqual(__expected);
                });

                it('* update driverAddition', async () => {
                    const __given_user = new User();

                    const __existing_appointment = new Appointment();
                    __existing_appointment.driverAddition = false;
                    __existing_appointment.link = 'link';
                    __existing_appointment.creator = __given_user;

                    const __given_appointment_change_data = {
                        driverAddition: true
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __expected = __given_appointment_change_data.driverAddition;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.driverAddition).toEqual(__expected);
                });
            });

            it('* update non existing attribute', async () => {
                const __given_user = new User();

                const __existing_appointment = new Appointment();
                __existing_appointment.link = 'link';
                __existing_appointment.creator = __given_user;
                __existing_appointment.administrators = [];

                const __given_appointment_change_data = {
                    invalid: 'attribute'
                };

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                    return;
                });

                const __expected = __existing_appointment;

                const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                expect(__actual).toEqual(__expected);
            });
        });

        describe('* failure should return error', () => {
            it('appointment not found', async () => {
                const __given_user = new User();

                const __existing_appointment = new Appointment();
                __existing_appointment.link = 'link';
                __existing_appointment.creator = __given_user;

                const __given_appointment_change_data = {
                    link: 'newLink'
                };

                appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // appointment not found

                appointmentService
                    .update(__given_appointment_change_data, __existing_appointment.link, __given_user)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toBe('appointment');
                    });
            });

            it('* no permissions', async () => {
                const __given_user = new User();
                __given_user.username = 'username';

                const __existing_creator = new User();
                __existing_creator.username = 'creator';

                const __existing_appointment = new Appointment();
                __existing_appointment.link = 'link';
                __existing_appointment.creator = __existing_creator;
                __existing_appointment.administrators = [];

                const __given_appointment_change_data = {
                    link: 'newLink'
                };

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                appointmentService
                    .update(__given_appointment_change_data, __existing_appointment.link, __given_user)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an InsufficientPermissionsException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(InsufficientPermissionsException);
                    });
            });

            it('* link in use', async () => {
                const __given_user = new User();
                __given_user.username = 'username';

                const __existing_appointment = new Appointment();
                __existing_appointment.link = 'link';
                __existing_appointment.creator = __given_user;
                __existing_appointment.administrators = [];

                const __existing_appointment_2 = new Appointment();
                __existing_appointment_2.link = 'existingLink';

                const __given_appointment_change_data = {
                    link: 'existingLink'
                };

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment_2); // new link in use

                appointmentService
                    .update(__given_appointment_change_data, __existing_appointment.link, __given_user)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an DuplicateValueException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(DuplicateValueException);
                        expect(err.data).toEqual(['link']);
                    });
            });

            describe('* date changes', () => {
                it('* date before deadline', async () => {
                    const __given_user = new User();

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.date = new Date(Date.now() + (4 * 60 * 60 * 1000));
                    __existing_appointment.deadline = new Date(Date.now() + (3 * 60 * 60 * 1000));

                    const __given_appointment_change_data = {
                        date: new Date(Date.now() + (2 * 60 * 60 * 1000))
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentService
                        .update(__given_appointment_change_data, __existing_appointment.link, __given_user)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have gotten an InvalidValuesException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(InvalidValuesException);
                            expect(err.data).toEqual(['date']);
                        });
                });

                it('* deadline after date', async () => {
                    const __given_user = new User();

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.date = new Date(Date.now() + (4 * 60 * 60 * 1000));
                    __existing_appointment.deadline = new Date(Date.now() + (3 * 60 * 60 * 1000));

                    const __given_appointment_change_data = {
                        deadline: new Date(Date.now() + (5 * 60 * 60 * 1000))
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentService
                        .update(__given_appointment_change_data, __existing_appointment.link, __given_user)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have gotten an InvalidValuesException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(InvalidValuesException);
                            expect(err.data).toEqual(['deadline']);
                        });
                });
            });
        });
    });

    describe('* handle administrators', () => {
        describe('* add', () => {
            it('* successful should return updated entity', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_link = 'link';
                const __given_username = 'admin_to_be';

                const __existing_user = new User();
                __existing_user.username = __given_username;

                const __existing_appointment = new Appointment();
                __existing_appointment.creator = __given_user;
                __existing_appointment.administrators = [];

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user); // check if admin to actually exsists

                appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                const __expected = {...__existing_appointment};
                __expected.administrators = [__existing_user];

                const __actual = await appointmentService.addAdministrator(__given_user, __given_link, __given_username);
                expect(__actual).toEqual(__expected);
            });

            describe('* failure should return error', () => {
                it('* appointment not found', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_username = 'admin_to_be';

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    appointmentService
                        .addAdministrator(__given_user, __given_link, __given_username)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityNotFoundException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                            expect(err.data).toEqual('appointment');
                        });
                });

                it('* insufficient permissions', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_username = 'admin_to_be';

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creator = __existing_creator;
                    __existing_appointment.administrators = [];

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentService
                        .addAdministrator(__given_user, __given_link, __given_username)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned InsufficientPermissionsException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(InsufficientPermissionsException);
                        });
                });

                it('* admin to be not found by username', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_username = 'admin_to_be';

                    const __existing_user = new User();
                    __existing_user.username = __given_username;

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.administrators = [];

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined); // check if admin to actually exsists

                    appointmentService
                        .addAdministrator(__given_user, __given_link, __given_username)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned UnknownUserException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(UnknownUserException);
                            expect(err.data).toBe(__existing_user.username);
                        });
                });
            });
        });

        describe('* remove', () => {
            it('* successful should return updated entity', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_link = 'link';
                const __given_username = 'admin_to_remove';

                const __existing_user = new User();
                __existing_user.username = __given_username;

                const __existing_appointment = new Appointment();
                __existing_appointment.creator = __given_user;
                __existing_appointment.administrators = [__existing_user];

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user); // check if admin to actually exsists

                appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                const __expected = {...__existing_appointment};
                __expected.administrators = [];

                const __actual = await appointmentService
                    .removeAdministrator(__given_user, __given_link, __given_username);
                expect(__actual).toEqual(__expected);
            });

            describe('* failure should return error', () => {
                it('* appointment not found', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_username = 'admin_to_remove';

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    appointmentService
                        .removeAdministrator(__given_user, __given_link, __given_username)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityNotFoundException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                            expect(err.data).toEqual('appointment');
                        });
                });

                it('* insufficient permissions', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_username = 'admin_to_remove';

                    const __existing_user = new User();
                    __existing_user.username = __given_username;

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creator = __existing_creator;
                    __existing_appointment.administrators = [__existing_user];

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentService
                        .removeAdministrator(__given_user, __given_link, __given_username)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned InsufficientPermissionsException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(InsufficientPermissionsException);
                        });
                });
            });
        });
    });

    describe('* handle files', () => {
        describe('* add', () => {
            it('* successful should return updated entity', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_link = 'link';
                const __given_data = {name: 'name.txt', data: '123'};

                const __existing_appointment = new Appointment();
                __existing_appointment.creator = __given_user;
                __existing_appointment.files = [];

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                fileRepositoryMock.save.mockImplementationOnce((val) => val);

                appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                    return;
                });

                const __expected_file = new File();
                __expected_file.name = __given_data.name;
                __expected_file.data = __given_data.data;

                const __expected = {...__existing_appointment};
                __expected.files = [__expected_file];

                const __actual = await appointmentService.addFile(__given_user, __given_link, __given_data);
                expect(__actual).toEqual(__expected);
            });

            describe('* failure should return error', () => {
                it('* appointment not found', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_data = {name: 'name.txt', data: '123'};

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    appointmentService.addFile(__given_user, __given_link, __given_data)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityNotFoundException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                            expect(err.data).toEqual('appointment');
                        });
                });

                it('* insufficient permissions', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_data = {name: 'name.txt', data: '123'};

                    const __existing_user = new User();
                    __existing_user.username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creator = __existing_user;
                    __existing_appointment.files = [];

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                    fileRepositoryMock.save.mockImplementationOnce((val) => val);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __expected_file = new File();
                    __expected_file.name = __given_data.name;
                    __expected_file.data = __given_data.data;

                    const __expected = {...__existing_appointment};
                    __expected.files = [__expected_file];

                    appointmentService.addFile(__given_user, __given_link, __given_data)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned InsufficientPermissionsException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(InsufficientPermissionsException);
                        });
                });

            });
        });

        describe('* remove', () => {
            it('* successful should return updated entity', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_link = 'link';
                const __given_id = 'c4703eae-a93b-484d-8eee-63d0779825b0';

                const __existing_file = new File();
                __existing_file.id = __given_id;
                __existing_file.name = 'name.txt';
                __existing_file.data = '123';

                const __existing_appointment = new Appointment();
                __existing_appointment.creator = __given_user;
                __existing_appointment.files = [];

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                fileRepositoryMock.findOne.mockReturnValueOnce(__existing_file);
                fileRepositoryMock.remove.mockReturnValueOnce(undefined);

                jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                    return;
                });

                const __expected = {...__existing_appointment};
                __expected.files = [];

                const __actual = await appointmentService.removeFile(__given_user, __given_link, __given_id);
                expect(__actual).toEqual(__expected);
            });

            describe('* failure should return error', () => {
                it('* appointment not found', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_id = 'c4703eae-a93b-484d-8eee-63d0779825b0';

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    appointmentService
                        .removeFile(__given_user, __given_link, __given_id)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityNotFoundException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                            expect(err.data).toEqual('appointment');
                        });
                });

                it('* insufficient permissions', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_link = 'link';
                    const __given_id = 'c4703eae-a93b-484d-8eee-63d0779825b0';

                    const __existing_creator = new User();
                    __existing_creator.username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creator = __existing_creator;
                    __existing_appointment.files = [];

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentService
                        .removeFile(__given_user, __given_link, __given_id)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned InsufficientPermissionsException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(InsufficientPermissionsException);
                        });
                });
            });
        });
    });

    describe('* pin appointment', () => {
        describe('* successful should return user entity', () => {
            it('* pin', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                __given_user.pinned = [];
                const __given_link = 'link';

                const __existing_appointment = new Appointment();
                __existing_appointment.id = '3b1abdb5-cfaa-44cb-8e26-09d61b8f92c5';
                __existing_appointment.link = __given_link;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                userRepositoryMock.findOne.mockReturnValueOnce(__given_user);

                userRepositoryMock.save.mockImplementationOnce((val) => val);

                const __expected = {...__given_user};
                __expected.pinned = [__existing_appointment];

                const __actual = await appointmentService.togglePinningAppointment(__given_user, __given_link);
                expect(__actual).toEqual(__expected);
            });

            it('* un-pin', async () => {
                const __given_link = 'link';

                const __existing_appointment = new Appointment();
                __existing_appointment.id = '3b1abdb5-cfaa-44cb-8e26-09d61b8f92c5';
                __existing_appointment.link = __given_link;

                const __given_user = new User();
                __given_user.username = 'username';
                __given_user.pinned = [__existing_appointment];

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                userRepositoryMock.findOne.mockReturnValueOnce(__given_user);

                userRepositoryMock.save.mockImplementationOnce((val) => val);

                const __expected = {...__given_user};
                __expected.pinned = [];

                const __actual = await appointmentService.togglePinningAppointment(__given_user, __given_link);
                expect(__actual).toEqual(__expected);
            });
        });

        describe('* failure should return error', () => {
            it('* appointment not found', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                __given_user.pinned = [];
                const __given_link = 'link';

                appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                appointmentService
                    .togglePinningAppointment(__given_user, __given_link)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have thrown EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toEqual('appointment');
                    });
            });

            it('* user gone', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                __given_user.pinned = [];
                const __given_link = 'link';

                const __existing_appointment = new Appointment();
                __existing_appointment.id = '3b1abdb5-cfaa-44cb-8e26-09d61b8f92c5';
                __existing_appointment.link = __given_link;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                appointmentService
                    .togglePinningAppointment(__given_user, __given_link)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have thrown EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toEqual('user');
                    });
            });
        });
    });

    // cases like creator, admin enrollment ... not needed to test, because they are recieved by database
    describe('* get Appointments', () => {
        describe('* successful should return array of entities', () => {
            it('* normal', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_permissions = {};
                const __given_slim = false;

                const __existing_appointment = new Appointment();
                __existing_appointment.id = '1657bd4e-c2d5-411a-8633-7ce9b3eca0cb';
                __existing_appointment.creator = __given_user;
                __existing_appointment.enrollments = [];

                jest.spyOn(appointmentService as any, 'getAppointments')
                    .mockReturnValueOnce(Promise.resolve([__existing_appointment]));

                const actual = await appointmentService.getAll(__given_user, __given_permissions, __given_slim);
                expect(actual).toHaveLength(1);
            });

            it('* normal - slim not provided', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_permissions = {};

                const __existing_appointment = new Appointment();
                __existing_appointment.id = '1657bd4e-c2d5-411a-8633-7ce9b3eca0cb';
                __existing_appointment.creator = __given_user;
                __existing_appointment.enrollments = [];

                jest.spyOn(appointmentService as any, 'getAppointments')
                    .mockReturnValueOnce(Promise.resolve([__existing_appointment]));

                const actual = await appointmentService.getAll(__given_user, __given_permissions);
                expect(actual).toHaveLength(1);
            });

            describe('* pin parsing', () => {
                it('* valid pin', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_permissions = {pin1: 'link'};
                    const __given_slim = false;

                    const __existing_appointment = new Appointment();
                    __existing_appointment.id = '1657bd4e-c2d5-411a-8633-7ce9b3eca0cb';
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.link = __given_permissions.pin1;
                    __existing_appointment.enrollments = [];

                    jest.spyOn(appointmentService as any, 'getAppointments')
                        .mockReturnValueOnce(Promise.resolve([__existing_appointment]));

                    const actual = await appointmentService.getAll(__given_user, __given_permissions, __given_slim);
                    expect(actual).toHaveLength(1);
                });

                it('* invalid pin query name', async () => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_permissions = {invalid: 'link'};
                    const __given_slim = false;

                    const __existing_appointment = new Appointment();
                    __existing_appointment.id = '1657bd4e-c2d5-411a-8633-7ce9b3eca0cb';
                    __existing_appointment.creator = __given_user;
                    __existing_appointment.link = 'anylink';
                    __existing_appointment.enrollments = [];

                    jest.spyOn(appointmentService as any, 'getAppointments')
                        .mockReturnValueOnce(Promise.resolve([__existing_appointment]));

                    const actual = await appointmentService.getAll(__given_user, __given_permissions, __given_slim);
                    expect(actual).toHaveLength(1);
                });
            });
        });
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
