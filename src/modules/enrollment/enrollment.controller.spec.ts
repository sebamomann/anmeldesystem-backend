import {Test, TestingModule} from '@nestjs/testing';

import {User} from '../user/user.entity';
import {HttpStatus} from '@nestjs/common';

import {Enrollment} from './enrollment.entity';
import {EnrollmentService} from './enrollment.service';
import {EnrollmentController} from './enrollment.controller';

jest.mock('./enrollment.service');

describe('Enrollment Controller', () => {
    let enrollmentService: EnrollmentService;

    let enrollmentController: EnrollmentController;

    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [EnrollmentController],
            providers: [
                EnrollmentService
            ]
        }).compile();

        enrollmentService = module.get<EnrollmentService>(EnrollmentService);
        enrollmentController = module.get<EnrollmentController>(EnrollmentController);
    });

    it('should be defined', () => {
        expect(enrollmentController).toBeDefined();
    });

    describe('* create enrollment', () => {
        describe('* successful should return created entity of enrollment with 201 status code', () => {
            it('successful request', async () => {
                const result = new Enrollment();

                jest.spyOn(enrollmentService, 'create')
                    .mockImplementation(async (): Promise<Enrollment> => Promise.resolve(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'link';
                const mockDomainToSatisfyParameter = 'domain';
                const mockEnrollmentToSatisfyParameter = new Enrollment();
                const res = mockResponse();

                await enrollmentController
                    .create(mockUserToSatisfyParameter, mockLinkToSatisfyParameter,
                        mockDomainToSatisfyParameter, mockEnrollmentToSatisfyParameter, res);

                expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith(result);
            });
        });

        describe('* failure should forward error', () => {
            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(enrollmentService, 'create')
                    .mockImplementation(async (): Promise<Enrollment> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockLinkToSatisfyParameter = 'link';
                const mockDomainToSatisfyParameter = 'domain';
                const mockEnrollmentToSatisfyParameter = new Enrollment();
                const res = mockResponse();

                await enrollmentController
                    .create(mockUserToSatisfyParameter, mockLinkToSatisfyParameter,
                        mockDomainToSatisfyParameter, mockEnrollmentToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have returned Error');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });
        });
    });

    describe('* update enrollment', () => {
        describe('* successful should return updated entity of enrollment with 200 status code', () => {
            it('successful request', async () => {
                const result = new Enrollment();

                jest.spyOn(enrollmentService, 'update')
                    .mockImplementation(async (): Promise<Enrollment> => Promise.resolve(result));

                const mockUserToSatisfyParameter = new User();
                const mockIdToSatisfyParameter = '1';
                const mockEnrollmentToSatisfyParameter = new Enrollment();
                const res = mockResponse();

                await enrollmentController.update(mockUserToSatisfyParameter,
                    mockIdToSatisfyParameter, mockEnrollmentToSatisfyParameter, res);

                expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith(result);
            });
        });

        describe('* failure should return error', () => {
            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(enrollmentService, 'update')
                    .mockImplementation(async (): Promise<Enrollment> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockIdToSatisfyParameter = '1';
                const mockEnrollmentToSatisfyParameter = new Enrollment();
                const res = mockResponse();

                await enrollmentController.update(mockUserToSatisfyParameter,
                    mockIdToSatisfyParameter, mockEnrollmentToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have returned Error');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });
        });
    });

    describe('* delete enrollment', () => {
        describe('* successful should return nothing with 204 status code', () => {
            it('successful request', async () => {
                jest.spyOn(enrollmentService, 'delete')
                    .mockImplementation(async (): Promise<void> => Promise.resolve());

                const mockIdToSatisfyParameter = '1';
                const mockTokenToSatisfyParameter = 'token';
                const mockUserToSatisfyParameter = new User();
                const res = mockResponse();

                await enrollmentController.delete(mockIdToSatisfyParameter,
                    mockTokenToSatisfyParameter, mockUserToSatisfyParameter, res);

                expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                expect(res.status).toBeCalledTimes(1);
            });
        });

        describe('* failure should return error', () => {
            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(enrollmentService, 'delete')
                    .mockImplementation(async (): Promise<void> => Promise.reject(result));

                const mockIdToSatisfyParameter = '1';
                const mockTokenToSatisfyParameter = 'token';
                const mockUserToSatisfyParameter = new User();
                const res = mockResponse();

                await enrollmentController.delete(mockIdToSatisfyParameter,
                    mockTokenToSatisfyParameter, mockUserToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have returned Error');
                    }).catch(err => {
                        expect(err).toBe(result);
                    });
            });
        });
    });

    describe('* allowed to edit', () => {
        describe('* successful should return object with 200 status code', () => {
            it('successful request', async () => {
                const result = {};

                jest.spyOn(enrollmentService, 'checkPermissions')
                    .mockImplementation(async (): Promise<any> => Promise.resolve(result));

                const mockUserToSatisfyParameter = new User();
                const mockIdToSatisfyParameter = '1';
                const mockTokenToSatisfyParameter = 'token';
                const res = mockResponse();

                await enrollmentController
                    .checkPermissions(mockUserToSatisfyParameter,
                        mockTokenToSatisfyParameter, mockIdToSatisfyParameter, res);

                expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toBeCalledWith(result);
            });
        });

        describe('* failure should return error', () => {
            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(enrollmentService, 'checkPermissions')
                    .mockImplementation(async (): Promise<any> => Promise.reject(result));

                const mockUserToSatisfyParameter = new User();
                const mockIdToSatisfyParameter = '1';
                const mockTokenToSatisfyParameter = 'token';
                const res = mockResponse();

                await enrollmentController
                    .checkPermissions(mockUserToSatisfyParameter,
                        mockTokenToSatisfyParameter, mockIdToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have returned Error');
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

