import {Test, TestingModule} from '@nestjs/testing';
import {EnrollmentService} from './enrollment.service';
import {UserService} from '../user/user.service';
import {MailerService} from '@nest-modules/mailer';
import {Repository} from 'typeorm';
import {User} from '../user/user.entity';
import {TelegramUser} from '../user/telegram/telegram-user.entity';
import {PasswordReset} from '../user/password-reset/password-reset.entity';
import {PasswordChange} from '../user/password-change/password-change.entity';
import {EmailChange} from '../user/email-change/email-change.entity';
import {getRepositoryToken} from '@nestjs/typeorm';
import {MAILER_OPTIONS} from '@nest-modules/mailer/dist/constants/mailer-options.constant';
import {AppointmentService} from '../appointment/appointment.service';
import {FileService} from '../file/file.service';
import {AdditionService} from '../addition/addition.service';
import {Appointment} from '../appointment/appointment.entity';
import {File} from '../file/file.entity';
import {Addition} from '../addition/addition.entity';
import {Enrollment} from './enrollment.entity';
import {Driver} from './driver/driver.entity';
import {Passenger} from './passenger/passenger.entity';
import {Mail} from './mail/mail.entity';
import {DriverService} from './driver/driver.service';
import {PassengerService} from './passenger/passenger.service';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {EmptyFieldsException} from '../../exceptions/EmptyFieldsException';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {EntityGoneException} from '../../exceptions/EntityGoneException';
import {AppointmentGateway} from '../appointment/appointment.gateway';
import {Session} from '../user/session.entity';

const crypto = require('crypto');

