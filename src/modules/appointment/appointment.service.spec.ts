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
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {InvalidValuesException} from '../../exceptions/InvalidValuesException';
import {UnknownUserException} from '../../exceptions/UnknownUserException';
import {AppointmentGateway} from './appointment.gateway';
import {PushService} from '../push/push.service';
import {PushSubscription} from '../push/pushSubscription.entity';
import {User} from '../user/user.model';
import {anyString, instance, mock, spy, verify, when} from 'ts-mockito';

describe('AppointmentService', () => {
    let module: TestingModule;

    let appointmentService: AppointmentService;
    let appointmentGateway: AppointmentGateway;
    let userService: UserService;

    let appointmentRepositoryMock: MockType<Repository<Appointment>>;
    let pushSubscriptionRepositoryMock: MockType<Repository<PushSubscription>>;
    let userRepositoryMock: MockType<Repository<User>>;
    let fileRepositoryMock: MockType<Repository<File>>;
    let additionRepositoryMock: MockType<Repository<Addition>>;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [AppointmentService,
                UserService,
                AdditionService,
                FileService,
                MailerService,
                PushService,
                AppointmentGateway,
                {provide: getRepositoryToken(Appointment), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(PushSubscription), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(User), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(File), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Addition), useFactory: repositoryMockFactory},
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
        userService = module.get<UserService>(UserService);

        appointmentRepositoryMock = module.get(getRepositoryToken(Appointment));
        userRepositoryMock = module.get(getRepositoryToken(User));
        fileRepositoryMock = module.get(getRepositoryToken(File));
        additionRepositoryMock = module.get(getRepositoryToken(Addition));
        pushSubscriptionRepositoryMock = module.get(getRepositoryToken(PushSubscription));
    });

    it('should be defined', () => {
        expect(appointmentService).toBeDefined();
    });

    describe('* is creator or administrator', () => {
        describe('* should return true if successful', () => {
            it('* requesting as creator', async () => {
                const link = 'link';

                const mockedUser_requester = mock(User);

                const mockedAppointment = mock(Appointment);
                const mockedAppointmentInstance = instance(mockedAppointment);

                const mockedAppointmentServiceSpy = spy(appointmentService);

                when(mockedAppointment.isCreatorOrAdministrator(mockedUser_requester)).thenReturn(true);
                when(mockedAppointmentServiceSpy.findByLink(link)).thenResolve(mockedAppointmentInstance);

                const actual = await appointmentService.isCreatorOrAdministrator(mockedUser_requester, link);
                expect(actual).toBe(true);

                verify(mockedAppointment.isCreatorOrAdministrator(mockedUser_requester)).once();
                verify(mockedAppointmentServiceSpy.findByLink(link)).once();
            });
        });

        describe('* should return false if failed', () => {
            it('* appointment not found', async () => {
                const link = 'invalid_link';

                const mockedUser_requester = mock(User);

                const mockedAppointmentServiceSpy = spy(appointmentService);
                when(mockedAppointmentServiceSpy.findByLink(link))
                    .thenThrow(new EntityNotFoundException(null, null, 'appointment'));

                appointmentService
                    .isCreatorOrAdministrator(mockedUser_requester, link)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toBe('appointment');
                    });

                verify(mockedAppointmentServiceSpy.findByLink(link)).once();
            });
        });

        it('* not being creator or administrator', async () => {
            const link = 'link';

            const mockedUser_requester = mock(User);

            const mockedAppointment = mock(Appointment);
            const mockedAppointmentInstance = instance(mockedAppointment);

            const mockedAppointmentServiceSpy = spy(appointmentService);

            when(mockedAppointment.isCreatorOrAdministrator(mockedUser_requester)).thenReturn(false);
            when(mockedAppointmentServiceSpy.findByLink(link)).thenResolve(mockedAppointmentInstance);

            const actual = await appointmentService.isCreatorOrAdministrator(mockedUser_requester, link);
            expect(actual).toBe(false);

            verify(mockedAppointment.isCreatorOrAdministrator(mockedUser_requester)).once();
            verify(mockedAppointmentServiceSpy.findByLink(link)).once();
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
        it('* should return appointment if successful', async () => {
            const mockedUser = mock(User);
            const mockedUserInstance = instance(mockedUser);
            mockedUserInstance.sub = '02bbad42-6152-4b3d-a109-48f5f5a22885';

            const mockedUser_appointment_creator = mock(User);
            const mockedUserInstance_appointment_creator = instance(mockedUser_appointment_creator);
            mockedUserInstance_appointment_creator.sub = '89d9235b-6912-44be-8b1e-d2466d299939';

            const link = 'link';
            const permissions = {};
            const slim = false;

            const mockedAppointment = mock(Appointment);
            const mockedAppointmentInstance = instance(mockedAppointment);
            mockedAppointmentInstance.link = link;
            mockedAppointmentInstance.creatorId = mockedUserInstance_appointment_creator.sub;

            const mockedAppointmentServiceSpy = spy(appointmentService);
            when(mockedAppointmentServiceSpy.findByLink(link)).thenResolve(mockedAppointmentInstance);

            const mockedUserService = spy(userService);
            when(mockedUserService.findById(mockedUserInstance_appointment_creator.sub)).thenResolve(mockedUserInstance_appointment_creator);

            const actual = await appointmentService.get(mockedUserInstance, link, permissions, slim);

            expect(actual.link).toEqual(mockedAppointmentInstance.link);
        });

        describe('* failure should return error', () => {
            it('* appointment not found', async () => {
                const __given_user = new User();
                __given_user.sub = '7f4147ed-495a-4971-a970-8e5f86795a50';
                __given_user.preferred_username = 'username';
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
                    const mockedAppointment = mock(Appointment);
                    const mockedAppointmentInstance = instance(mockedAppointment);
                    mockedAppointmentInstance.link = 'unusedLink';

                    const mockedAppointmentServiceSpy = spy(appointmentService);
                    when(mockedAppointmentServiceSpy.findByLink(mockedAppointmentInstance.link)).thenReject(undefined);

                    const mockedUser = mock(User);

                    jest.spyOn(appointmentRepositoryMock, 'save').mockImplementationOnce((val) => val);

                    const actual = await appointmentService.create(mockedAppointmentInstance, mockedUser);

                    expect(actual.link).toEqual(mockedAppointmentInstance.link);
                });

                describe('* link not specified', () => {
                    it('* empty', async () => {
                        const mockedAppointment = mock(Appointment);
                        const mockedAppointmentInstance = instance(mockedAppointment);
                        mockedAppointmentInstance.link = '';

                        const mockedAppointmentServiceSpy = spy(appointmentService);
                        when(mockedAppointmentServiceSpy.findByLink(mockedAppointmentInstance.link)).thenReject(undefined);

                        const mockedUser = mock(User);

                        jest.spyOn(appointmentRepositoryMock, 'save').mockImplementationOnce((val) => val);

                        const actual = await appointmentService.create(mockedAppointmentInstance, mockedUser);

                        expect(actual.link).toMatch(/^[A-Za-z0-9]{5}$/);
                    });

                    it('* undefined', async () => {
                        const mockedAppointment = mock(Appointment);
                        const mockedAppointmentInstance = instance(mockedAppointment);
                        mockedAppointmentInstance.link = undefined;

                        const mockedAppointmentServiceSpy = spy(appointmentService);
                        when(mockedAppointmentServiceSpy.findByLink(mockedAppointmentInstance.link)).thenReject(undefined);

                        const mockedUser = mock(User);

                        jest.spyOn(appointmentRepositoryMock, 'save').mockImplementationOnce((val) => val);

                        const actual = await appointmentService.create(mockedAppointmentInstance, mockedUser);
                        expect(actual.link).toMatch(/^[A-Za-z0-9]{5}$/);
                    });
                });
            });

            describe('* enrollment limit handling', () => {
                it('* valid limit set', async () => {
                    const mockedAppointment = mock(Appointment);
                    const mockedAppointmentInstance = instance(mockedAppointment);
                    mockedAppointmentInstance.maxEnrollments = 10;

                    const mockedUser = mock(User);

                    jest.spyOn(appointmentRepositoryMock, 'save').mockImplementationOnce((val) => val);

                    const actual = await appointmentService.create(mockedAppointmentInstance, mockedUser);
                    expect(actual.maxEnrollments).toEqual(mockedAppointmentInstance.maxEnrollments);
                });

                describe('* no limit should set limit to null', () => {
                    it('* limit < min boundary', async () => {
                        const mockedAppointment = mock(Appointment);
                        const mockedAppointmentInstance = instance(mockedAppointment);
                        mockedAppointmentInstance.maxEnrollments = 0;

                        const mockedUser = mock(User);

                        jest.spyOn(appointmentRepositoryMock, 'save').mockImplementationOnce((val) => val);

                        const actual = await appointmentService.create(mockedAppointmentInstance, mockedUser);
                        expect(actual.maxEnrollments).toEqual(null);
                    });

                    it('* limit undefined', async () => {
                        const mockedAppointment = mock(Appointment);
                        const mockedAppointmentInstance = instance(mockedAppointment);

                        const mockedUser = mock(User);

                        jest.spyOn(appointmentRepositoryMock, 'save').mockImplementationOnce((val) => val);

                        const actual = await appointmentService.create(mockedAppointmentInstance, mockedUser);
                        expect(actual.maxEnrollments).toEqual(null);
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
                    __given_user.preferred_username = 'username';

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // link not in use
                    appointmentRepositoryMock.save.mockImplementation((val) => val);

                    additionRepositoryMock.save.mockImplementation((val) => val);

                    __given_addition_1.order = 0;
                    __given_addition_2.order = 1;

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
                    __given_user.preferred_username = 'username';

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // link not in use
                    appointmentRepositoryMock.save.mockImplementation((val) => val);

                    additionRepositoryMock.save.mockImplementation((val) => val);

                    __given_addition_1.order = 0;

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
                __given_user.preferred_username = 'username';

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
                __given_user.preferred_username = 'username';

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
                    __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                    const __existing_addition_1 = new Addition();
                    __existing_addition_1.id = 'id1';
                    __existing_addition_1.name = 'addition1';
                    const __existing_addition_2 = new Addition();
                    __existing_addition_2.id = 'id2';
                    __existing_addition_2.name = 'addition2';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.creatorId = __given_user.sub;
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

                    additionRepositoryMock.save.mockImplementationOnce((val) => val);
                    additionRepositoryMock.save.mockImplementationOnce((val) => val);
                    additionRepositoryMock.save.mockImplementation((val) => {
                        val.id = createdAdditionId;
                        return val;
                    });

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const mockedUserService = spy(userService);
                    when(mockedUserService.findById(anyString())).thenResolve(__given_user);

                    const __expected_addition_3 = {...__given_appointment_change_addition};
                    __expected_addition_3.id = createdAdditionId;

                    __existing_addition_1.order = 0;
                    __existing_addition_2.order = 1;
                    __expected_addition_3.order = 2;

                    const __expected = [__existing_addition_1, __existing_addition_2, __expected_addition_3];

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.additions).toHaveLength(3);
                    expect(__actual.additions.sort()).toEqual(__expected);
                });

                it('* add (1) to (2) - duplicate name', async () => {
                    const __given_user = new User();
                    __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                    const __existing_addition_1 = new Addition();
                    __existing_addition_1.id = 'id1';
                    __existing_addition_1.name = 'addition1';
                    const __existing_addition_2 = new Addition();
                    __existing_addition_2.id = 'id2';
                    __existing_addition_2.name = 'TAKENNAME';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.creatorId = __given_user.sub;
                    __existing_appointment.additions = [__existing_addition_1, __existing_addition_2];

                    const __given_appointment_change_addition = new Addition();
                    __given_appointment_change_addition.name = __existing_addition_2.name;
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

                    additionRepositoryMock.save.mockImplementationOnce((val) => val);
                    additionRepositoryMock.save.mockImplementationOnce((val) => val);
                    additionRepositoryMock.save.mockImplementationOnce((val) => val);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const mockedUserService = spy(userService);
                    when(mockedUserService.findById(anyString())).thenResolve(__given_user);

                    __existing_addition_1.order = 0;
                    __existing_addition_2.order = 1;

                    const __expected = [__existing_addition_1, __existing_addition_2];

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.additions).toHaveLength(2);
                    expect(__actual.additions.sort()).toEqual(__expected);
                });

                it('* remove (1) from (2)', async () => {
                    const __given_user = new User();
                    __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                    const __existing_addition_1 = new Addition();
                    __existing_addition_1.id = 'id1';
                    __existing_addition_1.name = 'addition1';
                    const __existing_addition_2 = new Addition();
                    __existing_addition_2.id = 'id2';
                    __existing_addition_2.name = 'addition2';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.creatorId = __given_user.sub;
                    __existing_appointment.additions = [__existing_addition_1, __existing_addition_2];

                    const __given_appointment_change_data = {
                        additions: [
                            __existing_addition_1,
                        ]
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    additionRepositoryMock.findOne.mockReturnValueOnce(__existing_addition_1); // addition 1 exists
                    additionRepositoryMock.save.mockImplementationOnce((val) => val);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const mockedUserService = spy(userService);
                    when(mockedUserService.findById(anyString())).thenResolve(__given_user);

                    const __expected = [__existing_addition_1];

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.additions).toHaveLength(1);
                    expect(__actual.additions.sort()).toEqual(__expected);
                });
            });

            it('* update link', async () => {
                const __given_user = new User();
                __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                const __existing_appointment = new Appointment();
                __existing_appointment.link = 'link';
                __existing_appointment.creatorId = __given_user.sub;

                const __given_appointment_change_data = {
                    link: 'newLink'
                };

                appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined); // new link not in use

                appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                    return;
                });

                const mockedUserService = spy(userService);
                when(mockedUserService.findById(anyString())).thenResolve(__given_user);

                const __expected = __given_appointment_change_data.link;

                const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                expect(__actual.link).toEqual(__expected);
            });

            describe('* update dates', () => {
                it('* update date', async () => {
                    const __given_user = new User();
                    __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.creatorId = __given_user.sub;
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

                    const mockedUserService = spy(userService);
                    when(mockedUserService.findById(anyString())).thenResolve(__given_user);

                    const __expected = __given_appointment_change_data.date;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.date).toEqual(__expected);
                });

                it('* update deadline', async () => {
                    const __given_user = new User();
                    __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.link = 'link';
                    __existing_appointment.creatorId = __given_user.sub;
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

                    const mockedUserService = spy(userService);
                    when(mockedUserService.findById(anyString())).thenResolve(__given_user);

                    const __expected = __given_appointment_change_data.deadline;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.deadline).toEqual(__expected);
                });
            });

            describe('* update direct attributes', () => {
                it('* update title', async () => {
                    const __given_user = new User();
                    __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.title = 'title';
                    __existing_appointment.link = 'link';
                    __existing_appointment.creatorId = __given_user.sub;

                    const __given_appointment_change_data = {
                        title: 'newTitle'
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const mockedUserService = spy(userService);
                    when(mockedUserService.findById(anyString())).thenResolve(__given_user);

                    const __expected = __given_appointment_change_data.title;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.title).toEqual(__expected);
                });

                it('* update description', async () => {
                    const __given_user = new User();
                    __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.description = 'description';
                    __existing_appointment.link = 'link';
                    __existing_appointment.creatorId = __given_user.sub;

                    const __given_appointment_change_data = {
                        description: 'newDescription'
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const mockedUserService = spy(userService);
                    when(mockedUserService.findById(anyString())).thenResolve(__given_user);
                    const __expected = __given_appointment_change_data.description;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.description).toEqual(__expected);
                });

                it('* update location', async () => {
                    const __given_user = new User();
                    __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.location = 'location';
                    __existing_appointment.link = 'link';
                    __existing_appointment.creatorId = __given_user.sub;

                    const __given_appointment_change_data = {
                        location: 'newLocation'
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const mockedUserService = spy(userService);
                    when(mockedUserService.findById(anyString())).thenResolve(__given_user);

                    const __expected = __given_appointment_change_data.location;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.location).toEqual(__expected);
                });

                it('* update hidden', async () => {
                    const __given_user = new User();
                    __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.hidden = false;
                    __existing_appointment.link = 'link';
                    __existing_appointment.creatorId = __given_user.sub;

                    const __given_appointment_change_data = {
                        hidden: true
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const mockedUserService = spy(userService);
                    when(mockedUserService.findById(anyString())).thenResolve(__given_user);

                    const __expected = __given_appointment_change_data.hidden;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.hidden).toEqual(__expected);
                });

                it('* update driverAddition', async () => {
                    const __given_user = new User();
                    __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.driverAddition = false;
                    __existing_appointment.link = 'link';
                    __existing_appointment.creatorId = __given_user.sub;

                    const __given_appointment_change_data = {
                        driverAddition: true
                    };

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                    appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                        return;
                    });

                    const mockedUserService = spy(userService);
                    when(mockedUserService.findById(anyString())).thenResolve(__given_user);

                    const __expected = __given_appointment_change_data.driverAddition;

                    const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                    expect(__actual.driverAddition).toEqual(__expected);
                });

                describe('* update maxEnrollments', () => {
                    it('* normal', async () => {
                        const __given_user = new User();
                        __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                        const __existing_appointment = new Appointment();
                        __existing_appointment.driverAddition = false;
                        __existing_appointment.link = 'link';
                        __existing_appointment.creatorId = __given_user.sub;
                        __existing_appointment.maxEnrollments = 5;

                        const __given_appointment_change_data = {
                            maxEnrollments: 10
                        };

                        appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                        appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                        jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                            return;
                        });

                        const mockedUserService = spy(userService);
                        when(mockedUserService.findById(anyString())).thenResolve(__given_user);

                        const __expected = __given_appointment_change_data.maxEnrollments;

                        const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                        expect(__actual.maxEnrollments).toEqual(__expected);
                    });

                    it('* < 0 -> null', async () => {
                        const __given_user = new User();
                        __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                        const __existing_appointment = new Appointment();
                        __existing_appointment.driverAddition = false;
                        __existing_appointment.link = 'link';
                        __existing_appointment.creatorId = __given_user.sub;
                        __existing_appointment.maxEnrollments = 5;

                        const __given_appointment_change_data = {
                            maxEnrollments: -1
                        };

                        appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);

                        appointmentRepositoryMock.save.mockImplementationOnce((val) => val);

                        jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                            return;
                        });

                        const mockedUserService = spy(userService);
                        when(mockedUserService.findById(anyString())).thenResolve(__given_user);

                        const __expected = null;

                        const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                        expect(__actual.maxEnrollments).toEqual(__expected);
                    });
                });
            });

            it('* update non existing attribute', async () => {
                // const __given_user = new User();
                // __given_user.sub = "546448e0-f366-4fca-957a-9bfdce6dc738";
                //
                // const __existing_appointment = new Appointment();
                // __existing_appointment.link = 'link';
                // __existing_appointment.creatorId = __given_user.sub;
                // __existing_appointment._administrators = [];
                //
                // const __given_appointment_change_data = {
                //     invalid: 'attribute'
                // };
                //
                // appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                //
                // appointmentRepositoryMock.save.mockImplementationOnce((val) => val);
                //
                // jest.spyOn(appointmentGateway, 'appointmentUpdated').mockImplementationOnce(() => {
                //     return;
                // });
                //
                // const mockedUserService = spy(userService);
                // when(mockedUserService.findById(anyString())).thenResolve(__given_user);
                //
                // const __expected = __existing_appointment;
                // delete __expected._administrators;
                //
                // const __actual = await appointmentService.update(__given_appointment_change_data, __existing_appointment.link, __given_user);
                // expect(__actual).toEqual(__expected);
            });
        });

        describe('* failure should return error', () => {
            it('appointment not found', async () => {
                const __given_user = new User();
                __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';

                const __existing_appointment = new Appointment();
                __existing_appointment.link = 'link';
                __existing_appointment.creatorId = __given_user.sub;

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
                __given_user.preferred_username = 'username';

                const __existing_creator = new User();
                __existing_creator.preferred_username = 'creator';

                const __existing_appointment = new Appointment();
                __existing_appointment.link = 'link';
                __existing_appointment.creatorId = __existing_creator.sub;
                __existing_appointment._administrators = [];

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
                __given_user.preferred_username = 'username';

                const __existing_appointment = new Appointment();
                __existing_appointment.link = 'link';
                __existing_appointment.creatorId = __given_user.sub;
                __existing_appointment._administrators = [];

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
                    __existing_appointment.creatorId = __given_user.sub;
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
                    __existing_appointment.creatorId = __given_user.sub;
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
            it('* should have user in admin list', async () => {
                const link = 'valid link';
                const username = 'username';

                const mockedUser = mock(User);
                const mockedUserInstance = instance(mockedUser);
                mockedUserInstance.sub = 'd92ce5f1-debe-4c89-af94-3c3c41c4318c';

                const mockedUser_existing = mock(User);
                const mockedUserInstance_existing = instance(mockedUser_existing);
                mockedUserInstance_existing.sub = '02bbad42-6152-4b3d-a109-48f5f5a22885';

                const mockedAppointment = mock(Appointment);
                const mockedAppointmentInstance = instance(mockedAppointment);
                mockedAppointmentInstance._administrators = [];

                const mockedAppointmentServiceSpy = spy(appointmentService);
                const mockedUserServiceSpy = spy(userService);

                when(mockedAppointmentServiceSpy.findByLink(link)).thenResolve(mockedAppointmentInstance);
                when(mockedAppointment.isCreator(mockedUserInstance)).thenReturn(true);
                when(mockedUserServiceSpy.findByUsername(username)).thenResolve(mockedUserInstance_existing);

                jest.spyOn(appointmentRepositoryMock, 'save').mockImplementationOnce((val) => val);

                const actual = await appointmentService.addAdministrator(mockedUserInstance, link, username);

                expect(actual._administrators).toEqual([mockedUserInstance_existing.sub]);
            });

            describe('* failure should return error', () => {
                it('* appointment not found', async () => {
                    const __given_user = new User();
                    __given_user.preferred_username = 'username';
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
                    __given_user.preferred_username = 'username';
                    const __given_link = 'link';
                    const __given_username = 'admin_to_be';

                    const __existing_creator = new User();
                    __existing_creator.preferred_username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creatorId = __existing_creator.sub;
                    __existing_appointment._administrators = [];

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
                    __given_user.preferred_username = 'username';
                    const __given_link = 'link';
                    const __given_username = 'admin_to_be';

                    const __existing_user = new User();
                    __existing_user.preferred_username = __given_username;

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creatorId = __given_user.sub;
                    __existing_appointment._administrators = [];

                    appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined); // check if admin to actually exsists

                    appointmentService
                        .addAdministrator(__given_user, __given_link, __given_username)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned UnknownUserException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(UnknownUserException);
                            expect(err.data).toBe(__existing_user.preferred_username);
                        });
                });
            });
        });

        describe('* remove', () => {
            it('* successful should return updated entity', async () => {
                const link = 'valid link';
                const username = 'username';

                const mockedUser = mock(User);
                const mockedUserInstance = instance(mockedUser);
                mockedUserInstance.sub = 'd92ce5f1-debe-4c89-af94-3c3c41c4318c';

                const mockedUser_existing = mock(User);
                const mockedUserInstance_existing = instance(mockedUser_existing);
                mockedUserInstance_existing.sub = '02bbad42-6152-4b3d-a109-48f5f5a22885';

                const mockedAppointment = mock(Appointment);
                const mockedAppointmentInstance = instance(mockedAppointment);
                mockedAppointmentInstance._administrators = [mockedUserInstance_existing.sub];

                const mockedAppointmentServiceSpy = spy(appointmentService);
                const mockedUserServiceSpy = spy(userService);

                when(mockedAppointmentServiceSpy.findByLink(link)).thenResolve(mockedAppointmentInstance);
                when(mockedAppointment.isCreator(mockedUserInstance)).thenReturn(true);
                when(mockedUserServiceSpy.findByUsername(username)).thenResolve(mockedUserInstance_existing);

                jest.spyOn(appointmentRepositoryMock, 'save').mockImplementationOnce((val) => val);

                const actual = await appointmentService.removeAdministrator(mockedUserInstance, link, username);

                expect(actual._administrators).toEqual([]);
            });

            describe('* failure should return error', () => {
                it('* appointment not found', async () => {
                    const __given_user = new User();
                    __given_user.preferred_username = 'username';
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
                    __given_user.preferred_username = 'username';
                    const __given_link = 'link';
                    const __given_username = 'admin_to_remove';

                    const __existing_user = new User();
                    __existing_user.preferred_username = __given_username;

                    const __existing_creator = new User();
                    __existing_creator.preferred_username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creatorId = __existing_creator.sub;
                    __existing_appointment._administrators = [__existing_user.sub];

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
                __given_user.preferred_username = 'username';
                const __given_link = 'link';
                const __given_data = {name: 'name.txt', data: '123'};

                const __existing_appointment = new Appointment();
                __existing_appointment.creatorId = __given_user.sub;
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
                    __given_user.preferred_username = 'username';
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
                    __given_user.preferred_username = 'username';
                    const __given_link = 'link';
                    const __given_data = {name: 'name.txt', data: '123'};

                    const __existing_user = new User();
                    __existing_user.preferred_username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creatorId = __existing_user.sub;
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
                __given_user.preferred_username = 'username';
                const __given_link = 'link';
                const __given_id = 'c4703eae-a93b-484d-8eee-63d0779825b0';

                const __existing_file = new File();
                __existing_file.id = __given_id;
                __existing_file.name = 'name.txt';
                __existing_file.data = '123';

                const __existing_appointment = new Appointment();
                __existing_appointment.creatorId = __given_user.sub;
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
                    __given_user.preferred_username = 'username';
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
                    __given_user.preferred_username = 'username';
                    const __given_link = 'link';
                    const __given_id = 'c4703eae-a93b-484d-8eee-63d0779825b0';

                    const __existing_creator = new User();
                    __existing_creator.preferred_username = 'creator';

                    const __existing_appointment = new Appointment();
                    __existing_appointment.creatorId = __existing_creator.sub;
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

    // describe('* pin appointment', () => {
    //     describe('* successful should return user entity', () => {
    //         it('* pin', async () => {
    //             const __given_user = new User();
    //             __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';
    //             const __given_link = 'link';
    //
    //             const __existing_appointment = new Appointment();
    //             __existing_appointment.id = '3b1abdb5-cfaa-44cb-8e26-09d61b8f92c5';
    //             __existing_appointment.link = __given_link;
    //
    //             appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
    //             userRepositoryMock.findOne.mockReturnValueOnce(__given_user);
    //
    //             userRepositoryMock.save.mockImplementationOnce((val) => val);
    //
    //             const mockedUserService = spy(userService);
    //             when(mockedUserService.findById(anyString())).thenResolve(__given_user);
    //
    //             const __expected = {...__given_user};
    //
    //             const __actual = await appointmentService.togglePinningAppointment(__given_user, __given_link);
    //             expect(__actual).toEqual(__expected);
    //         });
    //
    //         it('* un-pin', async () => {
    //             const __given_link = 'link';
    //
    //             const __existing_appointment = new Appointment();
    //             __existing_appointment.id = '3b1abdb5-cfaa-44cb-8e26-09d61b8f92c5';
    //             __existing_appointment.link = __given_link;
    //
    //             const __given_user = new User();
    //             __given_user.sub = '546448e0-f366-4fca-957a-9bfdce6dc738';
    //
    //             appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
    //             userRepositoryMock.findOne.mockReturnValueOnce(__given_user);
    //
    //             userRepositoryMock.save.mockImplementationOnce((val) => val);
    //
    //             const mockedUserService = spy(userService);
    //             when(mockedUserService.findById(anyString())).thenResolve(__given_user);
    //
    //             const __expected = {...__given_user};
    //
    //             const __actual = await appointmentService.togglePinningAppointment(__given_user, __given_link);
    //             expect(__actual).toEqual(__expected);
    //         });
    //     });
    //
    //     describe('* failure should return error', () => {
    //         it('* appointment not found', async () => {
    //             const __given_user = new User();
    //             __given_user.preferred_username = 'username';
    //             const __given_link = 'link';
    //
    //             appointmentRepositoryMock.findOne.mockReturnValueOnce(undefined);
    //
    //             appointmentService
    //                 .togglePinningAppointment(__given_user, __given_link)
    //                 .then(() => {
    //                     throw new Error('I have failed you, Anakin. Should have thrown EntityNotFoundException');
    //                 })
    //                 .catch((err) => {
    //                     expect(err).toBeInstanceOf(EntityNotFoundException);
    //                     expect(err.data).toEqual('appointment');
    //                 });
    //         });
    //
    //         it('* user gone', async () => {
    //             const __given_user = new User();
    //             __given_user.preferred_username = 'username';
    //             const __given_link = 'link';
    //
    //             const __existing_appointment = new Appointment();
    //             __existing_appointment.id = '3b1abdb5-cfaa-44cb-8e26-09d61b8f92c5';
    //             __existing_appointment.link = __given_link;
    //
    //             appointmentRepositoryMock.findOne.mockReturnValueOnce(__existing_appointment);
    //             userRepositoryMock.findOne.mockReturnValueOnce(undefined);
    //
    //             appointmentService
    //                 .togglePinningAppointment(__given_user, __given_link)
    //                 .then(() => {
    //                     throw new Error('I have failed you, Anakin. Should have thrown EntityNotFoundException');
    //                 })
    //                 .catch((err) => {
    //                     expect(err).toBeInstanceOf(EntityNotFoundException);
    //                     expect(err.data).toEqual('user');
    //                 });
    //         });
    //     });
    // });

    // TODO CHECK PAGINATION
    describe('* get Appointments', () => { // cases like creator, admin enrollment ... not needed to test, because they are recieved by database
        describe('* successful should return array of entities', () => {
            it('* normal', async () => {
                const __given_user = new User();
                __given_user.preferred_username = 'username';
                const __given_permissions = {};
                const __given_slim = false;

                const __existing_appointment = new Appointment();
                __existing_appointment.id = '1657bd4e-c2d5-411a-8633-7ce9b3eca0cb';
                __existing_appointment.creatorId = __given_user.sub;
                __existing_appointment.enrollments = [];

                jest.spyOn(appointmentService as any, 'getAppointments')
                    .mockReturnValueOnce(Promise.resolve([__existing_appointment]));

                const actual = await appointmentService.getAll(__given_user, __given_permissions, __given_slim);
                expect(actual).toHaveLength(1);
            });

            it('* normal - slim not provided', async () => {
                const __given_user = new User();
                __given_user.preferred_username = 'username';
                const __given_permissions = {};

                const __existing_appointment = new Appointment();
                __existing_appointment.id = '1657bd4e-c2d5-411a-8633-7ce9b3eca0cb';
                __existing_appointment.creatorId = __given_user.sub;
                __existing_appointment.enrollments = [];

                jest.spyOn(appointmentService as any, 'getAppointments')
                    .mockReturnValueOnce(Promise.resolve([__existing_appointment]));

                const actual = await appointmentService.getAll(__given_user, __given_permissions, false);
                expect(actual).toHaveLength(1);
            });

            describe('* pin parsing', () => {
                it('* valid pin', async () => {
                    const __given_user = new User();
                    __given_user.preferred_username = 'username';
                    const __given_permissions = {pin1: 'link'};
                    const __given_slim = false;

                    const __existing_appointment = new Appointment();
                    __existing_appointment.id = '1657bd4e-c2d5-411a-8633-7ce9b3eca0cb';
                    __existing_appointment.creatorId = __given_user.sub;
                    __existing_appointment.link = __given_permissions.pin1;
                    __existing_appointment.enrollments = [];

                    jest.spyOn(appointmentService as any, 'getAppointments')
                        .mockReturnValueOnce(Promise.resolve([__existing_appointment]));

                    const actual = await appointmentService.getAll(__given_user, __given_permissions, __given_slim);
                    expect(actual).toHaveLength(1);
                });

                it('* invalid pin query name', async () => {
                    const __given_user = new User();
                    __given_user.preferred_username = 'username';
                    const __given_permissions = {invalid: 'link'};
                    const __given_slim = false;

                    const __existing_appointment = new Appointment();
                    __existing_appointment.id = '1657bd4e-c2d5-411a-8633-7ce9b3eca0cb';
                    __existing_appointment.creatorId = __given_user.sub;
                    __existing_appointment.link = 'anylink';
                    __existing_appointment.enrollments = [];

                    jest.spyOn(appointmentService as any, 'getAppointments')
                        .mockReturnValueOnce(Promise.resolve([__existing_appointment]));

                    const actual = await appointmentService.getAll(__given_user, __given_permissions, __given_slim);
                    expect(actual).toHaveLength(1);
                });
            });
        });
    });// cases like creator, admin enrollment ... not needed to test, because they are received by database

    describe('* get Appointments Archive', () => { // only test parsing of additional parameters // acutally same as getAppointments
        describe('* successful should return array of entities', () => {
            it('* normal', async () => {
                const __given_user = new User();
                __given_user.preferred_username = 'username';
                const __given_permissions = {};
                const __given_slim = false;
                const __given_before = '01/09/2020 01:24:26';
                const __given_limit = 1;

                const __existing_appointment = new Appointment();
                __existing_appointment.id = '1657bd4e-c2d5-411a-8633-7ce9b3eca0cb';
                __existing_appointment.creatorId = __given_user.sub;
                __existing_appointment.enrollments = [];

                jest.spyOn(appointmentService as any, 'getAppointments')
                    .mockReturnValueOnce(Promise.resolve([__existing_appointment]));

                const actual = await appointmentService.getAllArchive(__given_user, __given_permissions, __given_slim, __given_before, __given_limit);
                expect(actual).toHaveLength(1);

                expect((appointmentService as any).getAppointments)
                    .toHaveBeenCalledWith(__given_user, [], new Date(__given_before), __given_limit);
            });

            it('* invalid date -> convert to current', async () => {
                const __given_user = new User();
                __given_user.preferred_username = 'username';
                const __given_permissions = {};
                const __given_slim = false;
                const __given_before = '';
                const __given_limit = 1;

                const __existing_appointment = new Appointment();
                __existing_appointment.id = '1657bd4e-c2d5-411a-8633-7ce9b3eca0cb';
                __existing_appointment.creatorId = __given_user.sub;
                __existing_appointment.enrollments = [];

                const date = new Date();
                jest.spyOn(global, 'Date').mockImplementationOnce(() => undefined);
                jest.spyOn(global, 'Date').mockImplementationOnce(() => date as any);

                jest.spyOn(appointmentService as any, 'getAppointments')
                    .mockReturnValueOnce(Promise.resolve([__existing_appointment]));

                const actual = await appointmentService.getAllArchive(__given_user, __given_permissions, __given_slim, __given_before, __given_limit);
                expect(actual).toHaveLength(1);

                expect((appointmentService as any).getAppointments)
                    .toHaveBeenCalledWith(__given_user, [], date, __given_limit);
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
