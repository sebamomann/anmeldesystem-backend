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
import {EntityNotFoundException} from '../exceptions/EntityNotFoundException';

const bcrypt = require('bcryptjs');

describe('AuthService', () => {
    let authService: AuthService;
    let userService: UserService;
    let jwtService: JwtService;
    let mailerService: MailerService;

    let module: TestingModule;

    let userRepositoryMock: MockType<Repository<User>>;
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
                {provide: getRepositoryToken(User), useFactory: repositoryMockFactory},
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
        telegramUserRepositoryMock = module.get(getRepositoryToken(TelegramUser));
        passwordResetRepositoryMock = module.get(getRepositoryToken(PasswordReset));
        passwordChangeRepositoryMock = module.get(getRepositoryToken(PasswordChange));
        emailChangeRepositoryMock = module.get(getRepositoryToken(EmailChange));
    });

    it('should be defined', () => {
        expect(authService).toBeDefined();
    });

    describe('* validate user', () => {
        describe('* successful should return user object', () => {
            it('successful request', async () => {
                const value = 'usernameOrMail';
                const password = '123';

                const user = new User();
                user.username = 'username';
                user.mail = 'mail@example.com';

                userRepositoryMock.findOne.mockReturnValueOnce(user);
                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(true);

                const actual = await authService.validateUser(value, password);
                expect(typeof actual).toBe('object');
                expect(actual.username).toEqual(user.username);
                expect(actual.mail).toEqual(user.mail);
            });
        });

        describe('* successful should return user object', () => {
            it('user not found', async () => {
                const value = 'usernameOrMail';
                const password = '123';

                userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                await authService.validateUser(value, password)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toBe('user');
                    });
            });

            it('wrong password', async () => {
                const value = 'usernameOrMail';
                const password = '123';

                const user = new User();
                user.username = 'username';
                user.mail = 'mail@example.com';

                const _date = Date.now();
                const date = new Date(_date);

                userRepositoryMock.findOne.mockReturnValueOnce(user);
                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(false);
                jest.spyOn(userService, 'getLastPasswordDate').mockReturnValueOnce(Promise.resolve(_date));

                const actual = await authService.validateUser(value, password);
                expect(actual).toEqual(date);
            });

            it('wrong password - never used', async () => {
                const value = 'usernameOrMail';
                const password = '123';

                const user = new User();
                user.username = 'username';
                user.mail = 'mail@example.com';

                userRepositoryMock.findOne.mockReturnValueOnce(user);
                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(false);
                jest.spyOn(userService, 'getLastPasswordDate').mockReturnValueOnce(null);

                const actual = await authService.validateUser(value, password);
                expect(actual).toBe(null);
            });
        });
    });

    describe('* append jwt', () => {
        describe('* successful should return user object with jwt', () => {
            it('successful', async () => {
                const user = new User();
                user.id = '1';
                user.mail = 'mail@example.ocm';
                user.username = 'username';

                jest.spyOn(jwtService, 'sign').mockReturnValueOnce('token');

                const actual = authService.addJwtToObject(user);
                expect(actual.token).toEqual(user.token);
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

