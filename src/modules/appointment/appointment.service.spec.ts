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
import {Enrollment} from '../enrollment/enrollment.entity';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {InvalidValuesException} from '../../exceptions/InvalidValuesException';
import {UnknownUserException} from '../../exceptions/UnknownUserException';
import {EntityGoneException} from '../../exceptions/EntityGoneException';
import {AppointmentGateway} from './appointment.gateway';
import {Session} from '../user/session.entity';

const crypto = require('crypto');

describe('AppointmentService', () => {
    let appointmentService: AppointmentService;
    let userService: UserService;
    let fileService: FileService;
    let additionService: AdditionService;
    let mailerService: MailerService;

    let module: TestingModule;

    let appointmentRepositoryMock: MockType<Repository<Appointment>>;
    let userRepositoryMock: MockType<Repository<User>>;
    let sessionRepositoryMock: MockType<Repository<Session>>;
    let fileRepositoryMock: MockType<Repository<File>>;
    let additionRepositoryMock: MockType<Repository<Addition>>;
    let telegramUserRepositoryMock: MockType<Repository<TelegramUser>>;
    let passwordResetRepositoryMock: MockType<Repository<PasswordReset>>;
    let passwordChangeRepositoryMock: MockType<Repository<PasswordChange>>;
    let emailChangeRepositoryMock: MockType<Repository<EmailChange>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AppointmentService,
                AppointmentGateway,
                UserService,
                AdditionService,
                FileService,
                MailerService,
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
        userService = module.get<UserService>(UserService);
        fileService = module.get<FileService>(FileService);
        additionService = module.get<AdditionService>(AdditionService);
        mailerService = module.get<MailerService>(MailerService);

        appointmentRepositoryMock = module.get(getRepositoryToken(Appointment));
        userRepositoryMock = module.get(getRepositoryToken(User));
        fileRepositoryMock = module.get(getRepositoryToken(File));
        additionRepositoryMock = module.get(getRepositoryToken(Addition));
        telegramUserRepositoryMock = module.get(getRepositoryToken(TelegramUser));
        passwordResetRepositoryMock = module.get(getRepositoryToken(PasswordReset));
        passwordChangeRepositoryMock = module.get(getRepositoryToken(PasswordChange));
        emailChangeRepositoryMock = module.get(getRepositoryToken(EmailChange));
    });

    it('should be defined', () => {
        expect(appointmentService).toBeDefined();
    });

    describe('* handle date validation', () => {
        it('* on valid date return date (date > deadline)', () => {
            const __given_date = new Date();
            const __given_deadline = new Date(__given_date.getTime() - 15 * 60000);

            const __actual = AppointmentService._handleDateValidation(__given_date, __given_deadline);
            expect(__actual).toEqual(__given_date);
        });

        it('* on invalid date return error (date < deadline)', (done) => {
            const __given_date = new Date();
            const __given_deadline = new Date(__given_date.getTime() + 15 * 60000);

            try {
                AppointmentService._handleDateValidation(__given_date, __given_deadline);
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

            const __actual = AppointmentService._handleDeadlineValidation(__given_date, __given_deadline);
            expect(__actual).toEqual(__given_deadline);
        });

        it('* on invalid deadline return error (date < deadline)', (done) => {
            const __given_date = new Date();
            const __given_deadline = new Date(__given_date.getTime() + 15 * 60000);

            try {
                AppointmentService._handleDeadlineValidation(__given_date, __given_deadline);
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

                const __actual = AppointmentService._isCreatorOfAppointment(__given_appointment, __given_user);
                expect(__actual).toBeTruthy();
            });

            describe('* invalid should return false', () => {
                it('* invalid user object - null', () => {
                    const __given_user = undefined;

                    const __appointment_creator = new User();
                    __appointment_creator.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.creator = __appointment_creator;

                    const __actual = AppointmentService._isCreatorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* invalid user object - undefined', () => {
                    const __given_user = null;

                    const __appointment_creator = new User();
                    __appointment_creator.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.creator = __appointment_creator;

                    const __actual = AppointmentService._isCreatorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* wrong username', () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __appointment_creator = new User();
                    __appointment_creator.username = 'creator';

                    const __given_appointment = new Appointment();
                    __given_appointment.creator = __appointment_creator;

                    const __actual = AppointmentService._isCreatorOfAppointment(__given_appointment, __given_user);
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

                const __actual = AppointmentService._isAdministratorOfAppointment(__given_appointment, __given_user);
                expect(__actual).toBeTruthy();
            });

            describe('* invalid should return false', () => {
                it('* invalid user object - null', () => {
                    const __given_user = undefined;

                    const __appointment_admin = new User();
                    __appointment_admin.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.administrators = [__appointment_admin];

                    const __actual = AppointmentService._isCreatorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* invalid user object - undefined', () => {
                    const __given_user = null;

                    const __appointment_admin = new User();
                    __appointment_admin.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.administrators = [__appointment_admin];

                    const __actual = AppointmentService._isCreatorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* wrong username', () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __appointment_admin = new User();
                    __appointment_admin.username = 'administrator';

                    const __given_appointment = new Appointment();
                    __given_appointment.administrators = [__appointment_admin];

                    const __actual = AppointmentService._isAdministratorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* undefined administrator list', () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.administrators = undefined;

                    const __actual = AppointmentService._isAdministratorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });

                it('* empty administrator list', () => {
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_appointment = new Appointment();
                    __given_appointment.administrators = [];

                    const __actual = AppointmentService._isAdministratorOfAppointment(__given_appointment, __given_user);
                    expect(__actual).toBeFalsy();
                });
            });
        });
    });

    describe('UTIL - find appointment', () => {
        describe('* by link', () => {

        });
    });

    describe('* get appointment', () => {
        describe('* should return entity if successful', () => {
            it('successful', async () => {
                const user = new User();
                const link = 'link';
                const permissions = {};
                const slim = false;

                const result = new Appointment();
                appointmentRepositoryMock.findOne.mockReturnValue(result);

                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.get(user, link, permissions, slim);
                expect(typeof actual).toBe('object');
            });

            it('successful - as creator should include "iat" and "lud"', async () => {
                const user = new User();
                const link = 'link';
                const permissions = {};
                const slim = false;

                const result = new Appointment();
                appointmentRepositoryMock.findOne.mockReturnValue(result);

                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(true);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.get(user, link, permissions, slim);
                expect(actual).toHaveProperty('iat');
                expect(actual).toHaveProperty('lud');
            });

            it('successful - as !creator should !include "iat" and "lud"', async () => {
                const user = new User();
                const link = 'link';
                const permissions = {};
                const slim = false;

                const result = new Appointment();
                appointmentRepositoryMock.findOne.mockReturnValue(result);

                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.get(user, link, permissions, slim);
                expect(actual).not.toHaveProperty('iat');
                expect(actual).not.toHaveProperty('lud');
            });

            it('successful - !hidden', async () => {
                const user = new User();
                const link = 'link';
                const permissions = {};
                const slim = false;

                const result = new Appointment();
                result.hidden = false;
                appointmentRepositoryMock.findOne.mockReturnValue(result);

                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.get(user, link, permissions, slim);
                expect(typeof actual).toBe('object');
            });

            it('successful - hidden and !(creator || admin) should have empty enrollments', async () => {
                const user = new User();
                const link = 'link';
                const permissions = {};
                const slim = false;

                const result = new Appointment();
                result.hidden = true;
                result.enrollments = [new Enrollment(), new Enrollment()];
                appointmentRepositoryMock.findOne.mockReturnValue(result);

                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.get(user, link, permissions, slim);
                expect(actual.enrollments).toEqual([]);
            });

            it('successful - hidden and !(creator || admin) should have enrollments when permission correct', async () => {
                const user = new User();
                const link = 'link';
                let permissions = {};
                const slim = false;

                const result = new Appointment();
                result.hidden = true;
                const enrollment = new Enrollment();
                enrollment.id = '1';
                result.enrollments = [enrollment, new Enrollment()];
                appointmentRepositoryMock.findOne.mockReturnValue(result);

                const token = crypto.createHash('sha256')
                    .update(enrollment.id + process.env.SALT_ENROLLMENT)
                    .digest('hex');

                permissions = {'perm1': enrollment.id, 'token1': token};

                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.get(user, link, permissions, slim);
                expect(actual.enrollments).toHaveLength(1);
            });

            it('successful - hidden and creator should enrollments', async () => {
                const user = new User();
                const link = 'link';
                const permissions = {};
                const slim = false;

                const result = new Appointment();
                result.hidden = true;
                result.enrollments = [new Enrollment(), new Enrollment()];
                appointmentRepositoryMock.findOne.mockReturnValue(result);

                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(true);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.get(user, link, permissions, slim);
                expect(actual.enrollments).toHaveLength(2);
            });

            it('successful - hidden and admin should enrollments', async () => {
                const user = new User();
                const link = 'link';
                const permissions = {};
                const slim = false;

                const result = new Appointment();
                result.hidden = true;
                result.enrollments = [new Enrollment(), new Enrollment()];
                appointmentRepositoryMock.findOne.mockReturnValue(result);

                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(true);

                const actual = await appointmentService.get(user, link, permissions, slim);
                expect(actual.enrollments).toHaveLength(2);
            });

            it('successful - slim should rm files and enrollments', async () => {
                const user = new User();
                const link = 'link';
                const permissions = {};
                const slim = true;

                const result = new Appointment();
                result.enrollments = [];
                result.files = [];
                appointmentRepositoryMock.findOne.mockReturnValue(result);

                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(true);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(true);

                const actual = await appointmentService.get(user, link, permissions, slim);
                expect(actual).not.toHaveProperty('files');
                expect(actual).not.toHaveProperty('enrollments');
            });

            it('successful - administrators should just have attributes "name" and "username"', async () => {
                const user = new User();
                const link = 'link';
                const permissions = {};
                const slim = false;

                const result = new Appointment();
                const administrator = new User();
                administrator.username = 'username';
                administrator.name = 'name';
                administrator.mail = 'admin@example.com';
                result.administrators = [administrator];
                appointmentRepositoryMock.findOne.mockReturnValue(result);

                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.get(user, link, permissions, slim);
                expect(actual.administrators[0]).toMatchObject({
                    name: administrator.name,
                    username: administrator.username
                });
            });

            it('successful - enrollment !by creator replaced by "isCreator: false"', async () => {
                const user = new User();
                const link = 'link';
                const permissions = {};
                const slim = false;

                const result = new Appointment();
                const enrollment = new Enrollment();
                result.enrollments = [enrollment];
                appointmentRepositoryMock.findOne.mockReturnValue(result);

                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.get(user, link, permissions, slim);
                expect(actual.enrollments[0]).toHaveProperty('createdByUser', false);
            });

            it('successful - enrollment by creator replaced by "isCreator: true"', async () => {
                const user = new User();
                const link = 'link';
                const permissions = {};
                const slim = false;

                const result = new Appointment();
                const enroller = new User();
                const enrollment = new Enrollment();
                enrollment.creator = enroller;
                result.enrollments = [enrollment];
                appointmentRepositoryMock.findOne.mockReturnValue(result);

                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.get(user, link, permissions, slim);
                expect(actual.enrollments[0]).toHaveProperty('createdByUser', true);
            });
        });
        describe('* should return error if failed', () => {
            it('appointment not found', async () => {
                const user = new User();
                const link = 'link';
                const permissions = {};
                const slim = false;

                appointmentRepositoryMock.findOne.mockReturnValue(undefined);

                appointmentService
                    .get(user, link, permissions, slim)
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
        describe('* should return created entity if successful', () => {
            describe('* link', () => {
                it('valid link - return given link', async () => {
                    const appointment = new Appointment();
                    appointment.link = 'unusedLink';

                    const user = new User();

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    appointmentRepositoryMock.save.mockImplementation((val) => val);

                    const actual = await appointmentService.create(appointment, user);
                    expect(actual.link).toEqual(appointment.link);
                });

                it('empty link - return autogenerated', async () => {
                    const appointment = new Appointment();
                    appointment.link = '';
                    const user = new User();

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    appointmentRepositoryMock.save.mockImplementation((val) => val);

                    const actual = await appointmentService.create(appointment, user);
                    expect(actual.link).toMatch(/^[A-Za-z0-9]{5}$/);
                });

                it('no link - return autogenerated', async () => {
                    const appointment = new Appointment();
                    appointment.link = undefined;
                    const user = new User();

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    appointmentRepositoryMock.save.mockImplementation((val) => val);

                    const actual = await appointmentService.create(appointment, user);
                    expect(actual.link).toMatch(/^[A-Za-z0-9]{5}$/);
                });
            });

            it('> 0 maxEnrollments', async () => {
                const appointment = new Appointment();
                appointment.maxEnrollments = 1;
                const user = new User();

                appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                appointmentRepositoryMock.save.mockImplementation((val) => val);

                const actual = await appointmentService.create(appointment, user);
                expect(actual.maxEnrollments).toEqual(1);
            });

            it('0 maxEnrollments - replace with null', async () => {
                const appointment = new Appointment();
                appointment.maxEnrollments = 0;
                const user = new User();

                appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                appointmentRepositoryMock.save.mockImplementation((val) => val);

                const actual = await appointmentService.create(appointment, user);
                expect(actual.maxEnrollments).toEqual(null);
            });

            describe('* handle additions', () => {
                it('add additions correctly (2)', async () => {
                    const appointment = new Appointment();
                    const addition1 = new Addition();
                    addition1.name = 'addition1';
                    const addition2 = new Addition();
                    addition2.name = 'addition2';
                    appointment.additions = [
                        addition1, addition2
                    ];
                    const user = new User();

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    additionRepositoryMock.save.mockImplementation((val) => {
                        val.id = '' + Date.now();
                        return val;
                    });
                    appointmentRepositoryMock.save.mockImplementation((val) => val);

                    const actual = await appointmentService.create(appointment, user);
                    expect(actual.additions).toHaveLength(2);
                    expect(actual.additions).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({name: addition1.name, id: expect.stringMatching(/.+/)}),
                            expect.objectContaining({name: addition2.name, id: expect.stringMatching(/.+/)}),
                        ])
                    );
                });

                it('add additions correctly (2) - remove duplicates (1)', async () => {
                    const appointment = new Appointment();
                    const addition1 = new Addition();
                    addition1.name = 'addition1';
                    appointment.additions = [
                        addition1, addition1
                    ];
                    const user = new User();

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    additionRepositoryMock.save.mockImplementation((val) => {
                        val.id = '' + Date.now();
                        return val;
                    });
                    appointmentRepositoryMock.save.mockImplementation((val) => val);

                    const actual = await appointmentService.create(appointment, user);
                    expect(actual.additions).toHaveLength(1);
                    expect(actual.additions).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({name: addition1.name, id: expect.stringMatching(/.+/)}),
                        ])
                    );
                });
            });
        });

        describe('* should return error if failed', () => {
            it('duplicate value (link)', async () => {
                const appointment = new Appointment();
                appointment.link = 'usedLink';

                const user = new User();

                appointmentRepositoryMock.findOne.mockReturnValueOnce(new Appointment());
                appointmentRepositoryMock.save.mockImplementation((val) => val);

                appointmentService
                    .create(appointment, user)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have returned DuplicateValueException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(DuplicateValueException);
                    });
            });

            it('deadline after date', async () => {
                const appointment = new Appointment();
                appointment.date = new Date(Date.now() + (3 * 60 * 60 * 2000));
                appointment.deadline = new Date(Date.now() + (4 * 60 * 60 * 2000));

                const user = new User();

                appointmentRepositoryMock.findOne.mockReturnValueOnce(new Appointment());
                appointmentRepositoryMock.save.mockImplementation((val) => val);

                appointmentService
                    .create(appointment, user)
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
        describe('* should return updated entity if successful', () => {
            describe('* update additions', () => {
                it('add one', async () => {
                    const user = new User();
                    const appointment = new Appointment();
                    appointment.link = 'link';
                    const existingAddition1 = new Addition();
                    existingAddition1.id = 'id1';
                    existingAddition1.name = 'addition1';
                    const existingAddition2 = new Addition();
                    existingAddition2.id = 'id2';
                    existingAddition2.name = 'addition2';

                    appointment.additions = [existingAddition1, existingAddition2];

                    const extraAddition = {name: 'addition3'};
                    const toChange = {additions: [existingAddition1, existingAddition2, extraAddition]};

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                    jest.spyOn(appointmentService, 'isCreatorOrAdministrator').mockReturnValueOnce(Promise.resolve(true));
                    additionRepositoryMock.findOne.mockReturnValueOnce(Promise.resolve(existingAddition1));
                    additionRepositoryMock.findOne.mockReturnValueOnce(Promise.resolve(existingAddition2));
                    additionRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    additionRepositoryMock.save.mockImplementation((val) => {
                        val.id = '' + Date.now();
                        return val;
                    });
                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);
                    jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                    jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                    const actual = await appointmentService.update(toChange, appointment.link, user);
                    expect(actual.additions).toHaveLength(3);
                    expect(actual.additions).toEqual(expect.arrayContaining([
                            expect.objectContaining({name: existingAddition1.name, id: existingAddition1.id}),
                            expect.objectContaining({name: existingAddition2.name, id: existingAddition2.id}),
                            expect.objectContaining({name: extraAddition.name, id: expect.stringMatching(/.+/)}),
                        ])
                    );
                });

                it('add one (name already exists) - should not be added', async () => {
                    const user = new User();
                    const appointment = new Appointment();
                    appointment.link = 'link';
                    const existingAddition1 = new Addition();
                    existingAddition1.id = 'id1';
                    existingAddition1.name = 'addition1';
                    const existingAddition2 = new Addition();
                    existingAddition2.id = 'id2';
                    existingAddition2.name = 'existingAddition';

                    appointment.additions = [existingAddition1, existingAddition2];

                    const extraAddition = {name: 'existingAddition'};
                    const toChange = {additions: [existingAddition1, existingAddition2, extraAddition]};

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                    jest.spyOn(appointmentService, 'isCreatorOrAdministrator').mockReturnValueOnce(Promise.resolve(true));
                    additionRepositoryMock.findOne.mockReturnValueOnce(Promise.resolve(existingAddition1));
                    additionRepositoryMock.findOne.mockReturnValueOnce(Promise.resolve(existingAddition2));
                    additionRepositoryMock.findOne.mockReturnValueOnce(Promise.resolve(existingAddition2));
                    additionRepositoryMock.save.mockImplementation((val) => {
                        val.id = '' + Date.now();
                        return val;
                    });
                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);
                    jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                    jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                    const actual = await appointmentService.update(toChange, appointment.link, user);
                    expect(actual.additions).toHaveLength(2);
                    expect(actual.additions).toEqual(expect.arrayContaining([
                            expect.objectContaining({name: existingAddition1.name, id: existingAddition1.id}),
                            expect.objectContaining({name: existingAddition2.name, id: existingAddition2.id}),
                        ])
                    );
                });

                it('remove one', async () => {
                    const user = new User();
                    const appointment = new Appointment();
                    appointment.link = 'link';
                    const existingAddition1 = new Addition();
                    existingAddition1.id = 'id1';
                    existingAddition1.name = 'addition1';
                    const existingAddition2 = new Addition();
                    existingAddition2.id = 'id2';
                    existingAddition2.name = 'addition2';

                    appointment.additions = [existingAddition1, existingAddition2];

                    const toChange = {additions: [existingAddition1]};

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                    jest.spyOn(appointmentService, 'isCreatorOrAdministrator').mockReturnValueOnce(Promise.resolve(true));
                    additionRepositoryMock.findOne.mockReturnValueOnce(Promise.resolve(existingAddition1));
                    additionRepositoryMock.save.mockImplementation((val) => {
                        val.id = '' + Date.now();
                        return val;
                    });
                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);
                    jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                    jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                    const actual = await appointmentService.update(toChange, appointment.link, user);
                    expect(actual.additions).toHaveLength(1);
                    expect(actual.additions).toEqual(expect.arrayContaining([
                            expect.objectContaining({
                                name: existingAddition1.name,
                                id: existingAddition1.id
                            }),
                        ])
                    );
                });
            });

            it('* update link', async () => {
                const user = new User();
                const appointment = new Appointment();
                appointment.link = 'link';

                const toChange = {link: 'newLink'};

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                jest.spyOn(appointmentService, 'isCreatorOrAdministrator').mockReturnValueOnce(Promise.resolve(true));
                appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                appointmentRepositoryMock.save.mockImplementationOnce((val) => val);
                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.update(toChange, appointment.link, user);
                expect(actual.link).toEqual(toChange.link);
            });

            it('* update date', async () => {
                const user = new User();
                const appointment = new Appointment();
                appointment.date = new Date(Date.now() + (3 * 60 * 60 * 1000));
                appointment.deadline = new Date(Date.now() + (2 * 60 * 60 * 1000));

                const toChange = {date: new Date(Date.now() + (5 * 60 * 60 * 1000))};

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                jest.spyOn(appointmentService, 'isCreatorOrAdministrator').mockReturnValueOnce(Promise.resolve(true));
                appointmentRepositoryMock.save.mockImplementationOnce((val) => val);
                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.update(toChange, appointment.link, user);
                expect(actual.date).toEqual(toChange.date);
            });

            it('* update deadline', async () => {
                const user = new User();
                const appointment = new Appointment();
                appointment.date = new Date(Date.now() + (3 * 60 * 60 * 1000));
                appointment.deadline = new Date(Date.now() + (2 * 60 * 60 * 1000));

                const toChange = {deadline: new Date(Date.now() + (2.5 * 60 * 60 * 1000))};

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                jest.spyOn(appointmentService, 'isCreatorOrAdministrator').mockReturnValueOnce(Promise.resolve(true));
                appointmentRepositoryMock.save.mockImplementationOnce((val) => val);
                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.update(toChange, appointment.link, user);
                expect(actual.deadline).toEqual(toChange.deadline);
            });

            it('* update title', async () => {
                const user = new User();
                const appointment = new Appointment();
                appointment.title = 'currentTitle';

                const toChange = {title: 'newTitle'};

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                jest.spyOn(appointmentService, 'isCreatorOrAdministrator').mockReturnValueOnce(Promise.resolve(true));
                appointmentRepositoryMock.save.mockImplementationOnce((val) => val);
                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.update(toChange, appointment.link, user);
                expect(actual.title).toEqual(toChange.title);
            });

            it('* update description', async () => {
                const user = new User();
                const appointment = new Appointment();
                appointment.description = 'currentDescription';

                const toChange = {description: 'newDescription'};

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                jest.spyOn(appointmentService, 'isCreatorOrAdministrator').mockReturnValueOnce(Promise.resolve(true));
                appointmentRepositoryMock.save.mockImplementationOnce((val) => val);
                jest.spyOn(AppointmentService, '_isCreatorOfAppointment').mockReturnValue(false);
                jest.spyOn(AppointmentService, '_isAdministratorOfAppointment').mockReturnValue(false);

                const actual = await appointmentService.update(toChange, appointment.link, user);
                expect(actual.description).toEqual(toChange.description);
            });
        });

        describe('* should return error if failed', () => {
            it('appointment not found', async () => {
                const user = new User();
                const appointment = new Appointment();
                appointment.link = 'currentTitle';

                const toChange = {title: 'newTitle'};

                appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                appointmentService
                    .update(toChange, appointment.link, user)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toBe('appointment');
                    });
            });

            it('no permissions', async () => {
                const user = new User();
                user.username = 'username';
                const appointment = new Appointment();
                appointment.link = 'currentTitle';
                const creator = new User();
                user.username = 'secondUsername';
                appointment.creator = creator;

                const toChange = {title: 'newTitle'};

                appointmentRepositoryMock.findOne.mockReturnValue(appointment);

                appointmentService
                    .update(toChange, appointment.link, user)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an InsufficientPermissionsException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(InsufficientPermissionsException);
                    });
            });

            it('* link in use', async () => {
                const user = new User();
                const appointment = new Appointment();
                appointment.link = 'link';

                const toChange = {link: 'newLink'};

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                jest.spyOn(appointmentService, 'isCreatorOrAdministrator').mockReturnValueOnce(Promise.resolve(true));
                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);

                appointmentService
                    .update(toChange, appointment.link, user)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an DuplicateValueException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(DuplicateValueException);
                    });
            });

            it('* date before deadline', async () => {
                const user = new User();
                const appointment = new Appointment();
                appointment.date = new Date(Date.now() + (4 * 60 * 60 * 1000));
                appointment.deadline = new Date(Date.now() + (3 * 60 * 60 * 1000));

                const toChange = {date: new Date(Date.now() + (2 * 60 * 60 * 1000))};

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                jest.spyOn(appointmentService, 'isCreatorOrAdministrator').mockReturnValueOnce(Promise.resolve(true));

                appointmentService
                    .update(toChange, appointment.link, user)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an InvalidValuesException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(InvalidValuesException);
                        expect(err.data).toEqual(['date']);
                    });
            });

            it('* deadline after date', async () => {
                const user = new User();
                const appointment = new Appointment();
                appointment.date = new Date(Date.now() + (4 * 60 * 60 * 1000));
                appointment.deadline = new Date(Date.now() + (3 * 60 * 60 * 1000));

                const toChange = {deadline: new Date(Date.now() + (5 * 60 * 60 * 1000))};

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                jest.spyOn(appointmentService, 'isCreatorOrAdministrator').mockReturnValueOnce(Promise.resolve(true));

                appointmentService
                    .update(toChange, appointment.link, user)
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

    describe('* get Appointments', () => {
        describe('* should return array of entities if successful', () => {
            it('successful', async () => {
                const user = new User();
                user.username = 'username';
                const permissions = {};
                const slim = false;

                const appointment1 = new Appointment();
                appointment1.creator = user;
                appointment1.enrollments = [];

                jest.spyOn(appointmentService, 'getAppointments')
                    .mockReturnValueOnce(Promise.resolve([appointment1]));

                const actual = await appointmentService.getAll(user, permissions, slim);
                expect(actual).toHaveLength(1);
            });

            it('successful - pin parse', async () => {
                const user = new User();
                user.username = 'username';
                const permissions = {'pin1': 'link'};
                const slim = false;

                const appointment1 = new Appointment();
                appointment1.creator = user;
                appointment1.link = 'link';
                appointment1.enrollments = [];

                jest.spyOn(appointmentService, 'getAppointments')
                    .mockReturnValueOnce(Promise.resolve([appointment1]));

                const actual = await appointmentService.getAll(user, permissions, slim);
                expect(actual).toHaveLength(1);
            });
        });
    });

    describe('* parse references', () => {
        it('successful - as creator', async () => {
            const user = new User();
            user.username = 'username';
            const pins = [];

            const appointment = new Appointment();
            appointment.id = '1';
            appointment.creator = user;
            appointment.enrollments = [];

            const actual = AppointmentService.parseReferences(user, appointment, pins);
            expect(actual).toEqual(['CREATOR']);
        });

        it('successful - as administrator', async () => {
            const user = new User();
            user.username = 'username';
            const pins = [];

            const creator = new User();
            creator.username = 'creator';

            const appointment = new Appointment();
            appointment.id = '1';
            appointment.creator = creator;
            appointment.administrators = [user];
            appointment.enrollments = [];

            const actual = AppointmentService.parseReferences(user, appointment, pins);
            expect(actual).toEqual(['ADMIN']);
        });

        it('successful - pinned', async () => {
            const user = new User();
            user.username = 'username';
            const pins = [];

            const creator = new User();
            creator.username = 'creator';

            const appointment = new Appointment();
            appointment.id = '1';
            appointment.creator = creator;
            appointment.pinners = [user];
            appointment.enrollments = [];

            const actual = AppointmentService.parseReferences(user, appointment, pins);
            expect(actual).toEqual(['PINNED']);
        });

        it('successful - pinned - parameter', async () => {
            const user = new User();
            user.username = 'username';
            const pins = ['link'];

            const creator = new User();
            creator.username = 'creator';

            const appointment = new Appointment();
            appointment.id = '1';
            appointment.link = 'link';
            appointment.creator = creator;
            appointment.enrollments = [];

            const actual = AppointmentService.parseReferences(user, appointment, pins);
            expect(actual).toEqual(['PINNED']);
        });

        it('successful - enrolled', async () => {
            const user = new User();
            user.username = 'username';
            const pins = [];

            const creator = new User();
            creator.username = 'creator';

            const enrollment = new Enrollment();
            enrollment.creator = user;

            const appointment = new Appointment();
            appointment.id = '1';
            appointment.creator = creator;
            appointment.enrollments = [enrollment];

            const actual = AppointmentService.parseReferences(user, appointment, pins);
            expect(actual).toEqual(['ENROLLED']);
        });
    });

    describe('* administrator', () => {
        describe('* add', () => {
            it('should return nothing if successful', async (done) => {
                const user = new User();
                user.id = '1';
                user.username = 'username';

                const administratorToAdd = new User();
                administratorToAdd.username = 'admin';

                const appointment = new Appointment();
                appointment.creator = user;
                appointment.administrators = [];

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                userRepositoryMock.findOne.mockReturnValueOnce(administratorToAdd);
                appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                appointmentService
                    .addAdministrator(user, appointment.link, administratorToAdd.username)
                    .then(() => {
                        done();
                    })
                    .catch(() => {
                        throw new Error('I have failed you, Anakin. Should have returned nothing');
                    });
            });

            describe('* should return error if failed', () => {
                it('appointment not found', async () => {
                    const user = new User();
                    const administratorToAdd = new User();
                    const appointment = new Appointment();

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    appointmentService
                        .addAdministrator(user, appointment.link, administratorToAdd.username)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityNotFoundException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                            expect(err.data).toEqual('appointment');
                        });
                });

                it('insufficient permissions', async () => {
                    const user = new User();
                    user.username = 'username';

                    const administratorToAdd = new User();

                    const creator = new User();
                    creator.username = 'creator';

                    const appointment = new Appointment();
                    appointment.creator = creator;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);

                    appointmentService
                        .addAdministrator(user, appointment.link, administratorToAdd.username)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned InsufficientPermissionsException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(InsufficientPermissionsException);
                        });
                });

                it('user not found by username', async () => {
                    const user = new User();
                    user.username = 'username';

                    const administratorToAdd = new User();

                    const appointment = new Appointment();
                    appointment.creator = user;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    appointmentService
                        .addAdministrator(user, appointment.link, administratorToAdd.username)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned UnknownUserException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(UnknownUserException);
                        });
                });
            });
        });

        describe('* remove', () => {
            it('should return nothing if successful', async (done) => {
                const user = new User();
                user.id = '1';
                user.username = 'username';

                const administratorToRemove = new User();
                administratorToRemove.username = 'admin';

                const appointment = new Appointment();
                appointment.creator = user;
                appointment.administrators = [administratorToRemove];

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                appointmentRepositoryMock.save.mockReturnValueOnce((val) => val);

                appointmentService
                    .removeAdministrator(user, appointment.link, administratorToRemove.username)
                    .then(() => {
                        done();
                    })
                    .catch((err) => {
                        throw new Error('I have failed you, Anakin. Should have returned nothing');
                    });
            });

            describe('* should return error if failed', () => {
                it('appointment not found', async () => {
                    const user = new User();
                    const administratorToAdd = new User();
                    const appointment = new Appointment();

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    appointmentService
                        .removeAdministrator(user, appointment.link, administratorToAdd.username)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityNotFoundException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                            expect(err.data).toEqual('appointment');
                        });
                });

                it('insufficient permissions', async () => {
                    const user = new User();
                    user.username = 'username';

                    const administratorToAdd = new User();

                    const creator = new User();
                    creator.username = 'creator';

                    const appointment = new Appointment();
                    appointment.creator = creator;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);

                    appointmentService
                        .removeAdministrator(user, appointment.link, administratorToAdd.username)
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

    describe('* files', () => {
        describe('* add', () => {
            it('should return nothing if successful', async (done) => {
                const user = new User();
                user.id = '1';
                user.username = 'username';

                const fileToAdd: { name: string, data: string } = {name: '', data: ''};
                fileToAdd.name = 'myfile.png';
                fileToAdd.data = 'data';

                const appointment = new Appointment();
                appointment.creator = user;
                appointment.files = [];

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                fileRepositoryMock.save.mockReturnValueOnce((val) => val);
                appointmentRepositoryMock.save.mockReturnValueOnce((val) => val);

                appointmentService
                    .addFile(user, appointment.link, fileToAdd)
                    .then(() => {
                        done();
                    })
                    .catch((err) => {
                        throw new Error('I have failed you, Anakin. Should have returned nothing');
                    });
            });

            describe('* should return error if failed', () => {
                it('appointment not found', async () => {
                    const user = new User();
                    const fileToAdd: { name: string, data: string } = {name: '', data: ''};
                    const appointment = new Appointment();

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    appointmentService
                        .addFile(user, appointment.link, fileToAdd)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityNotFoundException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                            expect(err.data).toEqual('appointment');
                        });
                });

                it('insufficient permissions', async () => {
                    const user = new User();
                    user.username = 'username';

                    const fileToAdd: { name: string, data: string } = {name: '', data: ''};
                    fileToAdd.name = 'myfile.png';
                    fileToAdd.data = 'data';

                    const creator = new User();
                    creator.username = 'creator';

                    const appointment = new Appointment();
                    appointment.creator = creator;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);

                    appointmentService
                        .addFile(user, appointment.link, fileToAdd)
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
            it('should return nothing if successful', async (done) => {
                const user = new User();
                user.id = '1';
                user.username = 'username';

                const fileIdToRemove = '1';

                const appointment = new Appointment();
                appointment.creator = user;
                appointment.files = [];

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                fileRepositoryMock.findOne.mockReturnValueOnce(new File());
                fileRepositoryMock.remove.mockReturnValueOnce((val) => val);

                appointmentService
                    .removeFile(user, appointment.link, fileIdToRemove)
                    .then(() => {
                        done();
                    })
                    .catch(() => {
                        throw new Error('I have failed you, Anakin. Should have returned nothing');
                    });
            });

            describe('* should return error if failed', () => {
                it('appointment not found', async () => {
                    const user = new User();
                    const fileIdToRemove = '1';
                    const appointment = new Appointment();

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    appointmentService
                        .removeFile(user, appointment.link, fileIdToRemove)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityNotFoundException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                            expect(err.data).toEqual('appointment');
                        });
                });

                it('insufficient permissions', async () => {
                    const user = new User();
                    user.username = 'username';

                    const fileIdToRemove = '1';

                    const creator = new User();
                    creator.username = 'creator';

                    const appointment = new Appointment();
                    appointment.creator = creator;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);

                    appointmentService
                        .removeFile(user, appointment.link, fileIdToRemove)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned InsufficientPermissionsException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(InsufficientPermissionsException);
                        });
                });

                it('file not found', async () => {
                    const user = new User();
                    user.username = 'username';

                    const fileIdToRemove = '1';

                    const appointment = new Appointment();
                    appointment.creator = user;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                    fileRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    appointmentService
                        .removeFile(user, appointment.link, fileIdToRemove)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityGoneException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityGoneException);
                            expect(err.data).toEqual('file');
                        });
                });
            });
        });
    });

    describe('* pin appointment', () => {
        describe('should return void if successful', () => {
            it('pin', async () => {
                const appointment = new Appointment();
                appointment.id = '1';
                appointment.link = 'link';

                const user = new User();
                user.pinned = [];

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                userRepositoryMock.findOne.mockReturnValueOnce(user);
                userRepositoryMock.save.mockImplementationOnce((val) => val);

                appointmentService
                    .togglePinningAppointment(user, appointment.link)
                    .then((res) => {
                        expect(res).toEqual([appointment]);
                    })
                    .catch((err) => {
                        throw new Error('I have failed you, Anakin. Should have returned nothing');
                    });
            });

            it('un-pin', async () => {
                const appointment = new Appointment();
                appointment.id = '1';
                appointment.link = 'link';

                const user = new User();
                user.pinned = [appointment];

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                userRepositoryMock.findOne.mockReturnValueOnce(user);
                userRepositoryMock.save.mockImplementationOnce((val) => val);

                appointmentService
                    .togglePinningAppointment(user, appointment.link)
                    .then((res) => {
                        expect(res).toEqual([]);
                    })
                    .catch(() => {
                        throw new Error('I have failed you, Anakin. Should have returned nothing');
                    });
            });
        });

        describe('* should return error if successful', () => {
            it('appointment not found', async () => {
                const appointment = new Appointment();
                const user = new User();

                appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                appointmentService
                    .togglePinningAppointment(user, appointment.link)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have thrown EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toEqual('appointment');
                    });
            });

            it('user gone', async () => {
                const appointment = new Appointment();
                appointment.id = '1';
                appointment.link = 'link';

                const user = new User();

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                appointmentService
                    .togglePinningAppointment(user, appointment.link)
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

    describe('* permission checking', () => {
        describe('* is creator', () => {
            describe('* should return boolean if successful', () => {
                it('is creator', async () => {
                    const user = new User();
                    user.username = 'username';

                    const appointment = new Appointment();
                    appointment.creator = user;

                    const actual = await AppointmentService._isCreatorOfAppointment(appointment, user);
                    expect(actual).toEqual(true);
                });

                it('is not creator', async () => {
                    const user = new User();
                    user.username = 'username';

                    const creator = new User();
                    user.username = 'creator';

                    const appointment = new Appointment();
                    appointment.creator = creator;

                    const actual = await AppointmentService._isCreatorOfAppointment(appointment, user);
                    expect(actual).toEqual(false);
                });
            });

            describe('* should return boolean if successful - user not defined', () => {
                it('user undefined', async () => {
                    const user = undefined;
                    const appointment = new Appointment();

                    const actual = await AppointmentService._isCreatorOfAppointment(appointment, user);
                    expect(actual).toEqual(false);
                });

                it('user null', async () => {
                    const user = null;
                    const appointment = new Appointment();

                    const actual = await AppointmentService._isCreatorOfAppointment(appointment, user);
                    expect(actual).toEqual(false);
                });
            });
        });

        describe('* is administrator', () => {
            describe('* should return boolean if successful', () => {
                it('is administrator', async () => {
                    const user = new User();
                    user.username = 'username';

                    const appointment = new Appointment();
                    appointment.administrators = [user];

                    const actual = await AppointmentService._isAdministratorOfAppointment(appointment, user);
                    expect(actual).toEqual(true);
                });

                it('is not administrator', async () => {
                    const user = new User();
                    user.username = 'username';

                    const appointment = new Appointment();
                    appointment.administrators = [];

                    const actual = await AppointmentService._isAdministratorOfAppointment(appointment, user);
                    expect(actual).toEqual(false);
                });
            });

            describe('* should return boolean if successful - user not defined', () => {
                it('user undefined', async () => {
                    const user = undefined;
                    const appointment = new Appointment();

                    const actual = await AppointmentService._isAdministratorOfAppointment(appointment, user);
                    expect(actual).toEqual(false);
                });

                it('user null', async () => {
                    const user = null;

                    const appointment = new Appointment();
                    appointment.creator = user;

                    const actual = await AppointmentService._isAdministratorOfAppointment(appointment, user);
                    expect(actual).toEqual(false);
                });
            });

            describe('* should return boolean if successful - administrator list undefined', () => {
                it('user undefined', async () => {
                    const user = undefined;
                    const appointment = new Appointment();
                    appointment.administrators = undefined;

                    const actual = await AppointmentService._isAdministratorOfAppointment(appointment, user);
                    expect(actual).toEqual(false);
                });
            });
        });

        describe('* is creator or administrator', () => {
            describe('* check by link', () => {
                describe('* should return boolean if successful', () => {
                    it('return true if creator', async () => {
                        const user = new User();
                        user.username = 'username';

                        const appointment = new Appointment();
                        appointment.creator = user;
                        appointment.link = 'link';

                        appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);

                        const actual = await appointmentService.isCreatorOrAdministrator(user, appointment.link);
                        expect(actual).toBe(true);
                    });

                    it('return true if admin', async () => {
                        const user = new User();
                        user.username = 'username';

                        const creator = new User();
                        user.username = 'creator';

                        const appointment = new Appointment();
                        appointment.creator = creator;
                        appointment.link = 'link';
                        appointment.administrators = [user];

                        appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);

                        const actual = await appointmentService.isCreatorOrAdministrator(user, appointment.link);
                        expect(actual).toBe(true);
                    });

                    it('return true if both', async () => {
                        const user = new User();
                        user.username = 'username';

                        const appointment = new Appointment();
                        appointment.creator = user;
                        appointment.link = 'link';
                        appointment.administrators = [user];

                        appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);

                        const actual = await appointmentService.isCreatorOrAdministrator(user, appointment.link);
                        expect(actual).toBe(true);
                    });

                    it('return false if not', async () => {
                        const user = new User();
                        user.username = 'username';

                        const creator = new User();
                        user.username = 'creator';

                        const appointment = new Appointment();
                        appointment.creator = creator;
                        appointment.link = 'link';

                        appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);

                        const actual = await appointmentService.isCreatorOrAdministrator(user, appointment.link);
                        expect(actual).toBe(false);
                    });
                });

                describe('* should return error if failed', () => {
                    it('appointment not found', async () => {
                        const user = new User();
                        user.username = 'username';

                        const appointment = new Appointment();
                        appointment.link = 'link';

                        appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                        appointmentService
                            .isCreatorOrAdministrator(user, appointment.link)
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

            describe('* check by appointment', () => {
                describe('* should return boolean if successful', () => {
                    it('return true if creator', async () => {
                        const user = new User();
                        user.username = 'username';

                        const appointment = new Appointment();
                        appointment.creator = user;

                        const actual = await appointmentService.isCreatorOrAdministrator(user, appointment);
                        expect(actual).toBe(true);
                    });

                    it('return true if admin', async () => {
                        const user = new User();
                        user.username = 'username';

                        const creator = new User();
                        user.username = 'creator';

                        const appointment = new Appointment();
                        appointment.creator = creator;
                        appointment.administrators = [user];

                        const actual = await appointmentService.isCreatorOrAdministrator(user, appointment);
                        expect(actual).toBe(true);
                    });

                    it('return true if both', async () => {
                        const user = new User();
                        user.username = 'username';

                        const appointment = new Appointment();
                        appointment.creator = user;
                        appointment.administrators = [user];

                        const actual = await appointmentService.isCreatorOrAdministrator(user, appointment);
                        expect(actual).toBe(true);
                    });

                    it('return false if not', async () => {
                        const user = new User();
                        user.username = 'username';

                        const creator = new User();
                        user.username = 'creator';

                        const appointment = new Appointment();
                        appointment.creator = creator;

                        const actual = await appointmentService.isCreatorOrAdministrator(user, appointment);
                        expect(actual).toBe(false);
                    });
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
