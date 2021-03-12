import {Test, TestingModule} from '@nestjs/testing';
import {EnrollmentService} from './enrollment.service';
import {UserService} from '../user/user.service';
import {MailerService} from '@nest-modules/mailer';
import {Repository} from 'typeorm';
import {User} from '../user/user.entity';
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
import {MissingAuthenticationException} from '../../exceptions/MissingAuthenticationException';
import {InvalidAttributesException} from '../../exceptions/InvalidAttributesException';
import {PushSubscription} from '../push/pushSubscription.entity';
import {PushService} from '../push/push.service';

const crypto = require('crypto');

describe('EnrollmentService', () => {
    let enrollmentService: EnrollmentService;
    let userService: UserService;
    let pushService: PushService;
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
    let driverRepositoryMock: MockType<Repository<Driver>>;
    let passengerRepositoryMock: MockType<Repository<Passenger>>;
    let mailRepositoryMock: MockType<Repository<Mail>>;
    let pushSubscriptionRepositoryMock: MockType<Repository<PushSubscription>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [EnrollmentService,
                UserService,
                PushService,
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
        pushService = module.get<PushService>(PushService);
        appointmentGateway = module.get<AppointmentGateway>(AppointmentGateway);

        enrollmentRepositoryMock = module.get(getRepositoryToken(Enrollment));
        userRepositoryMock = module.get(getRepositoryToken(User));
        additionRepositoryMock = module.get(getRepositoryToken(Addition));
        appointmentRepositoryMock = module.get(getRepositoryToken(Appointment));
        fileRepositoryMock = module.get(getRepositoryToken(File));
        driverRepositoryMock = module.get(getRepositoryToken(Driver));
        passengerRepositoryMock = module.get(getRepositoryToken(Passenger));
        mailRepositoryMock = module.get(getRepositoryToken(Mail));
        pushSubscriptionRepositoryMock = module.get(getRepositoryToken(PushSubscription));
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

                it('* as not logged in user maill send fails', async () => {
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

                    jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.reject({}));

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
                __given_enrollment.editMail = 'mail@example.com';
                const __given_user = undefined;
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

            it('* already enrolled (logged in)', async (done) => {
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
                    expect(e.data).toEqual(['creator']);
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

            it('* missing authentication', async (done) => {
                const __given_enrollment = new Enrollment();
                __given_enrollment.name = 'name';
                __given_enrollment.comment = 'comment';
                const __given_user = undefined;

                const __given_domain = 'example.com/{{0}}/{{1}}';

                const __existing_appointment = new Appointment();
                __existing_appointment.link = 'link';

                __given_enrollment.appointment = __existing_appointment;

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment); // cant find appointment with specific link

                enrollmentRepositoryMock.findOne.mockImplementationOnce(undefined);

                try {
                    await enrollmentService.create(__given_enrollment, __given_user, __given_domain);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an MissingAuthenticationException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(MissingAuthenticationException);
                    done();
                }
            });
        });
    });

    describe('* update enrollment', () => {
        describe('* successful should return updated entity', () => {
            it('* update name (normal enrollment, permission via appointment creator)', async () => {
                const __given_enrollment_change_data = {
                    name: 'newName'
                };
                const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
                const __given_user = new User();
                __given_user.username = 'username';

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.id = __given_enrollment_id;
                __existing_enrollment.name = 'name';
                __existing_enrollment.appointment = new Appointment();
                __existing_enrollment.appointment.creator = __given_user;
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
                expect(driverRepositoryMock.save).toHaveBeenCalledTimes(1);
            });

            it('* update driver values - nothing changed', async () => {
                const __given_enrollment_change_data = {
                    driver: {
                        seats: 5,
                        service: 2,
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
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                    return;
                });

                const __expected = __given_enrollment_change_data.driver;

                const __actual = await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
                expect(__actual.driver).toEqual(__expected);
                expect(__actual.passenger).toBeUndefined();
                expect(driverRepositoryMock.save).toHaveBeenCalledTimes(0);
            });

            it('* update driver values - driver addition not set', async () => {
                const __given_enrollment_change_data = {
                    driver: {
                        seats: 5,
                        service: 2,
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
                __existing_enrollment.appointment.driverAddition = false;
                __existing_enrollment.appointment.creator = new User();
                __existing_enrollment.appointment.creator.id = 'bde4b628-f0ee-4e4e-a7f5-2422d8e3d348';

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
                driverRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment.driver);
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                    return;
                });

                const __expected = __given_enrollment_change_data.driver;

                const __actual = await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
                expect(__actual.driver).toEqual(__expected);
                expect(__actual.passenger).toBeUndefined();
                expect(driverRepositoryMock.save).toHaveBeenCalledTimes(0);
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
                expect(passengerRepositoryMock.save).toHaveBeenCalledTimes(1);
            });

            it('* update passenger values - nothing changed', async () => {
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
                __existing_enrollment.passenger.requirement = 1;
                __existing_enrollment.creator = __given_user;
                __existing_enrollment.appointment = new Appointment();
                __existing_enrollment.appointment.driverAddition = true;
                __existing_enrollment.appointment.creator = new User();
                __existing_enrollment.appointment.creator.id = 'bde4b628-f0ee-4e4e-a7f5-2422d8e3d348';

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
                passengerRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment.passenger);
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                    return;
                });

                const __expected = __given_enrollment_change_data.passenger;

                const __actual = await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
                expect(__actual.passenger).toEqual(__expected);
                expect(__actual.driver).toBeUndefined();
                expect(passengerRepositoryMock.save).toHaveBeenCalledTimes(0);
            });

            it('* update passenger values - driver addition not set', async () => {
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
                __existing_enrollment.passenger.requirement = 1;
                __existing_enrollment.creator = __given_user;
                __existing_enrollment.appointment = new Appointment();
                __existing_enrollment.appointment.driverAddition = false;
                __existing_enrollment.appointment.creator = new User();
                __existing_enrollment.appointment.creator.id = 'bde4b628-f0ee-4e4e-a7f5-2422d8e3d348';

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
                passengerRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment.passenger);
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                    return;
                });

                const __expected = __given_enrollment_change_data.passenger;

                const __actual = await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
                expect(__actual.passenger).toEqual(__expected);
                expect(__actual.driver).toBeUndefined();
                expect(passengerRepositoryMock.save).toHaveBeenCalledTimes(0);
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
                expect(passengerRepositoryMock.save).toHaveBeenCalledTimes(1);
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
                expect(driverRepositoryMock.save).toHaveBeenCalledTimes(1);
            });

            it('* update additions', async () => {
                const __existing_addition = new Addition();
                __existing_addition.id = '24c53466-338e-4331-9640-98c8649d60f7';
                __existing_addition.name = 'addition';

                const __given_enrollment_change_data = {
                    additions: [
                        __existing_addition
                    ]
                };
                const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
                const __given_user = new User();
                __given_user.username = 'username';

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.id = __given_enrollment_id;
                __existing_enrollment.creator = __given_user;
                __existing_enrollment.additions = [__existing_addition];
                __existing_enrollment.appointment = new Appointment();
                __existing_enrollment.appointment.additions = [__existing_addition];
                __existing_enrollment.appointment.creator = new User();
                __existing_enrollment.appointment.creator.id = 'bde4b628-f0ee-4e4e-a7f5-2422d8e3d348';

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // new name not in use
                enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                    return;
                });

                const __expected = __given_enrollment_change_data.additions;

                const __actual = await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
                expect(__actual.additions).toEqual(__expected);
            });

            it('* update non existing attribute', async () => {
                const __given_enrollment_change_data = {
                    invalid: 'attribute'
                };
                const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
                const __given_user = new User();
                __given_user.username = 'username';
                __given_user.name = 'name';

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

                const __expected = {
                    id: __existing_enrollment.id,
                    creator: {
                        username: __given_user.username,
                        name: __given_user.name
                    },
                    createdByUser: true
                };

                const __actual = await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
                expect(__actual).toEqual(__expected);
            });
        });

        describe('* failure should return error', () => {
            it('* enrollment not found', async (done) => {
                const __given_enrollment_change_data = {
                    name: 'existing_name'
                };
                const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
                const __given_user = new User();
                __given_user.id = '909f67be-c59d-48c1-a85a-2efbffa5e78d';
                __given_user.username = 'username';

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                try {
                    await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    expect(e.data).toBe('enrollment');
                    done();
                }
            });

            it('* insufficient permissions', async (done) => {
                const __given_enrollment_change_data = {
                    name: 'existing_name'
                };
                const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
                const __given_user = new User();
                __given_user.id = '909f67be-c59d-48c1-a85a-2efbffa5e78d';
                __given_user.username = 'username';

                const __existing_user = new User();
                __existing_user.id = '9a2de186-f86c-4a2e-b589-f4fd3ced6152';
                __existing_user.username = 'creator';

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.id = __given_enrollment_id;
                __existing_enrollment.name = 'name';
                __existing_enrollment.creator = __existing_user;
                __existing_enrollment.appointment = new Appointment();
                __existing_enrollment.appointment.creator = __existing_user;

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);

                try {
                    await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an InsufficientPermissionsException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(InsufficientPermissionsException);
                    done();
                }
            });

            describe('* duplicate name', () => {
                it('* normal enrollment (permission via appointment creator)', async (done) => {
                    const __given_enrollment_change_data = {
                        name: 'existing_name'
                    };
                    const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
                    const __given_user = new User();
                    __given_user.username = 'username';

                    const __existing_enrollment = new Enrollment();
                    __existing_enrollment.id = __given_enrollment_id;
                    __existing_enrollment.name = 'name';
                    __existing_enrollment.appointment = new Appointment();
                    __existing_enrollment.appointment.creator = __given_user;
                    __existing_enrollment.appointment.creator.id = 'bde4b628-f0ee-4e4e-a7f5-2422d8e3d348';

                    const __existing_enrollment_by_name = new Enrollment();

                    enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
                    enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment_by_name);
                    enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    try {
                        await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten an DuplicateValueException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(DuplicateValueException);
                        expect(e.data).toEqual(['name']);
                        done();
                    }

                });

                it('* creator enrollment - name update not allowed / possible', async (done) => {
                    const __given_enrollment_change_data = {
                        name: 'existing_name'
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

                    const __existing_enrollment_by_name = new Enrollment();

                    enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
                    enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment_by_name);
                    enrollmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    try {
                        await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten an InvalidAttributesException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(InvalidAttributesException);
                        expect(e.data).toEqual(['name']);
                        done();
                    }

                });
            });

            it('* invalid addition provided', async (done) => {
                const __given_addition = new Addition();
                __given_addition.id = '24c53466-338e-4331-9640-98c8649d60f7';
                __given_addition.name = 'addition';

                const __existing_addition = new Addition();
                __existing_addition.id = '3c34ea1e-b4bc-4017-b563-48c25fa395a5';
                __existing_addition.name = 'existing';

                const __given_enrollment_change_data = {
                    additions: [
                        __given_addition
                    ]
                };
                const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
                const __given_user = new User();
                __given_user.username = 'username';

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.id = __given_enrollment_id;
                __existing_enrollment.name = 'name';
                __existing_enrollment.creator = __given_user;
                __existing_enrollment.additions = [__existing_addition];
                __existing_enrollment.appointment = new Appointment();
                __existing_enrollment.appointment.additions = [__existing_addition];
                __existing_enrollment.appointment.creator = new User();
                __existing_enrollment.appointment.creator.id = 'bde4b628-f0ee-4e4e-a7f5-2422d8e3d348';

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);
                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // new name not in use

                jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                    return;
                });

                try {
                    await enrollmentService.update(__given_enrollment_change_data, __given_enrollment_id, __given_user);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    expect(e.data).toEqual(JSON.stringify(__given_addition));
                    done();
                }
            });
        });
    });

    describe('* delete enrollment', () => {
        it('* successful should return nothing', async () => {
            const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
            const __given_token = '';
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
            enrollmentRepositoryMock.remove.mockImplementationOnce((val) => val);

            jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                return;
            });

            await enrollmentService.delete(__given_enrollment_id, __given_token, __given_user);
            expect(enrollmentRepositoryMock.remove).toHaveBeenCalledTimes(1);

        });

        describe('* failed request should return error', () => {
            it('* enrollment gone', async (done) => {
                const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
                const __given_token = '';
                const __given_user = new User();
                __given_user.username = 'username';

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                try {
                    await enrollmentService.delete(__given_enrollment_id, __given_token, __given_user);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityGoneException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityGoneException);
                    expect(e.data).toEqual('enrollment');
                    done();
                }
            });

            it('* insufficient permissions', async (done) => {
                const __given_enrollment_id = 'a48cc175-e11a-4f0c-a133-27608f5c63b4';
                const __given_token = '';
                const __given_user = new User();
                __given_user.id = '909f67be-c59d-48c1-a85a-2efbffa5e78d';
                __given_user.username = 'username';

                const __existing_user = new User();
                __existing_user.id = '9a2de186-f86c-4a2e-b589-f4fd3ced6152';
                __existing_user.username = 'creator';

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.id = __given_enrollment_id;
                __existing_enrollment.name = 'name';
                __existing_enrollment.creator = __existing_user;
                __existing_enrollment.appointment = new Appointment();
                __existing_enrollment.appointment.creator = __existing_user;

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);

                try {
                    await enrollmentService.delete(__given_enrollment_id, __given_token, __given_user);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an InsufficientPermissionsException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(InsufficientPermissionsException);
                    done();
                }
            });
        });
    });

    describe('* check Permissions', () => {
        describe('* successful should return allowance object', () => {
            it('* by user (enrollment creator)', async () => {
                const __given_enrollment_id = 'c93118a9-d6cd-412f-9990-fe56c28cf70a';
                const __given_user = new User();
                __given_user.id = '32fb8012-8115-4ee0-8a29-c256936bdf9a';
                const __given_token = '';

                const __existing_appointment = new Appointment();
                __existing_appointment.creator = new User();
                __existing_appointment.creator.id = '4cd9b7ff-e157-416d-bb1c-d3847a96e866';
                __existing_appointment.administrators = [];

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.id = __given_enrollment_id;
                __existing_enrollment.creator = __given_user;
                __existing_enrollment.appointment = __existing_appointment;

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);

                const __actual = await enrollmentService.checkPermissions(__given_enrollment_id, __given_user, __given_token);
                expect(__actual).toEqual(['user']);
            });

            it('* by token', async () => {
                const __given_enrollment_id = 'c93118a9-d6cd-412f-9990-fe56c28cf70a';
                const __given_user = new User();
                __given_user.id = '32fb8012-8115-4ee0-8a29-c256936bdf9a';
                __given_user.username = 'username';
                const __given_token = crypto.createHash('sha256')
                    .update(__given_enrollment_id + process.env.SALT_ENROLLMENT)
                    .digest('hex');

                const __existing_appointment = new Appointment();
                __existing_appointment.creator = new User();
                __existing_appointment.creator.id = '4cd9b7ff-e157-416d-bb1c-d3847a96e866';
                __existing_appointment.creator.username = 'creator';
                __existing_appointment.administrators = [];

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.id = __given_enrollment_id;
                __existing_enrollment.creator = __existing_appointment.creator;
                __existing_enrollment.appointment = __existing_appointment;

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);

                const __actual = await enrollmentService.checkPermissions(__given_enrollment_id, __given_user, __given_token);
                expect(__actual).toEqual(['token']);
            });
        });

        describe('* failure should return error', () => {
            it('* enrollment not found', async (done) => {
                const __given_enrollment_id = 'c93118a9-d6cd-412f-9990-fe56c28cf70a';
                const __given_user = new User();
                __given_user.id = '32fb8012-8115-4ee0-8a29-c256936bdf9a';
                const __given_token = '';

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                try {
                    await enrollmentService.checkPermissions(__given_enrollment_id, __given_user, __given_token);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    expect(e.data).toEqual('enrollment');
                    done();
                }
            });

            it('* missing permissions', async (done) => {
                const __given_enrollment_id = 'c93118a9-d6cd-412f-9990-fe56c28cf70a';
                const __given_user = new User();
                __given_user.id = '32fb8012-8115-4ee0-8a29-c256936bdf9a';
                __given_user.username = 'username';
                const __given_token = '';

                const __existing_appointment = new Appointment();
                __existing_appointment.creator = new User();
                __existing_appointment.creator.id = '4cd9b7ff-e157-416d-bb1c-d3847a96e866';
                __existing_appointment.creator.username = 'creator';
                __existing_appointment.administrators = [];

                const __existing_enrollment = new Enrollment();
                __existing_enrollment.id = __given_enrollment_id;
                __existing_enrollment.creator = __existing_appointment.creator;
                __existing_enrollment.appointment = __existing_appointment;

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(__existing_enrollment);

                try {
                    await enrollmentService.checkPermissions(__given_enrollment_id, __given_user, __given_token);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an InsufficientPermissionsException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(InsufficientPermissionsException);
                    done();
                }
            });
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
})
;

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
