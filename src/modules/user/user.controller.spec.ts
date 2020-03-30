import {Test, TestingModule} from '@nestjs/testing';

import {User} from './user.entity';
import {UserService} from './user.service';
import {AuthService} from '../../auth/auth.service';
import {UserController} from './user.controller';

import {HttpStatus, NotFoundException} from '@nestjs/common';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {EmptyFieldsException} from '../../exceptions/EmptyFieldsException';

jest.mock('./user.service');
jest.mock('../../auth/auth.service');

describe('User Controller', () => {
    let authService: AuthService;
    let userService: UserService;

    let userController: UserController;

    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                UserService,
                AuthService
            ]
        }).compile();

        userService = module.get<UserService>(UserService);
        authService = module.get<AuthService>(AuthService);
        userController = module.get<UserController>(UserController);
    });

    describe('* find user by Id (ID would be retrieved from JWT)', () => {
        describe('* successful should return an entity of user with 200 status code', () => {
            it('successful request', async () => {
                const result = new User();

                jest.spyOn(userService, 'get')
                    .mockImplementation(async (): Promise<User> => Promise.resolve(result));

                const res = mockResponse();

                await userController.get(new User(), res);
                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith(result);
            });
        });

        describe('* failure should return error with 410 status code', () => {
            it('user gone', async () => {
                const result = new NotFoundException();

                jest.spyOn(userService, 'get')
                    .mockImplementation(async (): Promise<User> => Promise.reject(result));

                const mockUserToSatisfyParameters = new User();
                const res = mockResponse();

                await userController.get(mockUserToSatisfyParameters, res);
                expect(res.status).toHaveBeenCalledWith(HttpStatus.GONE);
            });
        });
    });

    describe('* register user', () => {
        describe('* successful should return created entity of user with 201 status code', () => {
            it('successful request', async () => {
                const result = new User();

                jest.spyOn(userService, 'register')
                    .mockImplementation(async (): Promise<User> => Promise.resolve(result));

                const mockUserToSatisfyParameters = new User();
                const mockDomainToSatisfyParameters = 'https://example.com';
                const res = mockResponse();

                await userController.register(mockUserToSatisfyParameters, mockDomainToSatisfyParameters, res);
                expect(res.status).toHaveBeenCalledWith(201);
                expect(res.json).toHaveBeenCalledWith(result);
            });
        });

        describe('* failure should return error with 400 status code ', () => {
            describe('* duplicate values (values already in use)', () => {
                it('username in use', async () => {
                    const result = new DuplicateValueException('DUPLICATE_ENTRY', '', ['username']);

                    jest.spyOn(userService, 'register')
                        .mockImplementation(async (): Promise<User> => Promise.reject(result));

                    const mockUserToSatisfyParameters = new User();
                    const mockDomainToSatisfyParameters = 'https://example.com';
                    const res = mockResponse();

                    await userController.register(mockUserToSatisfyParameters, mockDomainToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'DUPLICATE_ENTRY',
                        message: 'Following values are already in use',
                        data: ['username']
                    });
                });

                it('email in use', async () => {
                    const result = new DuplicateValueException('DUPLICATE_ENTRY',
                        'Following values are already in use',
                        ['email']);

                    jest.spyOn(userService, 'register')
                        .mockImplementation(async (): Promise<User> => Promise.reject(result));

                    const mockUserToSatisfyParameters = new User();
                    const mockDomainToSatisfyParameters = 'https://example.com';
                    const res = mockResponse();

                    await userController.register(mockUserToSatisfyParameters, mockDomainToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'DUPLICATE_ENTRY',
                        message: 'Following values are already in use',
                        data: ['email']
                    });
                });

                it('username and email in use', async () => {
                    const result = new DuplicateValueException('DUPLICATE_ENTRY',
                        '',
                        ['username', 'email']);

                    jest.spyOn(userService, 'register')
                        .mockImplementation(async (): Promise<User> => Promise.reject(result));

                    const mockUserToSatisfyParameters = new User();
                    const mockDomainToSatisfyParameters = 'https://example.com';
                    const res = mockResponse();

                    await userController.register(mockUserToSatisfyParameters, mockDomainToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'DUPLICATE_ENTRY',
                        message: 'Following values are already in use',
                        data: ['username', 'email']
                    });
                });
            });
        });

        describe('* failure should return error with 500 status code ', () => {
            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(userService, 'register')
                    .mockImplementation(async (): Promise<User> => Promise.reject(result));

                const mockUserToSatisfyParameters = new User();
                const mockDomainToSatisfyParameters = 'https://example.com';
                const res = mockResponse();

                await userController.register(mockUserToSatisfyParameters, mockDomainToSatisfyParameters, res);
                expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
                expect(res.json).toHaveBeenCalledWith({
                    code: 'UNDEFINED',
                    message: 'Some error occurred. Please try again later or contact the support with the appended error Code',
                    data: expect.stringMatching(/^.{10}$/)
                });
            });
        });
    });

    describe('* update user', () => {
        describe('* successful should return updated entity of user with 200 status code and jwt', () => {
            it('valid request', async () => {
                const result = new User();

                jest.spyOn(userService, 'update')
                    .mockImplementation(async (): Promise<User> => Promise.resolve(result));

                const resultWithToken = Object.assign({}, result);
                resultWithToken.token = 'header.body.signature';
                jest.spyOn(authService, 'addJwtToObject')
                    .mockImplementation((): User => resultWithToken);

                const mockUpdatedUserSatisfyParameters = new User();
                const mockUserToSatisfyParameters = new User();
                const res = mockResponse();

                await userController.update(mockUserToSatisfyParameters, mockUpdatedUserSatisfyParameters, res);
                expect(res.status).toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith(resultWithToken);
            });
        });

        describe('* failure should return error with 400 status code ', () => {
            describe('* duplicate values (values already in use)', () => {
                it('email in use', async () => {
                    const result = new DuplicateValueException('DUPLICATE_ENTRY',
                        'Following values are already in use',
                        ['email']);

                    jest.spyOn(userService, 'update')
                        .mockImplementation(async (): Promise<User> => Promise.reject(result));

                    const mockUpdatedUserSatisfyParameters = new User();
                    const mockUserToSatisfyParameters = new User();
                    const res = mockResponse();

                    await userController.update(mockUserToSatisfyParameters, mockUpdatedUserSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'DUPLICATE_ENTRY',
                        message: 'Following values are already in use',
                        data: ['email']
                    });
                });
            });

            describe('* missing values', () => {
                it('missing domain (when changing email address only)', async () => {
                    const result = new EmptyFieldsException('EMPTY_FIELDS',
                        'Due to the mail change you need to provide a domain for the activation call');

                    jest.spyOn(userService, 'update')
                        .mockImplementation(async (): Promise<User> => Promise.reject(result));

                    const mockUpdatedUserSatisfyParameters = new User();
                    const mockUserToSatisfyParameters = new User();
                    const res = mockResponse();

                    await userController.update(mockUserToSatisfyParameters, mockUpdatedUserSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'EMPTY_FIELDS',
                        message: 'Due to the mail change you need to provide a domain for the activation call',
                        data: null
                    });
                });
            });
        });

        describe('* failure should return error with 500 status code ', () => {
            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(userService, 'update')
                    .mockImplementation(async (): Promise<User> => Promise.reject(result));

                const mockUpdatedUserSatisfyParameters = new User();
                const mockUserToSatisfyParameters = new User();
                const res = mockResponse();

                await userController.update(mockUserToSatisfyParameters, mockUpdatedUserSatisfyParameters, res);
                expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
                expect(res.json).toHaveBeenCalledWith({
                    code: 'UNDEFINED',
                    message: 'Some error occurred. Please try again later or contact the support with the appended error Code',
                    data: expect.stringMatching(/^.{10}$/)
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

