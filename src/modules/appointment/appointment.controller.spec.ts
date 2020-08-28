import {Test, TestingModule} from '@nestjs/testing';

import {Appointment} from './appointment.entity';
import {AppointmentService} from './appointment.service';
import {AppointmentController} from './appointment.controller';

import {User} from '../user/user.entity';

import {HttpStatus, NotFoundException} from '@nestjs/common';
import {InvalidValuesException} from '../../exceptions/InvalidValuesException';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {EntityGoneException} from '../../exceptions/EntityGoneException';

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

    it('should be defined', () => {
        expect(appointmentController).toBeDefined();
    });

    describe('* find appointments by link', () => {
        describe('* successful should return entity of appointment with 200 status code', () => {
            it('successful request', async () => {
                const result = new Appointment();

                jest.spyOn(appointmentService, 'get')
                    .mockImplementation(async (): Promise<Appointment> => Promise.resolve(result));

                const mockUserToSatisfyParameter = new User();
                const mockIsSlimToSatisfyParameter = 'true';
                const mockPermissionsToSatisfyParameter = 'ObjectOfAllQueryParameters';
                const mockLinkToSatisfyParameter = 'mylink';
                const req: any = {
                    headers: {
                        'if-none-match': 'W/"etag"'
                    }
                };
                const res = mockResponse();

                await appointmentController
                    .findByLink(mockUserToSatisfyParameter,
                        mockIsSlimToSatisfyParameter, mockPermissionsToSatisfyParameter,
                        mockLinkToSatisfyParameter, req, res);

                expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith(result);
            });

            it('successful request (nothing changed)', async () => {
                const result = null;

                jest.spyOn(appointmentService, 'get')
                    .mockImplementation(async (): Promise<Appointment> => Promise.resolve(result));

                const mockUserToSatisfyParameter = new User();
                const mockIsSlimToSatisfyParameter = 'true';
                const mockPermissionsToSatisfyParameter = 'ObjectOfAllQueryParameters';
                const mockLinkToSatisfyParameter = 'mylink';
                const req: any = {
                    headers: {
                        'if-none-match': 'W/"etag"'
                    }
                };
                const res = mockResponse();

                await appointmentController
                    .findByLink(mockUserToSatisfyParameter,
                        mockIsSlimToSatisfyParameter, mockPermissionsToSatisfyParameter,
                        mockLinkToSatisfyParameter, req, res);

                expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                expect(res.status).toBeCalledTimes(1);
            });
        });

        describe('* failure should return error', () => {
            it('appointment not found', async () => {
                const result = new EntityNotFoundException(null, null, 'appointment');

                jest.spyOn(appointmentService, 'get')
                    .mockImplementation(async (): Promise<Appointment> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockIsSlimToSatisfyParameter = 'true';
                const mockPermissionsToSatisfyParameter = 'ObjectOfAllQueryParameters';
                const mockLinkToSatisfyParameter = 'mylink';
                const req: any = {
                    headers: {
                        'if-none-match': 'W/"etag"'
                    }
                };
                const res = mockResponse();

                await appointmentController
                    .findByLink(mockUserToSatisfyParameter,
                        mockIsSlimToSatisfyParameter, mockPermissionsToSatisfyParameter,
                        mockLinkToSatisfyParameter, req, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });

            it('undefined error occurred', async () => {
                const result = new Error();

                jest.spyOn(appointmentService, 'get')
                    .mockImplementation(async (): Promise<Appointment> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockIsSlimToSatisfyParameter = 'true';
                const mockPermissionsToSatisfyParameter = 'ObjectOfAllQueryParameters';
                const mockLinkToSatisfyParameter = 'mylink';
                const req: any = {
                    headers: {
                        'if-none-match': 'W/"etag"'
                    }
                };
                const res = mockResponse();

                await appointmentController
                    .findByLink(mockUserToSatisfyParameter,
                        mockIsSlimToSatisfyParameter, mockPermissionsToSatisfyParameter,
                        mockLinkToSatisfyParameter, req, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });
        });
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
                    mockQueryParameterToSatisfyParameter, mockIsSlimToSatisfyParameter, null, null, res);

                expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
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
                        mockQueryParameterToSatisfyParameter, mockIsSlimToSatisfyParameter, null, null, res)
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

                const mockUserToSatisfyParameter = new User();
                const mockAppointmentToSatisfyParameter = new Appointment();
                const res = mockResponse();

                await appointmentController.create(mockUserToSatisfyParameter, mockAppointmentToSatisfyParameter, res);

                expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith(result);
            });
        });

        describe('* failure should forward error', () => {
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

                expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
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

    describe('* administrators', () => {

        describe('* add administrator', () => {
            describe('* successful should return nothing 204 status code', () => {
                it('successful request', async () => {
                    jest.spyOn(appointmentService, 'addAdministrator')
                        .mockImplementation(async (): Promise<void> => Promise.resolve());

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const mockUsernameToSatisfyParameter = 'username';
                    const res = mockResponse();

                    await appointmentController
                        .addAdministrator(mockUserToSatisfyParameter,
                            mockLinkToSatisfyParameter, mockUsernameToSatisfyParameter, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
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

                    await appointmentController
                        .addAdministrator(mockUserToSatisfyParameter,
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

                    await appointmentController
                        .addAdministrator(mockUserToSatisfyParameter,
                            mockLinkToSatisfyParameter, mockUsernameToSatisfyParameter, res)
                        .then(() => {
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

                    await appointmentController
                        .addAdministrator(mockUserToSatisfyParameter,
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
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
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
                        jest.spyOn(appointmentService, 'isCreatorOrAdministrator')
                            .mockImplementation(async (): Promise<boolean> => Promise.resolve(true));

                        const mockUserToSatisfyParameter = new User();
                        const mockLinkToSatisfyParameter = 'linkOfAppointment';
                        const res = mockResponse();

                        await appointmentController.hasPermission(mockUserToSatisfyParameter,
                            mockLinkToSatisfyParameter, res);
                        expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                        expect(res.status).toBeCalledTimes(1);
                    });
                });

                describe('* failure should return error', () => {
                    it('not permitted for appointment', async () => {
                        const result = new InsufficientPermissionsException();

                        jest.spyOn(appointmentService, 'isCreatorOrAdministrator')
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

                        jest.spyOn(appointmentService, 'isCreatorOrAdministrator')
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
    });

    describe('* check permissions', () => {
        describe('* successful should return nothing 204 status code', () => {
            it('successful request', async () => {
                jest.spyOn(appointmentService, 'isCreatorOrAdministrator')
                    .mockImplementation(async (): Promise<boolean> => Promise.resolve(true));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const res = mockResponse();

                await appointmentController.hasPermission(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, res);
                expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                expect(res.status).toBeCalledTimes(1);
            });
        });

        describe('* failure should return error', () => {
            it('not permitted for appointment (normal permission check)', async () => {
                jest.spyOn(appointmentService, 'isCreatorOrAdministrator')
                    .mockImplementation(async (): Promise<boolean> => Promise.resolve(false));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const res = mockResponse();

                await appointmentController.hasPermission(mockUserToSatisfyParameter,
                    mockLinkToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBeInstanceOf(InsufficientPermissionsException);
                    });
            });

            it('not permitted for appointment (appointment not found)', async () => {
                const result = new InsufficientPermissionsException();

                jest.spyOn(appointmentService, 'isCreatorOrAdministrator')
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

                jest.spyOn(appointmentService, 'isCreatorOrAdministrator')
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

    describe('* files', () => {
        describe('* add file', () => {
            describe('* successful should return nothing 204 status code', () => {
                it('successful request', async () => {
                    jest.spyOn(appointmentService, 'addFile')
                        .mockImplementation(async (): Promise<void> => Promise.resolve());

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const mockDataToSatisfyParameter = {name: 'mycoolfile.pdf', data: 'dummyData'};
                    const res = mockResponse();

                    await appointmentController
                        .addFile(mockUserToSatisfyParameter,
                            mockLinkToSatisfyParameter, mockDataToSatisfyParameter, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                    expect(res.status).toBeCalledTimes(1);
                });
            });

            describe('* failure should return error', () => {
                it('not permitted for appointment', async () => {
                    const result = new InsufficientPermissionsException();

                    jest.spyOn(appointmentService, 'addFile')
                        .mockImplementation(async (): Promise<void> => Promise.reject(result));

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const mockDataToSatisfyParameter = {name: 'mycoolfile.pdf', data: 'dummyData'};
                    const res = mockResponse();

                    await appointmentController
                        .addFile(mockUserToSatisfyParameter,
                            mockLinkToSatisfyParameter, mockDataToSatisfyParameter, res)
                        .then(() => {
                            throw new Error('I have failed you, Anakin.');
                        }).catch(err => {
                            expect(err).toBe(result);
                        });
                });

                it('appointment not found', async () => {
                    const result = new EntityNotFoundException(null, null, 'appointment');

                    jest.spyOn(appointmentService, 'addFile')
                        .mockImplementation(async (): Promise<void> => Promise.reject(result));

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const mockDataToSatisfyParameter = {name: 'mycoolfile.pdf', data: 'dummyData'};
                    const res = mockResponse();

                    await appointmentController
                        .addFile(mockUserToSatisfyParameter,
                            mockLinkToSatisfyParameter, mockDataToSatisfyParameter, res)
                        .then(() => {
                            throw new Error('I have failed you, Anakin.');
                        }).catch(err => {
                            expect(err).toBe(result);
                        });
                });

                it('undefined error has occurred', async () => {
                    const result = new Error();

                    jest.spyOn(appointmentService, 'addFile')
                        .mockImplementation(async (): Promise<void> => Promise.reject(result));

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const mockDataToSatisfyParameter = {name: 'mycoolfile.pdf', data: 'dummyData'};
                    const res = mockResponse();

                    await appointmentController
                        .addFile(mockUserToSatisfyParameter,
                            mockLinkToSatisfyParameter, mockDataToSatisfyParameter, res)
                        .then(() => {
                            throw new Error('I have failed you, Anakin.');
                        }).catch(err => {
                            expect(err).toBe(result);
                        });
                });
            });
        });

        describe('* remove file', () => {
            describe('* successful should return nothing 204 status code', () => {
                it('successful request', async () => {
                    jest.spyOn(appointmentService, 'removeFile')
                        .mockImplementation(async (): Promise<void> => Promise.resolve());

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const mockIdToSatisfyParameter = 'id-of-file';
                    const res = mockResponse();

                    await appointmentController
                        .removeFile(mockUserToSatisfyParameter,
                            mockLinkToSatisfyParameter, mockIdToSatisfyParameter, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                    expect(res.status).toBeCalledTimes(1);
                });
            });

            describe('* failure should return error', () => {
                it('not permitted for appointment', async () => {
                    const result = new InsufficientPermissionsException();

                    jest.spyOn(appointmentService, 'removeFile')
                        .mockImplementation(async (): Promise<void> => Promise.reject(result));

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const mockIdToSatisfyParameter = 'id-of-file';
                    const res = mockResponse();

                    await appointmentController
                        .removeFile(mockUserToSatisfyParameter,
                            mockLinkToSatisfyParameter, mockIdToSatisfyParameter, res)
                        .then(() => {
                            throw new Error('I have failed you, Anakin.');
                        }).catch(err => {
                            expect(err).toBe(result);
                        });
                });

                it('appointment not found', async () => {
                    const result = new EntityNotFoundException(null, null, 'appointment');

                    jest.spyOn(appointmentService, 'removeFile')
                        .mockImplementation(async (): Promise<void> => Promise.reject(result));

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const mockIdToSatisfyParameter = 'id-of-file';
                    const res = mockResponse();

                    await appointmentController
                        .removeFile(mockUserToSatisfyParameter,
                            mockLinkToSatisfyParameter, mockIdToSatisfyParameter, res)
                        .then(() => {
                            throw new Error('I have failed you, Anakin.');
                        }).catch(err => {
                            expect(err).toBe(result);
                        });
                });

                it('file not found', async () => {
                    const result = new EntityGoneException(null, null, 'file');

                    jest.spyOn(appointmentService, 'removeFile')
                        .mockImplementation(async (): Promise<void> => Promise.reject(result));

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const mockIdToSatisfyParameter = 'id-of-file';
                    const res = mockResponse();

                    await appointmentController
                        .removeFile(mockUserToSatisfyParameter,
                            mockLinkToSatisfyParameter, mockIdToSatisfyParameter, res)
                        .then(() => {
                            throw new Error('I have failed you, Anakin.');
                        }).catch(err => {
                            expect(err).toBe(result);
                        });
                });

                it('undefined error has occurred', async () => {
                    const result = new Error();

                    jest.spyOn(appointmentService, 'removeFile')
                        .mockImplementation(async (): Promise<void> => Promise.reject(result));

                    const mockUserToSatisfyParameter = new User();
                    const mockLinkToSatisfyParameter = 'linkOfAppointment';
                    const mockIdToSatisfyParameter = 'id-of-file';
                    const res = mockResponse();

                    await appointmentController
                        .removeFile(mockUserToSatisfyParameter,
                            mockLinkToSatisfyParameter, mockIdToSatisfyParameter, res)
                        .then(() => {
                            throw new Error('I have failed you, Anakin.');
                        }).catch(err => {
                            expect(err).toBe(result);
                        });
                });
            });
        });
    });

    describe('* pin appointment', () => {
        describe('* successful should return nothing 204 status code', () => {
            it('successful request', async () => {
                jest.spyOn(appointmentService, 'togglePinningAppointment')
                    .mockImplementation(async (): Promise<void> => Promise.resolve());

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const res = mockResponse();

                await appointmentController
                    .pinAppointment(mockUserToSatisfyParameter, mockLinkToSatisfyParameter, res);
                expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                expect(res.status).toBeCalledTimes(1);
            });
        });

        describe('* failure should return error', () => {
            it('not permitted for appointment', async () => {
                const result = new InsufficientPermissionsException();

                jest.spyOn(appointmentService, 'togglePinningAppointment')
                    .mockImplementation(async (): Promise<void> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const res = mockResponse();

                await appointmentController
                    .pinAppointment(mockUserToSatisfyParameter, mockLinkToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });

            it('appointment not found', async () => {
                const result = new EntityNotFoundException(null, null, 'appointment');

                jest.spyOn(appointmentService, 'togglePinningAppointment')
                    .mockImplementation(async (): Promise<void> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const res = mockResponse();

                await appointmentController
                    .pinAppointment(mockUserToSatisfyParameter, mockLinkToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });

            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(appointmentService, 'togglePinningAppointment')
                    .mockImplementation(async (): Promise<void> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'linkOfAppointment';
                const res = mockResponse();

                await appointmentController
                    .pinAppointment(mockUserToSatisfyParameter, mockLinkToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch(err => {
                        expect(err).toBe(result);
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

