import {Test, TestingModule} from '@nestjs/testing';

import {User} from './user.entity';
import {UserService} from './user.service';
import {AuthService} from '../../auth/auth.service';
import {UserController} from './user.controller';

import {HttpStatus, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {EmptyFieldsException} from '../../exceptions/EmptyFieldsException';
import {InvalidTokenException} from '../../exceptions/InvalidTokenException';
import {AlreadyUsedException} from '../../exceptions/AlreadyUsedException';
import {InvalidRequestException} from '../../exceptions/InvalidRequestException';
import {UnknownUserException} from '../../exceptions/UnknownUserException';

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
                expect(res.status).toBeCalledTimes(1);
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
                expect(res.status).toBeCalledTimes(1);
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
                expect(res.status).toBeCalledTimes(1);
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
                    expect(res.status).toBeCalledTimes(1);
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
                    expect(res.status).toBeCalledTimes(1);
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
                    expect(res.status).toBeCalledTimes(1);
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
                expect(res.status).toBeCalledTimes(1);
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
                expect(res.status).toBeCalledTimes(1);
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
                    expect(res.status).toBeCalledTimes(1);
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
                    expect(res.status).toBeCalledTimes(1);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'EMPTY_FIELDS',
                        message: 'Due to the mail change you need to provide a domain for the activation call',
                        data: null
                    });
                });
            });
        });

        describe('* failure should return error with 500 status code', () => {
            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(userService, 'update')
                    .mockImplementation(async (): Promise<User> => Promise.reject(result));

                const mockUpdatedUserSatisfyParameters = new User();
                const mockUserToSatisfyParameters = new User();
                const res = mockResponse();

                await userController.update(mockUserToSatisfyParameters, mockUpdatedUserSatisfyParameters, res);
                expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith({
                    code: 'UNDEFINED',
                    message: 'Some error occurred. Please try again later or contact the support with the appended error Code',
                    data: expect.stringMatching(/^.{10}$/)
                });
            });
        });
    });

    describe('* verify account (by link from mail)', () => {
        describe('* successful should return nothing with 200 status code', () => {
            it('successful request', async () => {
                jest.spyOn(userService, 'activate')
                    .mockImplementation(async (): Promise<boolean> => Promise.resolve(true));

                const mockMailToSatisfyParameters = 'mocked@mail.de';
                const mockTokenToSatisfyParameters = 'mockedToken';
                const res = mockResponse();

                await userController.activate(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
                expect(res.status).toBeCalledTimes(1);
            });
        });

        describe('* failure should return error with 400 status code', () => {
            describe('* invalid token', () => {
                it('token mismatch', async () => {
                    const result = new InvalidTokenException('INVALID',
                        'Provided token is not valid');

                    jest.spyOn(userService, 'activate')
                        .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockTokenToSatisfyParameters = 'mockedToken';
                    const res = mockResponse();

                    await userController.activate(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
                    expect(res.status).toBeCalledTimes(1);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'INVALID',
                        message: 'Provided token is not valid',
                        data: null,
                    });
                });

                it('token used', async () => {
                    const result = new InvalidTokenException('USED',
                        'User is already verified');

                    jest.spyOn(userService, 'activate')
                        .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockTokenToSatisfyParameters = 'mockedToken';
                    const res = mockResponse();

                    await userController.activate(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
                    expect(res.status).toBeCalledTimes(1);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'USED',
                        message: 'User is already verified',
                        data: null,
                    });
                });
            });
        });

        describe('* failure should return error with 410 status code', () => {
            describe('* user not found', () => {
                it('user gone', async () => {
                    const result = new UnknownUserException();

                    jest.spyOn(userService, 'activate')
                        .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockTokenToSatisfyParameters = 'mockedToken';
                    const res = mockResponse();

                    await userController.activate(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.GONE);
                    expect(res.status).toBeCalledTimes(1);
                });
            });
        });

        describe('* failure should return error with 500 status code', () => {
            it('undefined error has occurred', async () => {
                const result = new Error();

                jest.spyOn(userService, 'activate')
                    .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                const mockMailToSatisfyParameters = 'mocked@mail.de';
                const mockTokenToSatisfyParameters = 'mockedToken';
                const res = mockResponse();

                await userController.activate(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith({
                    code: 'UNDEFINED',
                    message: 'Some error occurred. Please try again later or contact the support with the appended error Code',
                    data: expect.stringMatching(/^.{10}$/)
                });
            });
        });
    });

    describe('* passwordreset', () => {
        describe('* initialization', () => {
            describe('* successful should return 204 status code', () => {
                it('successful request', async () => {
                    jest.spyOn(userService, 'resetPasswordInitialization')
                        .mockImplementation(async (): Promise<void> => Promise.resolve());

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockDomainToSatisfyParameters = 'my.domain.tld';
                    const res = mockResponse();

                    await userController.resetPasswordInitialization(mockMailToSatisfyParameters, mockDomainToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                    expect(res.status).toBeCalledTimes(1);
                });
            });

            describe('* failure should return error with 500 status code', () => {
                it('undefined error has occurred', async () => {
                    const result = new Error();

                    jest.spyOn(userService, 'resetPasswordInitialization')
                        .mockImplementation(async (): Promise<void> => Promise.reject(result));

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockDomainToSatisfyParameters = 'my.domain.tld';
                    const res = mockResponse();

                    await userController.resetPasswordInitialization(mockMailToSatisfyParameters, mockDomainToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
                    expect(res.status).toBeCalledTimes(1);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'UNDEFINED',
                        message: 'Some error occurred. Please try again later or contact the support with the appended error Code',
                        data: expect.stringMatching(/^.{10}$/)
                    });
                });
            });
        });

        describe('* link verification', () => {
            describe('* successful should return 204 status code', () => {
                it('successful request', async () => {
                    jest.spyOn(userService, 'resetPasswordTokenVerification')
                        .mockImplementation(async (): Promise<boolean> => Promise.resolve(true));

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockTokenToSatisfyParameters = 'token';
                    const res = mockResponse();

                    await userController.resetPasswordTokenVerification(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                    expect(res.status).toBeCalledTimes(1);
                });
            });

            describe('* failure should return error with 400 status code', () => {
                describe('* invalid token', () => {
                    it('token mismatch', async () => {
                        const result = new InvalidTokenException('INVALID',
                            'Provided token is not valid');

                        jest.spyOn(userService, 'resetPasswordTokenVerification')
                            .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                        const mockMailToSatisfyParameters = 'mocked@mail.de';
                        const mockTokenToSatisfyParameters = 'token';
                        const res = mockResponse();

                        await userController.resetPasswordTokenVerification(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                        expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
                        expect(res.status).toBeCalledTimes(1);
                        expect(res.json).toHaveBeenCalledWith({
                            code: 'INVALID',
                            message: 'Provided token is not valid',
                            data: null,
                        });
                    });

                    it('token expired', async () => {
                        const result = new InvalidTokenException('EXPIRED',
                            'Provided token expired');

                        jest.spyOn(userService, 'resetPasswordTokenVerification')
                            .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                        const mockMailToSatisfyParameters = 'mocked@mail.de';
                        const mockTokenToSatisfyParameters = 'token';
                        const res = mockResponse();

                        await userController.resetPasswordTokenVerification(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                        expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
                        expect(res.status).toBeCalledTimes(1);
                        expect(res.json).toHaveBeenCalledWith({
                            code: 'EXPIRED',
                            message: 'Provided token expired',
                            data: null,
                        });
                    });

                    it('token used', async () => {
                        const date = new Date();

                        const result = new AlreadyUsedException('USED',
                            'Provided token was already used at the following date',
                            date);

                        jest.spyOn(userService, 'resetPasswordTokenVerification')
                            .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                        const mockMailToSatisfyParameters = 'mocked@mail.de';
                        const mockTokenToSatisfyParameters = 'token';
                        const res = mockResponse();

                        await userController.resetPasswordTokenVerification(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                        expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
                        expect(res.status).toBeCalledTimes(1);
                        expect(res.json).toHaveBeenCalledWith({
                            code: 'USED',
                            message: 'Provided token was already used at the following date',
                            data: date,
                        });
                    });

                    it('token outdated', async () => {
                        const result = new AlreadyUsedException('OUTDATED',
                            'Provided token was already replaced by a new one');

                        jest.spyOn(userService, 'resetPasswordTokenVerification')
                            .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                        const mockMailToSatisfyParameters = 'mocked@mail.de';
                        const mockTokenToSatisfyParameters = 'token';
                        const res = mockResponse();

                        await userController.resetPasswordTokenVerification(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                        expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
                        expect(res.status).toBeCalledTimes(1);
                        expect(res.json).toHaveBeenCalledWith({
                            code: 'OUTDATED',
                            message: 'Provided token was already replaced by a new one',
                            data: null,
                        });
                    });
                });
            });

            describe('* failure should return error with 500 status code', () => {
                it('undefined error has occurred', async () => {
                    const result = new Error();

                    jest.spyOn(userService, 'resetPasswordTokenVerification')
                        .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockTokenToSatisfyParameters = 'token';
                    const res = mockResponse();

                    await userController.resetPasswordTokenVerification(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
                    expect(res.status).toBeCalledTimes(1);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'UNDEFINED',
                        message: 'Some error occurred. Please try again later or contact the support with the appended error Code',
                        data: expect.stringMatching(/^.{10}$/)
                    });
                });
            });
        });
        describe('* set new password', () => {
            describe('* successful should return 204 status code', () => {
                it('successful request', async () => {
                    jest.spyOn(userService, 'updatePassword')
                        .mockImplementation(async (): Promise<boolean> => Promise.resolve(true));

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockTokenToSatisfyParameters = 'token';
                    const mockPasswordToSatisfyParameters = 'password';
                    const res = mockResponse();

                    await userController.resetPassword(mockMailToSatisfyParameters,
                        mockTokenToSatisfyParameters, mockPasswordToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                    expect(res.status).toBeCalledTimes(1);
                });
            });

            describe('* unauthorized return error with 401 status code', () => {
                it('token invalid', async () => {
                    const result = new UnauthorizedException();

                    jest.spyOn(userService, 'updatePassword')
                        .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockTokenToSatisfyParameters = 'token';
                    const mockPasswordToSatisfyParameters = 'password';
                    const res = mockResponse();

                    await userController.resetPassword(mockMailToSatisfyParameters,
                        mockTokenToSatisfyParameters, mockPasswordToSatisfyParameters, res).then(() => {
                        throw new Error('I have failed you, Anakin. Expected resetPassword to throw error');
                    }).catch(err => {
                        expect(err).toBeInstanceOf(UnauthorizedException);
                    });
                });
            });

            describe('* failure should return error with 500 status code', () => {
                it('undefined error has occurred', async () => {
                    const result = new Error();

                    jest.spyOn(userService, 'updatePassword')
                        .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockTokenToSatisfyParameters = 'token';
                    const mockPasswordToSatisfyParameters = 'password';
                    const res = mockResponse();

                    await userController.resetPassword(mockMailToSatisfyParameters,
                        mockTokenToSatisfyParameters, mockPasswordToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
                    expect(res.status).toBeCalledTimes(1);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'UNDEFINED',
                        message: 'Some error occurred. Please try again later or contact the support with the appended error Code',
                        data: expect.stringMatching(/^.{10}$/)
                    });
                });
            });
        });
    });

    describe('* mail change', () => {
        describe('* verify and execute', () => {
            describe('* successful should return 204 status code', () => {
                it('successful request', async () => {
                    jest.spyOn(userService, 'mailChangeVerifyTokenAndExecuteChange')
                        .mockImplementation(async (): Promise<boolean> => Promise.resolve(true));

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockTokenToSatisfyParameters = 'token';
                    const res = mockResponse();

                    await userController.mailChangeVerifyTokenAndExecuteChange(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                    expect(res.status).toBeCalledTimes(1);
                });
            });

            describe('* unauthorized return error with 401 status code', () => {
                it('token invalid', async () => {
                    const result = new UnauthorizedException();

                    jest.spyOn(userService, 'mailChangeVerifyTokenAndExecuteChange')
                        .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockTokenToSatisfyParameters = 'token';
                    const res = mockResponse();

                    await userController.mailChangeVerifyTokenAndExecuteChange(mockMailToSatisfyParameters,
                        mockTokenToSatisfyParameters, res).then(() => {
                        throw new Error('I have failed you, Anakin. Expected resetPassword to throw error');
                    }).catch(err => {
                        expect(err).toBeInstanceOf(UnauthorizedException);
                    });
                });
            });

            describe('* failure should return error with 500 status code', () => {
                it('undefined error has occurred', async () => {
                    const result = new Error();

                    jest.spyOn(userService, 'mailChangeVerifyTokenAndExecuteChange')
                        .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                    const mockMailToSatisfyParameters = 'mocked@mail.de';
                    const mockTokenToSatisfyParameters = 'token';
                    const res = mockResponse();

                    await userController.mailChangeVerifyTokenAndExecuteChange(mockMailToSatisfyParameters, mockTokenToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
                    expect(res.status).toBeCalledTimes(1);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'UNDEFINED',
                        message: 'Some error occurred. Please try again later or contact the support with the appended error Code',
                        data: expect.stringMatching(/^.{10}$/)
                    });
                });
            });
        });

        describe('* resend verification mail', () => {
            describe('* successful should return 204 status code', () => {
                it('successful request', async () => {
                    jest.spyOn(userService, 'mailChangeResendMail')
                        .mockImplementation(async (): Promise<boolean> => Promise.resolve(true));

                    const mockUserToSatisfyParameter = new User();
                    const mockDomainToSatisfyParameters = 'my.domain.tld';
                    const res = mockResponse();

                    await userController.mailChangeResendMail(mockUserToSatisfyParameter, mockDomainToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                    expect(res.status).toBeCalledTimes(1);
                });
            });

            describe('* failure should return error with 400 status code', () => {
                it('no active mail change - can\'t resend', async () => {
                    const result = new InvalidRequestException('INVALID',
                        'There is no active mail change going on. Email resend is not possible');

                    jest.spyOn(userService, 'mailChangeResendMail')
                        .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                    const mockUserToSatisfyParameter = new User();
                    const mockDomainToSatisfyParameters = 'my.domain.tld';
                    const res = mockResponse();

                    await userController.mailChangeResendMail(mockUserToSatisfyParameter, mockDomainToSatisfyParameters, res);

                    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
                    expect(res.status).toBeCalledTimes(1);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'INVALID',
                        message: 'There is no active mail change going on. Email resend is not possible',
                        data: null,
                    });
                });
            });

            describe('* failure should return error with 500 status code', () => {
                it('undefined error has occurred', async () => {
                    const result = new Error();

                    jest.spyOn(userService, 'mailChangeResendMail')
                        .mockImplementation(async (): Promise<boolean> => Promise.reject(result));

                    const mockUserToSatisfyParameter = new User();
                    const mockDomainToSatisfyParameters = 'my.domain.tld';
                    const res = mockResponse();

                    await userController.mailChangeResendMail(mockUserToSatisfyParameter, mockDomainToSatisfyParameters, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
                    expect(res.status).toBeCalledTimes(1);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'UNDEFINED',
                        message: 'Some error occurred. Please try again later or contact the support with the appended error Code',
                        data: expect.stringMatching(/^.{10}$/)
                    });
                });
            });
        });

        describe('* deactivate existing token', () => {
            describe('* successful should return 204 status code', () => {
                it('successful request', async () => {
                    jest.spyOn(userService, 'mailChangeDeactivateToken')
                        .mockImplementation(async (): Promise<void> => Promise.resolve());

                    const mockUserToSatisfyParameter = new User();
                    const res = mockResponse();

                    await userController.mailChangeDeactivateToken(mockUserToSatisfyParameter, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
                    expect(res.status).toBeCalledTimes(1);
                });
            });

            describe('* failure should return error with 500 status code', () => {
                it('undefined error has occurred', async () => {
                    const result = new Error();

                    jest.spyOn(userService, 'mailChangeDeactivateToken')
                        .mockImplementation(async (): Promise<void> => Promise.reject(result));

                    const mockUserToSatisfyParameter = new User();
                    const res = mockResponse();

                    await userController.mailChangeDeactivateToken(mockUserToSatisfyParameter, res);
                    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
                    expect(res.status).toBeCalledTimes(1);
                    expect(res.json).toHaveBeenCalledWith({
                        code: 'UNDEFINED',
                        message: 'Some error occurred. Please try again later or contact the support with the appended error Code',
                        data: expect.stringMatching(/^.{10}$/)
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
