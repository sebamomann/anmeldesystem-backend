import {Test, TestingModule} from '@nestjs/testing';
import {AuthService} from './auth.service';
import {UserService} from '../modules/user/user.service';
import {JwtService} from '@nestjs/jwt';
import {Repository} from 'typeorm';
import {User} from '../modules/user/user.entity';
import {getRepositoryToken} from '@nestjs/typeorm';
import {MailerService} from '@nest-modules/mailer';
import {TelegramUser} from '../modules/user/telegram/telegram-user.entity';
import {PasswordReset} from '../modules/user/password-reset/password-reset.entity';
import {PasswordChange} from '../modules/user/password-change/password-change.entity';
import {EmailChange} from '../modules/user/email-change/email-change.entity';
import {MAILER_OPTIONS} from '@nest-modules/mailer/dist/constants/mailer-options.constant';
import {JWT_MODULE_OPTIONS} from '@nestjs/jwt/dist/jwt.constants';
import {ExtractJwt} from 'passport-jwt';
import {jwtConstants} from './constants';
import {Session} from '../modules/user/session.entity';
import {UnauthorizedException} from '@nestjs/common';
import {EntityNotFoundException} from '../exceptions/EntityNotFoundException';

const bcrypt = require('bcryptjs');

describe('AuthService', () => {
    let authService: AuthService;
    let userService: UserService;
    let jwtService: JwtService;
    let mailerService: MailerService;

    let module: TestingModule;

    let userRepositoryMock: MockType<Repository<User>>;
    let sessionRepositoryMock: MockType<Repository<Session>>;
    let telegramUserRepositoryMock: MockType<Repository<TelegramUser>>;
    let passwordResetRepositoryMock: MockType<Repository<PasswordReset>>;
    let passwordChangeRepositoryMock: MockType<Repository<PasswordChange>>;
    let emailChangeRepositoryMock: MockType<Repository<EmailChange>>;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [AuthService,
                UserService,
                JwtService,
                MailerService,
                {provide: getRepositoryToken(User), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Session), useFactory: repositoryMockFactory},
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
                {
                    name: JWT_MODULE_OPTIONS,
                    provide: JWT_MODULE_OPTIONS,
                    useValue: {

                        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                        ignoreExpiration: false,
                        secretOrKey: jwtConstants.secret,
                    }
                }
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        userService = module.get<UserService>(UserService);
        jwtService = module.get<JwtService>(JwtService);
        mailerService = module.get<MailerService>(MailerService);

        userRepositoryMock = module.get(getRepositoryToken(User));
        sessionRepositoryMock = module.get(getRepositoryToken(Session));
        telegramUserRepositoryMock = module.get(getRepositoryToken(TelegramUser));
        passwordResetRepositoryMock = module.get(getRepositoryToken(PasswordReset));
        passwordChangeRepositoryMock = module.get(getRepositoryToken(PasswordChange));
        emailChangeRepositoryMock = module.get(getRepositoryToken(EmailChange));
    });

    it('should be defined', () => {
        expect(authService).toBeDefined();
    });

    describe('* login user', () => {
        describe('* successful should return user object', () => {
            it('* correct login data given', async () => {
                const __given_username = 'usernameOrMail';
                const __given_password = '123';

                const __existing_user = new User();
                __existing_user.username = __given_username;
                __existing_user.mail = 'mail@example.com';
                __existing_user.activated = true;

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(true); // force password compare to be true

                const __actual = await authService.login(__given_username, __given_password);
                expect(typeof __actual).toBe('object');
                expect(__actual.username).toEqual(__existing_user.username);
                expect(__actual.mail).toEqual(__existing_user.mail);
            });
        });

        describe('* failure should return error', () => {
            it('* invalid username', async () => {
                const __given_username = 'usernameOrMail';
                const __given_password = '123';

                userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                authService.login(__given_username, __given_password)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an UnauthorizedException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(UnauthorizedException);
                    });
            });

            it('* invalid password', async () => {
                const __given_username = 'usernameOrMail';
                const __given_password = '123';

                const __existing_user = new User();
                __existing_user.username = 'username';
                __existing_user.mail = 'mail@example.com';
                __existing_user.activated = true;

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(false); // force password compare to be false

                authService.login(__given_username, __given_password)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an UnauthorizedException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(UnauthorizedException);
                    });
            });

            it('* invalid password - changed earlier', async () => {
                const __given_username = 'usernameOrMail';
                const __given_password = '123';

                const __existing_user = new User();
                __existing_user.username = 'username';
                __existing_user.mail = 'mail@example.com';
                __existing_user.activated = true;

                const _date = Date.now();
                const date = new Date(_date);

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(false); // force password compare to be false
                jest.spyOn(userService, 'getLastPasswordDate').mockReturnValueOnce(Promise.resolve(_date));

                authService.login(__given_username, __given_password)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an UnauthorizedException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(UnauthorizedException);
                        expect(err.response.code).toEqual('INVALID_PASSWORD');
                        expect(err.response.data).toEqual(date);
                    });
            });

            it('* user not activated', async () => {
                const __given_username = 'usernameOrMail';
                const __given_password = '123';

                const __existing_user = new User();
                __existing_user.username = 'username';
                __existing_user.mail = 'mail@example.com';
                __existing_user.activated = false;

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);

                authService.login(__given_username, __given_password)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an UnauthorizedException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(UnauthorizedException);
                        expect(err.response.code).toEqual('ACCOUNT_LOCK');
                        expect(err.response.data).toEqual('NOT_ACTIVATED');
                    });
            });
        });
    });

    describe('* append jwt', () => {
        describe('* successful should return user object with added jwt', () => {
            it('* correctly appended', async () => {
                const __existing_user = new User();
                __existing_user.id = 'd804e03b-7dc9-42e7-a1df-40fbae33d187';
                __existing_user.mail = 'mail@example.ocm';
                __existing_user.username = 'username';

                jest.spyOn(jwtService, 'sign').mockReturnValueOnce('token'); // create fake token 'token'

                const __actual_user = authService.addJwtToObject(__existing_user);
                expect(__actual_user.token).toEqual(__existing_user.token);
            });
        });
    });

    describe('* generate new access token', () => {
        describe('* successful should return user object with new session data', () => {
            it('* correct session data for token generation', async () => {
                let __given_data: { user: User; refreshToken: string };
                const __given_user = new User();
                __given_user.id = 'd804e03b-7dc9-42e7-a1df-40fbae33d187';
                __given_data = {
                    user: __given_user,
                    refreshToken: 'QtLOaNVnZZN3vQQxWcXwhKEzclduk8rB38hgL4C0'
                };

                const __existing_user = new User();
                __existing_user.id = __given_data.user.id;
                __existing_user.username = __given_data.user.username;
                __existing_user.mail = 'mail@example.com';
                __existing_user.activated = true;

                const __existing_session = new Session();
                __existing_session.id = 'eeee4e84-b183-42ae-91f2-8c9f857bd5a0';
                __existing_session.times_used = 1;
                __existing_session.last_used = new Date();

                const fakeToken = 'token';

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                sessionRepositoryMock.findOne.mockReturnValueOnce(__existing_session);
                sessionRepositoryMock.save.mockReturnValueOnce(__existing_session);
                jest.spyOn(jwtService, 'sign').mockReturnValueOnce(fakeToken); // create fake token 'token'

                const __expected = {
                    ...__existing_user,
                    refreshToken: __given_data.refreshToken,
                    token: fakeToken
                };

                const __actual = await authService.generateAccessToken(__given_data);
                expect(__actual).toEqual(__expected);
            });
        });

        describe('* failure should return error', () => {
            it('* user not found', async () => {
                let __given_data: { user: User; refreshToken: string };
                const __given_user = new User();
                __given_user.id = 'd804e03b-7dc9-42e7-a1df-40fbae33d187';
                __given_data = {
                    user: __given_user,
                    refreshToken: 'QtLOaNVnZZN3vQQxWcXwhKEzclduk8rB38hgL4C0'
                };

                const __existing_user = undefined;

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);

                authService.generateAccessToken(__given_data)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                    });
            });

            it('* invalid refreshtoken', async () => {
                let __given_data: { user: User; refreshToken: string };
                const __given_user = new User();
                __given_user.id = 'd804e03b-7dc9-42e7-a1df-40fbae33d187';
                __given_data = {
                    user: __given_user,
                    refreshToken: 'QtLOaNVnZZN3vQQxWcXwhKEzclduk8rB38hgL4C0'
                };

                const __existing_user = new User();
                __existing_user.id = __given_data.user.id;
                __existing_user.username = __given_data.user.username;
                __existing_user.mail = 'mail@example.com';
                __existing_user.activated = true;

                const __existing_session = undefined;

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                sessionRepositoryMock.findOne.mockReturnValueOnce(__existing_session);

                authService.generateAccessToken(__given_data)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an UnauthorizedException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(UnauthorizedException);
                    });
            });
        });
    });
});

// @ts-ignore
export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
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

