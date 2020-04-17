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
import {Key} from './key/key.entity';
import {Mail} from './mail/mail.entity';
import {DriverService} from './driver/driver.service';
import {PassengerService} from './passenger/passenger.service';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {EmptyFieldsException} from '../../exceptions/EmptyFieldsException';

const crypto = require('crypto');

describe('EnrollmentService', () => {
    let enrollmentService: EnrollmentService;
    let userService: UserService;
    let appointmentService: AppointmentService;
    let fileService: FileService;
    let additionService: AdditionService;
    let mailerService: MailerService;
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
    let keyRepositoryMock: MockType<Repository<Key>>;
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
                {provide: getRepositoryToken(Enrollment), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(User), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Appointment), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(User), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(File), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Addition), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(TelegramUser), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(PasswordReset), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(PasswordChange), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(EmailChange), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Driver), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Passenger), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Key), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Mail), useFactory: repositoryMockFactory},
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
        mailerService = module.get<MailerService>(MailerService);

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
        keyRepositoryMock = module.get(getRepositoryToken(Key));
        mailRepositoryMock = module.get(getRepositoryToken(Mail));
    });

    it('should be defined', () => {
        expect(enrollmentService).toBeDefined();
    });

    describe('* create enrollment', () => {
        describe('* successful should return created entity', () => {
            it('successful request - as logged in user', async () => {
                const user = new User();
                const enrollment = new Enrollment();
                const appointment = new Appointment();
                appointment.link = 'link';
                enrollment.appointment = appointment;
                const domain = 'domain';

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);
                jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                const actual = await enrollmentService.create(enrollment, user, domain);
                expect(typeof actual).toBe('object');
                expect(actual.createdByUser).toBe(true);
            });

            it('successful request - with mail', async () => {
                const user = undefined;
                const enrollment = new Enrollment();
                enrollment.editMail = 'mail@example.com';
                const appointment = new Appointment();
                appointment.link = 'link';
                enrollment.appointment = appointment;
                const domain = 'domain';

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                mailRepositoryMock.save.mockImplementationOnce((val) => val);
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => {
                    val.id = '' + Date.now();
                    return val;
                });
                jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                const actual = await enrollmentService.create(enrollment, user, domain);
                expect(typeof actual).toBe('object');
                expect(actual.createdByUser).toBe(false);
                expect(actual.token).toMatch(/^.{64}$/);
            });

            it('successful request - logged in - handle additions', async () => {
                const user = new User();

                const appointment = new Appointment();
                appointment.link = 'link';

                const addition = new Addition();
                addition.id = '1';
                appointment.additions = [addition];

                const enrollment = new Enrollment();
                enrollment.additions = [addition];
                enrollment.appointment = appointment;

                const domain = 'domain';

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => {
                    val.id = '' + Date.now();
                    return val;
                });
                jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                const actual = await enrollmentService.create(enrollment, user, domain);
                expect(typeof actual).toBe('object');
                expect(actual.additions).toEqual([addition]);
            });

            it('successful request - logged in - as driver', async () => {
                const user = new User();

                const appointment = new Appointment();
                appointment.link = 'link';
                appointment.driverAddition = true;

                const addition = new Addition();
                addition.id = '1';
                appointment.additions = [addition];

                const enrollment = new Enrollment();
                enrollment.additions = [addition];
                enrollment.appointment = appointment;

                const driver = new Driver();
                driver.seats = 4;
                driver.service = 1;
                enrollment.driver = driver;

                const domain = 'domain';

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                driverRepositoryMock.findOne.mockReturnValueOnce(undefined);
                driverRepositoryMock.save.mockImplementationOnce((val) => {
                    val.id = '' + Date.now();
                    return val;
                });
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => {
                    val.id = '' + Date.now();
                    return val;
                });
                jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                const actual = await enrollmentService.create(enrollment, user, domain);
                expect(typeof actual).toBe('object');
                expect(actual.driver).toMatchObject({
                    seats: driver.seats,
                    service: driver.service
                });
                expect(actual.passenger).toBe(undefined);
            });

            it('successful request - logged in - as passenger', async () => {
                const user = new User();

                const appointment = new Appointment();
                appointment.link = 'link';
                appointment.driverAddition = true;

                const addition = new Addition();
                addition.id = '1';
                appointment.additions = [addition];

                const enrollment = new Enrollment();
                enrollment.additions = [addition];
                enrollment.appointment = appointment;

                const passenger = new Passenger();
                passenger.requirement = 1;
                enrollment.passenger = passenger;

                const domain = 'domain';

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
                passengerRepositoryMock.findOne.mockReturnValueOnce(undefined);
                passengerRepositoryMock.save.mockImplementationOnce((val) => {
                    val.id = '' + Date.now();
                    return val;
                });
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => {
                    val.id = '' + Date.now();
                    return val;
                });
                jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                const actual = await enrollmentService.create(enrollment, user, domain);
                expect(typeof actual).toBe('object');
                expect(actual.passenger).toMatchObject({
                    requirement: passenger.requirement
                });
                expect(actual.driver).toBe(undefined);
            });
        });

        describe('* failure should return error', () => {
            it('appointment not found', async () => {
                const enrollment = new Enrollment();
                const appointment = new Appointment();
                appointment.link = 'link';
                enrollment.appointment = appointment;
                const user = undefined;
                const domain = 'domain';

                appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                enrollmentService.create(enrollment, user, domain)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toBe('appointment');
                    });
            });

            it('name already in use', async () => {
                const enrollment = new Enrollment();
                const appointment = new Appointment();
                appointment.link = 'link';
                enrollment.appointment = appointment;
                const user = undefined;
                const domain = 'domain';

                appointmentRepositoryMock.findOne.mockReturnValueOnce(new Appointment());
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);

                enrollmentService.create(enrollment, user, domain)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an DuplicateValueException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(DuplicateValueException);
                        expect(err.data).toEqual(['name']);
                    });
            });

            it('addition not existing', async () => {
                const enrollment = new Enrollment();
                const addition = new Addition();
                addition.id = '1';
                addition.name = 'addition';
                enrollment.additions = [addition];
                const appointment = new Appointment();
                appointment.link = 'link';
                appointment.additions = [];
                enrollment.appointment = appointment;
                const user = undefined;
                const domain = 'domain';

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                enrollmentService.create(enrollment, user, domain)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toEqual(JSON.stringify(addition));
                    });
            });

            it('neither driver nor passenger // SHOULD NOT HAPPEN DUE TO PRE CHECK', async () => {
                const enrollment = new Enrollment();
                const user = undefined;
                const domain = 'domain';

                const appointment = new Appointment();
                appointment.driverAddition = true;
                appointment.link = 'link';
                enrollment.appointment = appointment;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                enrollmentService.create(enrollment, user, domain)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EmptyFieldsException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EmptyFieldsException);
                        expect(err.data).toEqual(['driver', 'passenger']);
                    });
            });
        });
    });

    describe('* update enrollment', () => {
        describe('* successful should return updated entity', () => {
            it('update name', async () => {
                const toChange = {
                    name: 'newName'
                };
                const id = '1';
                const user = new User();
                user.id = '1';
                const token = '';

                const appointment = new Appointment();
                appointment.creator = user;
                appointment.administrators = [];

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.name = 'oldName';
                enrollment.creator = user;
                enrollment.appointment = appointment;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                const actual = await enrollmentService.update(toChange, id, user, token);
                expect(actual.name).toEqual(toChange.name);
            });

            it('update comment', async () => {
                const toChange = {
                    comment: 'this is a new comment'
                };
                const id = '1';
                const user = new User();
                user.id = '1';
                const token = '';

                const appointment = new Appointment();
                appointment.creator = user;
                appointment.administrators = [];

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.comment = 'old comment';
                enrollment.creator = user;
                enrollment.appointment = appointment;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                const actual = await enrollmentService.update(toChange, id, user, token);
                expect(actual.comment).toEqual(toChange.comment);
            });

            describe('* update additions', () => {
                it('add one', async () => {
                    const addition = new Addition();
                    addition.id = '1';
                    addition.name = 'addition';

                    const toChange = {
                        additions: [addition]
                    };
                    const id = '1';
                    const user = new User();
                    user.id = '1';
                    const token = '';

                    const appointment = new Appointment();
                    appointment.creator = user;
                    appointment.administrators = [];
                    appointment.additions = [addition];

                    const enrollment = new Enrollment();
                    enrollment.id = '1';
                    enrollment.comment = 'old comment';
                    enrollment.creator = user;
                    enrollment.appointment = appointment;
                    enrollment.additions = [];

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                    enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);
                    enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    const actual = await enrollmentService.update(toChange, id, user, token);
                    expect(actual.additions).toEqual(toChange.additions);
                });

                it('remove one - from 1', async () => {
                    const addition = new Addition();
                    addition.id = '1';
                    addition.name = 'addition';

                    const toChange = {
                        additions: []
                    };
                    const id = '1';
                    const user = new User();
                    user.id = '1';
                    const token = '';

                    const appointment = new Appointment();
                    appointment.creator = user;
                    appointment.administrators = [];
                    appointment.additions = [addition];

                    const enrollment = new Enrollment();
                    enrollment.id = '1';
                    enrollment.comment = 'old comment';
                    enrollment.creator = user;
                    enrollment.appointment = appointment;
                    enrollment.additions = [addition];

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                    enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);
                    enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    const actual = await enrollmentService.update(toChange, id, user, token);
                    expect(actual.additions).toEqual(toChange.additions);
                });

                it('remove one - from 2', async () => {
                    const addition1 = new Addition();
                    addition1.id = '1';
                    addition1.name = 'addition1';
                    const addition2 = new Addition();
                    addition2.id = '2';
                    addition2.name = 'addition2';

                    const toChange = {
                        additions: [addition1]
                    };
                    const id = '1';
                    const user = new User();
                    user.id = '1';
                    const token = '';

                    const appointment = new Appointment();
                    appointment.creator = user;
                    appointment.administrators = [];
                    appointment.additions = [addition1, addition2];

                    const enrollment = new Enrollment();
                    enrollment.id = '1';
                    enrollment.comment = 'old comment';
                    enrollment.creator = user;
                    enrollment.appointment = appointment;
                    enrollment.additions = [addition1, addition2];

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                    enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);
                    enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    const actual = await enrollmentService.update(toChange, id, user, token);
                    expect(actual.additions).toEqual(toChange.additions);
                });
            });
        });

        describe('* update driver', () => {
            it('from passenger to driver', async () => {
                const driver = new Driver();
                driver.seats = 1;
                driver.service = 1;

                const toChange = {
                    driver: driver
                };

                const id = '1';
                const user = new User();
                user.id = '1';
                const token = '';

                const appointment = new Appointment();
                appointment.creator = user;
                appointment.administrators = [];
                appointment.driverAddition = true;

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.comment = 'old comment';
                enrollment.creator = user;
                enrollment.appointment = appointment;
                enrollment.passenger = new Passenger();
                enrollment.driver = null;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);
                driverRepositoryMock.findOne.mockReturnValueOnce(undefined);
                driverRepositoryMock.save.mockImplementationOnce((val) => val);
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                const actual = await enrollmentService.update(toChange, id, user, token);
                expect(actual.driver).toEqual(toChange.driver);
                expect(actual.passenger).toEqual(undefined);
            });

            it('update driver seats', async () => {
                const currentDriver = new Driver();
                currentDriver.seats = 1;
                currentDriver.service = 1;

                const newDriver = new Driver();
                newDriver.seats = 2;
                newDriver.service = 1;

                const toChange = {
                    driver: newDriver
                };

                const id = '1';
                const user = new User();
                user.id = '1';
                const token = '';

                const appointment = new Appointment();
                appointment.creator = user;
                appointment.administrators = [];
                appointment.driverAddition = true;

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.creator = user;
                enrollment.appointment = appointment;
                enrollment.driver = currentDriver;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);
                driverRepositoryMock.findOne.mockReturnValueOnce(currentDriver);
                driverRepositoryMock.save.mockImplementationOnce((val) => val);
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                const actual = await enrollmentService.update(toChange, id, user, token);
                expect(actual.driver).toEqual(toChange.driver);
                expect(actual.passenger).toEqual(undefined);
            });

            it('update driver service', async () => {
                const currentDriver = new Driver();
                currentDriver.seats = 1;
                currentDriver.service = 1;

                const newDriver = new Driver();
                newDriver.seats = 1;
                newDriver.service = 2;

                const toChange = {
                    driver: newDriver
                };

                const id = '1';
                const user = new User();
                user.id = '1';
                const token = '';

                const appointment = new Appointment();
                appointment.creator = user;
                appointment.administrators = [];
                appointment.driverAddition = true;

                const enrollment = new Enrollment();
                enrollment.id = '1';
                enrollment.creator = user;
                enrollment.appointment = appointment;
                enrollment.driver = currentDriver;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);
                driverRepositoryMock.findOne.mockReturnValueOnce(currentDriver);
                driverRepositoryMock.save.mockImplementationOnce((val) => val);
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                const actual = await enrollmentService.update(toChange, id, user, token);
                expect(actual.driver).toEqual(toChange.driver);
                expect(actual.passenger).toEqual(undefined);
            });

            describe('* update passenger', () => {
                it('from driver to passenger', async () => {
                    const passenger = new Passenger();
                    passenger.requirement = 1;

                    const toChange = {
                        passenger: passenger
                    };

                    const id = '1';
                    const user = new User();
                    user.id = '1';
                    const token = '';

                    const appointment = new Appointment();
                    appointment.creator = user;
                    appointment.administrators = [];
                    appointment.driverAddition = true;

                    const enrollment = new Enrollment();
                    enrollment.id = '1';
                    enrollment.creator = user;
                    enrollment.appointment = appointment;
                    enrollment.driver = new Driver();
                    enrollment.passenger = null;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                    enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);
                    passengerRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    passengerRepositoryMock.save.mockImplementationOnce((val) => val);
                    enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    const actual = await enrollmentService.update(toChange, id, user, token);
                    expect(actual.passenger).toEqual(toChange.passenger);
                    expect(actual.driver).toEqual(undefined);
                });

                it('update passenger requirement', async () => {
                    const currentPassenger = new Passenger();
                    currentPassenger.requirement = 1;

                    const newPassenger = new Passenger();
                    newPassenger.requirement = 2;

                    const toChange = {
                        passenger: newPassenger
                    };

                    const id = '1';
                    const user = new User();
                    user.id = '1';
                    const token = '';

                    const appointment = new Appointment();
                    appointment.creator = user;
                    appointment.administrators = [];
                    appointment.driverAddition = true;

                    const enrollment = new Enrollment();
                    enrollment.id = '1';
                    enrollment.creator = user;
                    enrollment.appointment = appointment;
                    enrollment.driver = null;
                    enrollment.passenger = currentPassenger;

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(appointment);
                    enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);
                    passengerRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    passengerRepositoryMock.save.mockImplementationOnce((val) => val);
                    enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    const actual = await enrollmentService.update(toChange, id, user, token);
                    expect(actual.passenger).toEqual(toChange.passenger);
                    expect(actual.driver).toEqual(undefined);
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
