import {Test, TestingModule} from '@nestjs/testing';

import {Appointment} from './appointment.entity';
import {AppointmentController} from './appointment.controller';
import {AppointmentService} from './appointment.service';
import {User} from '../user/user.entity';
import {NotFoundException} from '@nestjs/common';
import {UserUtil} from '../../util/userUtil.util';
import {InvalidValuesException} from '../../exceptions/InvalidValuesException';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

jest.mock('./appointment.service');

describe('Appointment Controller', () => {
    let appointmentService: AppointmentService;

    let appointmentController: AppointmentController;

    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [AppointmentController],
            providers: [
                AppointmentService
            ]
        }).compile();

        appointmentService = module.get<AppointmentService>(AppointmentService);
        appointmentController = module.get<AppointmentController>(AppointmentController);
    });

    describe('* find appointments in relation to user', () => {
        describe('* successful should return array of appointment entities with 200 status code', () => {
            it('successful request', async () => {
                const result = [new Appointment()];

                jest.spyOn(appointmentService, 'getAll')
                    .mockImplementation(async (): Promise<Appointment[]> => Promise.resolve(result));

                const res = mockResponse();

                const mockUserToSatisfyParameter = new User();
                const mockQueryParameterToSatisfyParameter = {};
                const mockIsSlimToSatisfyParameter = 'true';

                await appointmentController.getAll(mockUserToSatisfyParameter,
                    mockQueryParameterToSatisfyParameter, mockIsSlimToSatisfyParameter, res);

                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith(result);
            });
        });

        describe('* failure should return error', () => {
            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(appointmentService, 'getAll')
                    .mockImplementation(async (): Promise<Appointment[]> => Promise.reject(result));

                const res = mockResponse();

                const mockUserToSatisfyParameter = new User();
                const mockQueryParameterToSatisfyParameter = {};
                const mockIsSlimToSatisfyParameter = 'true';

                await appointmentController
                    .getAll(mockUserToSatisfyParameter,
                        mockQueryParameterToSatisfyParameter, mockIsSlimToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });
        });
    });

    describe('* create appointment', () => {
        describe('* successful should return created entity of appointment with 201 status code', () => {
            it('successful request', async () => {
                const result = new Appointment();

                jest.spyOn(appointmentService, 'create')
                    .mockImplementation(async (): Promise<Appointment> => Promise.resolve(result));
                jest.spyOn(UserUtil, 'minimizeUser')
                    .mockImplementation((val): User => val);

                const mockUserToSatisfyParameter = new User();
                const mockAppointmentToSatisfyParameter = new Appointment();
                const res = mockResponse();

                await appointmentController.create(mockUserToSatisfyParameter, mockAppointmentToSatisfyParameter, res);

                expect(res.status).toHaveBeenCalledWith(201);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith(result);
            });
        });

        describe('* failure should return error', () => {
            it('description.length < 10', async () => {
                const result = new InvalidValuesException(null,
                    'Minimum length of 10 needed',
                    ['description']);

                jest.spyOn(appointmentService, 'create')
                    .mockImplementation(async (): Promise<Appointment> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockAppointmentToSatisfyParameter = new Appointment();
                const res = mockResponse();

                await appointmentController
                    .create(mockUserToSatisfyParameter, mockAppointmentToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });

            it('link in use', async () => {
                const result = new DuplicateValueException(null, null, ['link']);

                jest.spyOn(appointmentService, 'create')
                    .mockImplementation(async (): Promise<Appointment> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockAppointmentToSatisfyParameter = new Appointment();
                const res = mockResponse();

                await appointmentController
                    .create(mockUserToSatisfyParameter, mockAppointmentToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });

            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(appointmentService, 'create')
                    .mockImplementation(async (): Promise<Appointment> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockAppointmentToSatisfyParameter = new Appointment();
                const res = mockResponse();

                await appointmentController
                    .create(mockUserToSatisfyParameter, mockAppointmentToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });
        });
    });

    describe('* update appointment', () => {
        describe('* successful should return updated entity of appointment with 200 status code', () => {
            it('successful request', async () => {
                const result = new Appointment();

                jest.spyOn(appointmentService, 'update')
                    .mockImplementation(async (): Promise<Appointment> => Promise.resolve(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const mockAppointmentToSatisfyParameter = new Appointment();
                const res = mockResponse();

                await appointmentController.update(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, mockAppointmentToSatisfyParameter, res);

                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith(result);
            });
        });

        describe('* failure should return error', () => {
            it('not permitted for appointment', async () => {
                const result = new InsufficientPermissionsException();

                jest.spyOn(appointmentService, 'update')
                    .mockImplementation(async (): Promise<Appointment> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const mockAppointmentToSatisfyParameter = new Appointment();
                const res = mockResponse();

                await appointmentController.update(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, mockAppointmentToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });

            it('link in use', async () => {
                const result = new DuplicateValueException(null, null, ['link']);

                jest.spyOn(appointmentService, 'update')
                    .mockImplementation(async (): Promise<Appointment> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const mockAppointmentToSatisfyParameter = new Appointment();
                const res = mockResponse();

                await appointmentController.update(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, mockAppointmentToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });

            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(appointmentService, 'update')
                    .mockImplementation(async (): Promise<Appointment> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const mockAppointmentToSatisfyParameter = new Appointment();
                const res = mockResponse();

                await appointmentController.update(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, mockAppointmentToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });
        });
    });

    describe('* add administrator', () => {
        describe('* successful should return nothing 204 status code', () => {
            it('successful request', async () => {
                jest.spyOn(appointmentService, 'addAdministrator')
                    .mockImplementation(async (): Promise<void> => Promise.resolve());

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const mockUsernameToSatisfyParameter = 'username';
                const res = mockResponse();

                await appointmentController.addAdministrator(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, mockUsernameToSatisfyParameter, res);
                expect(res.status).toHaveBeenCalledWith(204);
                expect(res.status).toBeCalledTimes(1);
            });
        });

        describe('* failure should return error', () => {
            it('not permitted for appointment', async () => {
                const result = new InsufficientPermissionsException();

                jest.spyOn(appointmentService, 'addAdministrator')
                    .mockImplementation(async (): Promise<void> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const mockUsernameToSatisfyParameter = 'username';
                const res = mockResponse();

                await appointmentController.addAdministrator(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, mockUsernameToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });

            it('appointment not found', async () => {
                const result = new EntityNotFoundException(null, null, 'appointment');

                jest.spyOn(appointmentService, 'addAdministrator')
                    .mockImplementation(async (): Promise<void> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const mockUsernameToSatisfyParameter = 'username';
                const res = mockResponse();

                await appointmentController.addAdministrator(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, mockUsernameToSatisfyParameter, res).then(() => {
                    throw new Error('I have failed you, Anakin.');
                }).catch(err => {
                    expect(err).toBe(result);
                });
            });

            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(appointmentService, 'addAdministrator')
                    .mockImplementation(async (): Promise<void> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const mockUsernameToSatisfyParameter = 'username';
                const res = mockResponse();

                await appointmentController.addAdministrator(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, mockUsernameToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });
        });
    });

    describe('* remove administrator', () => {
        describe('* successful should return nothing 204 status code', () => {
            it('successful request', async () => {
                jest.spyOn(appointmentService, 'removeAdministrator')
                    .mockImplementation(async (): Promise<void> => Promise.resolve());

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const mockUsernameToSatisfyParameter = 'username';
                const res = mockResponse();

                await appointmentController.removeAdministrator(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, mockUsernameToSatisfyParameter, res);
                expect(res.status).toHaveBeenCalledWith(204);
                expect(res.status).toBeCalledTimes(1);
            });
        });

        describe('* failure should return error', () => {
            it('not permitted for appointment', async () => {
                const result = new InsufficientPermissionsException();

                jest.spyOn(appointmentService, 'removeAdministrator')
                    .mockImplementation(async (): Promise<void> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const mockUsernameToSatisfyParameter = 'username';
                const res = mockResponse();

                await appointmentController.removeAdministrator(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, mockUsernameToSatisfyParameter, res).then(() => {
                    throw new Error('I have failed you, Anakin.');
                }).catch(err => {
                    expect(err).toBe(result);
                });
            });

            it('appointment not found', async () => {
                const result = new NotFoundException();

                jest.spyOn(appointmentService, 'removeAdministrator')
                    .mockImplementation(async (): Promise<void> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const mockUsernameToSatisfyParameter = 'username';
                const res = mockResponse();

                await appointmentController.removeAdministrator(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, mockUsernameToSatisfyParameter, res).then(() => {
                    throw new Error('I have failed you, Anakin.');
                }).catch(err => {
                    expect(err).toBe(result);
                });
            });

            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(appointmentService, 'removeAdministrator')
                    .mockImplementation(async (): Promise<void> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const mockUsernameToSatisfyParameter = 'username';
                const res = mockResponse();

                await appointmentController.removeAdministrator(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, mockUsernameToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });
        });

        describe('* remove administrator', () => {
            describe('* successful should return nothing with 204 status code', () => {
                it('successful request', async () => {
                    jest.spyOn(appointmentService, 'hasPermission')
                        .mockImplementation(async (): Promise<boolean> => Promise.resolve(true));

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const res = mockResponse();

                    await appointmentController.hasPermission(mockUserToSatisfyParameter,
                        mockLinkToSatisfyParameter, res);
                    expect(res.status).toHaveBeenCalledWith(204);
                    expect(res.status).toBeCalledTimes(1);
                });
            });

            describe('* failure should return error', () => {
                it('not permitted for appointment', async () => {
                    const result = new InsufficientPermissionsException();

                    jest.spyOn(appointmentService, 'hasPermission')
                        .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const res = mockResponse();

                    await appointmentController.hasPermission(mockUserToSatisfyParameter,
                        mockLinkToSatisfyParameter, res)
                        .then(() => {
                            throw new Error('I have failed you, Anakin.');
                        }).catch(err => {
                            expect(err).toBe(result);
                        });
                });

                it('undefined error has occurred', async () => {
                    const result = new Error();

                    jest.spyOn(appointmentService, 'hasPermission')
                        .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const res = mockResponse();

                    await appointmentController.hasPermission(mockUserToSatisfyParameter,
                        mockLinkToSatisfyParameter, res)
                        .then(() => {
                            throw new Error('I have failed you, Anakin.');
                        }).catch(err => {
                            expect(err).toBe(result);
                        });
                });
            });
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });
});

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