describe('EnrollmentService', () => {
    let enrollmentService: EnrollmentService;
    let userService: UserService;
    let appointmentService: AppointmentService;
    let fileService: FileService;
    let additionService: AdditionService;
    let mailerService: MailerService;
    let appointmentGateway: AppointmentGateway;
    let module: TestingModule;
    let enrollmentRepositoryMock: MockType<Repository<Enrollment>>;
    let appointmentRepositoryMock: MockType<Repository<Appointment>>;
    let userRepositoryMock: MockType<Repository<User>>;
    let fileRepositoryMock: MockType<Repository<File>>;
    let additionRepositoryMock: MockType<Repository<Addition>>;
    let telegramUserRepositoryMock: MockType<Repository<TelegramUser>>;
    let passwordResetRepositoryMock: MockType<Repository<PasswordReset>>;
    let passwordChangeRepositoryMock: MockType<Repository<PasswordChange>>;
    let emailChangeRepositoryMock: MockType<Repository<EmailChange>>;
    let driverRepositoryMock: MockType<Repository<Driver>>;
    let passengerRepositoryMock: MockType<Repository<Passenger>>;
    let mailRepositoryMock: MockType<Repository<Mail>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [EnrollmentService,
                UserService,
                MailerService,
                AppointmentService,
                AdditionService,
                FileService,
                MailerService,
                DriverService,
                PassengerService,
                AppointmentGateway,
                UserService,
                AdditionService,
                FileService,
                MailerService,
                AppointmentGateway,
                {provide: getRepositoryToken(Enrollment), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Driver), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Passenger), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Mail), useFactory: repositoryMockFactory},
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

        enrollmentService = module.get<EnrollmentService>(EnrollmentService);
        userService = module.get<UserService>(UserService);
        mailerService = module.get<MailerService>(MailerService);
        appointmentService = module.get<AppointmentService>(AppointmentService);
        fileService = module.get<FileService>(FileService);
        additionService = module.get<AdditionService>(AdditionService);
        appointmentGateway = module.get<AppointmentGateway>(AppointmentGateway);

        enrollmentRepositoryMock = module.get(getRepositoryToken(Enrollment));
        userRepositoryMock = module.get(getRepositoryToken(User));
        additionRepositoryMock = module.get(getRepositoryToken(Addition));
        appointmentRepositoryMock = module.get(getRepositoryToken(Appointment));
        telegramUserRepositoryMock = module.get(getRepositoryToken(TelegramUser));
        passwordResetRepositoryMock = module.get(getRepositoryToken(PasswordReset));
        passwordChangeRepositoryMock = module.get(getRepositoryToken(PasswordChange));
        emailChangeRepositoryMock = module.get(getRepositoryToken(EmailChange));
        fileRepositoryMock = module.get(getRepositoryToken(File));
        driverRepositoryMock = module.get(getRepositoryToken(Driver));
        passengerRepositoryMock = module.get(getRepositoryToken(Passenger));
        mailRepositoryMock = module.get(getRepositoryToken(Mail));
    });

    it('should be defined', () => {
        expect(enrollmentService).toBeDefined();
    });

    describe('* find enrollment', () => {
        describe('* by id', () => {
            it('* successful should return enrollment object', async () => {
                const __given_id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);

                const __expected = __existing_enrollment;

                const __actual = await enrollmentService.findById(__given_id);
                expect(__actual).toEqual(__expected);
            });

            describe('* failure should return error', () => {
                it('* enrollment not found', async (done) => {
                    const __given_id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';

                    const __existing_enrollment = new Enrollment();
                    __existing_enrollment.id = 'd92fe1a9-47cb-4c9b-8749-dde4c6764e5d';

                    enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    try {
                        await enrollmentService.findById(__given_id);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(EntityNotFoundException);
                        expect(e.data).toEqual('enrollment');
                        done();
                    }
                });
            });
        });
    });

    describe('* create enrollment', () => {
        describe('* successful should return created entity', () => {
            describe('* comment management', () => {
                it('* trimming', async () => {
                    const __given_enrollment = new Enrollment();
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    const __expected_comment = 'my cool comment';

                    __given_enrollment.comment = ` ${__expected_comment}  `;

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';

                    __given_enrollment.appointment = __existing_appointment;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment); // cant find appointment with specific link

                    enrollmentRepositoryMock.findOne.mockImplementationOnce(undefined);
                    enrollmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __actual = await enrollmentService.create(__given_enrollment, __given_user, __given_domain);

                    expect(__actual.comment).toBe(__expected_comment);
                });

                it('* null on empty', async () => {
                    const __given_enrollment = new Enrollment();
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    __given_enrollment.comment = ``;

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';

                    __given_enrollment.appointment = __existing_appointment;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment); // cant find appointment with specific link

                    enrollmentRepositoryMock.findOne.mockImplementationOnce(undefined);
                    enrollmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __actual = await enrollmentService.create(__given_enrollment, __given_user, __given_domain);
                    const __expected_comment = null;

                    expect(__actual.comment).toBe(__expected_comment);
                });
            });

            describe('* driver addition management', () => {
                it('* as passenger', async () => {
                    const __given_enrollment = new Enrollment();
                    __given_enrollment.passenger = new Passenger();
                    __given_enrollment.passenger.requirement = 2;

                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    const __expected_comment = 'my cool comment';

                    __given_enrollment.comment = ` ${__expected_comment}  `;

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.driverAddition = true;

                    __given_enrollment.appointment = __existing_appointment;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment); // cant find appointment with specific link

                    enrollmentRepositoryMock.findOne.mockImplementationOnce(undefined);

                    passengerRepositoryMock.findOne.mockImplementationOnce(undefined);
                    passengerRepositoryMock.save.mockImplementation((val) => val);

                    enrollmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __actual = await enrollmentService.create(__given_enrollment, __given_user, __given_domain);

                    expect(__actual.passenger.requirement).toBe(__given_enrollment.passenger.requirement);
                    expect(__actual.driver).toBeUndefined();
                    // checking passenger management
                    expect(passengerRepositoryMock.findOne).toHaveBeenCalledTimes(1);
                    expect(passengerRepositoryMock.save).toHaveBeenCalledTimes(1);
                });

                it('* as driver', async () => {
                    const __given_enrollment = new Enrollment();
                    __given_enrollment.driver = new Driver();
                    __given_enrollment.driver.service = 1;
                    __given_enrollment.driver.seats = 4;

                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    const __expected_comment = 'my cool comment';

                    __given_enrollment.comment = ` ${__expected_comment}  `;

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.driverAddition = true;

                    __given_enrollment.appointment = __existing_appointment;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment); // cant find appointment with specific link

                    enrollmentRepositoryMock.findOne.mockImplementationOnce(undefined);

                    driverRepositoryMock.findOne.mockImplementationOnce(undefined);
                    driverRepositoryMock.save.mockImplementation((val) => val);

                    enrollmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const __expected_driver = new Driver();
                    __expected_driver.seats = __given_enrollment.driver.seats;
                    __expected_driver.service = __given_enrollment.driver.service;

                    const __actual = await enrollmentService.create(__given_enrollment, __given_user, __given_domain);

                    expect(__actual.driver).toEqual(__expected_driver);
                    expect(__actual.passenger).toBeUndefined();
                    // checking passenger management
                    expect(driverRepositoryMock.findOne).toHaveBeenCalledTimes(1);
                    expect(driverRepositoryMock.save).toHaveBeenCalledTimes(1);
                });
            });

            describe('* enrollment creator', () => {
                it('* as not logged in user', async () => {
                    const __given_enrollment = new Enrollment();
                    const __given_user = undefined;
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    __given_enrollment.comment = 'comment';
                    __given_enrollment.editMail = 'mail@example.com';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';

                    __given_enrollment.appointment = __existing_appointment;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment); // cant find appointment with specific link

                    enrollmentRepositoryMock.findOne.mockImplementationOnce(undefined);

                    mailRepositoryMock.save.mockImplementation((val) => val);

                    enrollmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                    const __expected_mail = new Mail();
                    __expected_mail.mail = __given_enrollment.editMail;

                    await enrollmentService.create(__given_enrollment, __given_user, __given_domain);

                    expect(mailRepositoryMock.save).toHaveBeenCalledTimes(1);
                    expect(mailRepositoryMock.save).toHaveBeenCalledWith(__expected_mail);
                });

                it('* as logged in user', async () => {
                    const __given_enrollment = new Enrollment();
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    __given_enrollment.comment = 'comment';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';

                    __given_enrollment.appointment = __existing_appointment;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment); // cant find appointment with specific link

                    enrollmentRepositoryMock.findOne.mockImplementationOnce(undefined);

                    mailRepositoryMock.save.mockImplementation((val) => val);

                    enrollmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    await enrollmentService.create(__given_enrollment, __given_user, __given_domain);

                    expect(mailRepositoryMock.save).toHaveBeenCalledTimes(0);
                });

                it('* editMail > user', async () => {
                    const __given_enrollment = new Enrollment();
                    const __given_user = new User();
                    __given_user.username = 'username';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    __given_enrollment.editMail = 'mail@example.ocm';
                    __given_enrollment.comment = 'comment';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';

                    __given_enrollment.appointment = __existing_appointment;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment); // cant find appointment with specific link

                    enrollmentRepositoryMock.findOne.mockImplementationOnce(undefined);

                    mailRepositoryMock.save.mockImplementation((val) => val);

                    enrollmentRepositoryMock.save.mockImplementation((val) => val); // save appointment

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                    await enrollmentService.create(__given_enrollment, __given_user, __given_domain);

                    expect(mailRepositoryMock.save).toHaveBeenCalledTimes(1);
                });
            });
        });

        describe('* failure should return error', () => {
            it('appointment not found', async (done) => {
                const __given_enrollment = new Enrollment();
                __given_enrollment.appointment = new Appointment();
                __given_enrollment.appointment.link = 'link';
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_domain = 'example.com/{{0}}/{{1}}';

                const __existing_appointment = undefined;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment); // cant find appointment with specific link

                try {
                    await enrollmentService.create(__given_enrollment, __given_user, __given_domain);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    expect(e.data).toEqual('appointment');
                    done();
                }
            });

            it('* name already in use', async (done) => {
                const __given_enrollment = new Enrollment();
                __given_enrollment.name = 'existingName';
                __given_enrollment.appointment = new Appointment();
                __given_enrollment.appointment.link = 'link';
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_domain = 'example.com/{{0}}/{{1}}';

                const __existing_appointment = __given_enrollment.appointment;
                const __existing_enrollment = new Enrollment();
                __existing_enrollment.name = __given_enrollment.name;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment); // cant find appointment with specific link
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment); // cant find appointment with specific link

                try {
                    await enrollmentService.create(__given_enrollment, __given_user, __given_domain);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an DuplicateValueException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(DuplicateValueException);
                    expect(e.data).toEqual(['name']);
                    done();
                }
            });

            it('* driver/passenger not defined', async (done) => {
                const __given_enrollment = new Enrollment();
                __given_enrollment.name = 'existingName';
                __given_enrollment.comment = 'comment';
                __given_enrollment.appointment = new Appointment();
                __given_enrollment.appointment.link = 'link';
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_domain = 'example.com/{{0}}/{{1}}';

                const __existing_appointment = __given_enrollment.appointment;
                __existing_appointment.driverAddition = true;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment); // cant find appointment with specific link
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                try {
                    await enrollmentService.create(__given_enrollment, __given_user, __given_domain);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EmptyFieldsException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EmptyFieldsException);
                    expect(e.data).toEqual(['driver', 'passenger']);
                    done();
                }
            });

            it('* invalid addition provided', async (done) => {
                const __given_enrollment = new Enrollment();
                __given_enrollment.name = 'existingName';
                __given_enrollment.comment = 'comment';
                __given_enrollment.additions = [new Addition()];
                __given_enrollment.additions[0].name = 'additonUndefined';
                __given_enrollment.additions[0].id = '940599c5-b6fb-4f33-a090-017e31c2b22a';
                __given_enrollment.appointment = new Appointment();
                __given_enrollment.appointment.link = 'link';
                __given_enrollment.appointment.additions = [new Addition()];
                __given_enrollment.appointment.additions[0].id = '08f642cf-ee55-4b18-84e4-69e218088753';
                __given_enrollment.appointment.additions[0].name = 'additionExisting';
                const __given_user = new User();
                __given_user.username = 'username';
                const __given_domain = 'example.com/{{0}}/{{1}}';

                const __existing_appointment = __given_enrollment.appointment;
                __existing_appointment.driverAddition = true;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment); // cant find appointment with specific link
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                try {
                    await enrollmentService.create(__given_enrollment, __given_user, __given_domain);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    expect(e.data).toEqual(JSON.stringify(__given_enrollment.additions[0]));
                    done();
                }
            });
        });
    });

    describe('* update enrollment', () => {
        it('* update name', async () => {
            const __given_enrollment_change_data = {
                name: 'newName'
            };
            const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
            const __given_user = new User();
            __given_user.username = 'username';

            const __existing_enrollment = new Enrollment();
            __existing_enrollment.id = __given_enrollment_id;
            __existing_enrollment.name = 'name';
            __existing_enrollment.creator = __given_user;
            __existing_enrollment.appointment = new Appointment();
            __existing_enrollment.appointment.creator = new User();
            __existing_enrollment.appointment.creator.id = 'bde4b628-f0ee-4e4e-a7f5-2422d8e3d348';

            enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
            enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // new name not in use
            enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

            jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                return;
            });

            const __expected = __given_enrollment_change_data.name;

            const __actual = await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
            expect(__actual.name).toBe(__expected);

        });

        it('* update comment', async () => {
            const __given_enrollment_change_data = {
                comment: 'newComment'
            };
            const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
            const __given_user = new User();
            __given_user.username = 'username';

            const __existing_enrollment = new Enrollment();
            __existing_enrollment.id = __given_enrollment_id;
            __existing_enrollment.comment = 'comment';
            __existing_enrollment.creator = __given_user;
            __existing_enrollment.appointment = new Appointment();
            __existing_enrollment.appointment.creator = new User();
            __existing_enrollment.appointment.creator.id = 'bde4b628-f0ee-4e4e-a7f5-2422d8e3d348';

            enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
            enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

            jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                return;
            });

            const __expected = __given_enrollment_change_data.comment;

            const __actual = await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
            expect(__actual.comment).toBe(__expected);

        });

        it('* update driver values', async () => {
            const __given_enrollment_change_data = {
                driver: {
                    seats: 4,
                    service: 1,
                }
            };
            const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
            const __given_user = new User();
            __given_user.username = 'username';

            const __existing_enrollment = new Enrollment();
            __existing_enrollment.id = __given_enrollment_id;
            __existing_enrollment.driver = new Driver();
            __existing_enrollment.driver.seats = 5;
            __existing_enrollment.driver.service = 2;
            __existing_enrollment.creator = __given_user;
            __existing_enrollment.appointment = new Appointment();
            __existing_enrollment.appointment.driverAddition = true;
            __existing_enrollment.appointment.creator = new User();
            __existing_enrollment.appointment.creator.id = 'bde4b628-f0ee-4e4e-a7f5-2422d8e3d348';

            enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
            driverRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment.driver);
            driverRepositoryMock.save.mockImplementationOnce((val) => val);
            enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

            jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                return;
            });

            const __expected = __given_enrollment_change_data.driver;

            const __actual = await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
            expect(__actual.driver).toEqual(__expected);
            expect(__actual.passenger).toBeUndefined();
        });

        it('* update passenger values', async () => {
            const __given_enrollment_change_data = {
                passenger: {
                    requirement: 1,
                }
            };
            const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
            const __given_user = new User();
            __given_user.username = 'username';

            const __existing_enrollment = new Enrollment();
            __existing_enrollment.id = __given_enrollment_id;
            __existing_enrollment.passenger = new Passenger();
            __existing_enrollment.passenger.requirement = 2;
            __existing_enrollment.creator = __given_user;
            __existing_enrollment.appointment = new Appointment();
            __existing_enrollment.appointment.driverAddition = true;
            __existing_enrollment.appointment.creator = new User();
            __existing_enrollment.appointment.creator.id = 'bde4b628-f0ee-4e4e-a7f5-2422d8e3d348';

            enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
            passengerRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment.passenger);
            passengerRepositoryMock.save.mockImplementationOnce((val) => val);
            enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

            jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                return;
            });

            const __expected = __given_enrollment_change_data.passenger;

            const __actual = await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
            expect(__actual.passenger).toEqual(__expected);
            expect(__actual.driver).toBeUndefined();
        });

        it('* change driver to passenger', async () => {
            const __given_enrollment_change_data = {
                passenger: {
                    requirement: 1,
                }
            };
            const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
            const __given_user = new User();
            __given_user.username = 'username';

            const __existing_enrollment = new Enrollment();
            __existing_enrollment.id = __given_enrollment_id;
            __existing_enrollment.driver = new Driver();
            __existing_enrollment.driver.seats = 5;
            __existing_enrollment.driver.service = 2;
            __existing_enrollment.passenger = undefined;
            __existing_enrollment.creator = __given_user;
            __existing_enrollment.appointment = new Appointment();
            __existing_enrollment.appointment.driverAddition = true;
            __existing_enrollment.appointment.creator = new User();
            __existing_enrollment.appointment.creator.id = 'bde4b628-f0ee-4e4e-a7f5-2422d8e3d348';

            enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
            passengerRepositoryMock.findOne.mockReturnValueOnce(undefined);
            passengerRepositoryMock.save.mockImplementationOnce((val) => val);
            enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

            jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                return;
            });

            const __expected = __given_enrollment_change_data.passenger;

            const __actual = await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
            expect(__actual.passenger).toEqual(__expected);
            expect(__actual.driver).toBeUndefined();
        });

        it('* change passenger to driver', async () => {
            const __given_enrollment_change_data = {
                driver: {
                    seats: 4,
                    service: 1,
                }
            };
            const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
            const __given_user = new User();
            __given_user.username = 'username';

            const __existing_enrollment = new Enrollment();
            __existing_enrollment.id = __given_enrollment_id;
            __existing_enrollment.passenger = new Passenger();
            __existing_enrollment.passenger.requirement = 2;
            __existing_enrollment.driver = undefined;
            __existing_enrollment.creator = __given_user;
            __existing_enrollment.appointment = new Appointment();
            __existing_enrollment.appointment.driverAddition = true;
            __existing_enrollment.appointment.creator = new User();
            __existing_enrollment.appointment.creator.id = 'bde4b628-f0ee-4e4e-a7f5-2422d8e3d348';

            enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
            driverRepositoryMock.findOne.mockReturnValueOnce(undefined);
            driverRepositoryMock.save.mockImplementationOnce((val) => val);
            enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

            jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                return;
            });

            const __expected = __given_enrollment_change_data.driver;

            const __actual = await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
            expect(__actual.driver).toEqual(__expected);
            expect(__actual.passenger).toBeUndefined();
        });
    });

    describe('* delete enrollment', () => {
        describe('* successful should return nothing', () => {
            it('successful request', async (done) => {
                const user = new User();
                user.id = '1';
                const id = '1';
                const token = 'token';

                const appointment = new Appointment();
                appointment.administrators = [];
                appointment.creator = user;

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.appointment = appointment;
                enrollment.creator = user;

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);
                enrollmentRepositoryMock.remove.mockReturnValueOnce(undefined);

                enrollmentService
                    .delete(id, token, user)
                    .then(() => {
                        done();
                    })
                    .catch((err) => {
                        throw new Error('I have failed you, Anakin. Should have gotten void');
                    });
            });
        });

        describe('* failed request should return error', () => {
            it('enrollment gone', async () => {
                const user = new User();
                user.id = '1';
                const id = '1';
                const token = 'token';

                const appointment = new Appointment();
                appointment.administrators = [];
                appointment.creator = user;

                const enrollment = new Enrollment();
                enrollment.appointment = appointment;

                enrollmentRepositoryMock.remove.mockReturnValueOnce(undefined);

                enrollmentService
                    .delete(id, token, user)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten EntityGoneException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityGoneException);
                        expect(err.data).toEqual('enrollment');
                    });
            });

            it('insufficient permissions', async () => {
                const creator = new User();
                creator.id = '2';
                creator.username = 'username';

                const user = new User();
                user.id = '1';
                user.username = 'user';
                const id = '1';
                const token = 'token';

                const appointment = new Appointment();
                appointment.administrators = [];
                appointment.creator = creator;

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.appointment = appointment;
                enrollment.creator = creator;

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);

                enrollmentService
                    .delete(id, token, user)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten InsufficientPermissionsException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(InsufficientPermissionsException);
                    });
            });
        });
    });

    describe('* check Permissions', () => {
        describe('* successful should return allowance object', () => {
            it('appointment creator', async () => {
                const user = new User();
                user.id = '1';

                const otherUser = new User();
                user.id = '';

                const id = '1';
                const token = '';

                const appointment = new Appointment();
                appointment.creator = user;
                appointment.administrators = [];

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.creator = otherUser;
                enrollment.appointment = appointment;

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);

                const actual = await enrollmentService.checkPermissions(id, user, token);
                expect(actual).toEqual(['user']);
            });

            it('appointment administrator', async () => {
                const user = new User();
                user.id = '1';

                const otherUser = new User();
                user.id = '';

                const id = '1';
                const token = '';

                const appointment = new Appointment();
                appointment.creator = otherUser;
                appointment.administrators = [user];

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.creator = otherUser;
                enrollment.appointment = appointment;

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);

                const actual = await enrollmentService.checkPermissions(id, user, token);
                expect(actual).toEqual(['user']);
            });

            it('enrollment creator', async () => {
                const user = new User();
                user.id = '1';

                const otherUser = new User();
                user.id = '';

                const id = '1';
                const token = '';

                const appointment = new Appointment();
                appointment.creator = otherUser;
                appointment.administrators = [];

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.creator = user;
                enrollment.appointment = appointment;

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);

                const actual = await enrollmentService.checkPermissions(id, user, token);
                expect(actual).toEqual(['user']);
            });

            it('valid token', async () => {
                const user = new User();
                user.id = '1';
                user.username = 'user';

                const otherUser = new User();
                user.id = '2';
                user.username = 'creator';

                const appointment = new Appointment();
                appointment.creator = otherUser;
                appointment.administrators = [];

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.creator = otherUser;
                enrollment.appointment = appointment;

                const id = '1';
                const token = crypto.createHash('sha256')
                    .update(enrollment.id + process.env.SALT_ENROLLMENT)
                    .digest('hex');

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);

                const actual = await enrollmentService.checkPermissions(id, user, token);
                expect(actual).toEqual(['token']);
            });

            it('appointment creator and valid token', async () => {
                const user = new User();
                user.id = '1';

                const otherUser = new User();
                user.id = '';

                const appointment = new Appointment();
                appointment.creator = user;
                appointment.administrators = [];

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.creator = otherUser;
                enrollment.appointment = appointment;

                const id = '1';
                const token = crypto.createHash('sha256')
                    .update(enrollment.id + process.env.SALT_ENROLLMENT)
                    .digest('hex');
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);

                const actual = await enrollmentService.checkPermissions(id, user, token);
                expect(actual).toEqual(['user', 'token']);
            });

            it('appointment administrator and valid token', async () => {
                const user = new User();
                user.id = '1';

                const otherUser = new User();
                user.id = '';

                const appointment = new Appointment();
                appointment.creator = otherUser;
                appointment.administrators = [user];

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.creator = otherUser;
                enrollment.appointment = appointment;

                const id = '1';
                const token = crypto.createHash('sha256')
                    .update(enrollment.id + process.env.SALT_ENROLLMENT)
                    .digest('hex');

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);

                const actual = await enrollmentService.checkPermissions(id, user, token);
                expect(actual).toEqual(['user', 'token']);
            });

            it('enrollment creator and valid token', async () => {
                const user = new User();
                user.id = '1';

                const otherUser = new User();
                user.id = '';

                const appointment = new Appointment();
                appointment.creator = otherUser;
                appointment.administrators = [];

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.creator = user;
                enrollment.appointment = appointment;

                const id = '1';
                const token = crypto.createHash('sha256')
                    .update(enrollment.id + process.env.SALT_ENROLLMENT)
                    .digest('hex');

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);

                const actual = await enrollmentService.checkPermissions(id, user, token);
                expect(actual).toEqual(['user', 'token']);
            });
        });

        describe('* failure should return error', () => {
            it('enrollment not found', async () => {
                const id = '1';
                const user = new User();
                const token = 'token';

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                enrollmentService
                    .checkPermissions(id, user, token)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toEqual('enrollment');
                    });
            });

            it('insufficient permissions', async () => {
                const creator = new User();
                creator.id = '1';
                creator.username = 'creator';

                const user = new User();
                user.id = '2';
                user.username = 'username';

                const appointment = new Appointment();
                appointment.creator = creator;
                appointment.administrators = [];

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.creator = creator;
                enrollment.appointment = appointment;

                const id = '1';
                const token = 'token';

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);

                enrollmentService
                    .checkPermissions(id, user, token)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an InsufficientPermissionsException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(InsufficientPermissionsException);
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
