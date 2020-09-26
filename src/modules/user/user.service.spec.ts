import {Test, TestingModule} from '@nestjs/testing';
import {UserService} from './user.service';
import {Repository} from 'typeorm';
import {User} from './user.entity';
import {getRepositoryToken} from '@nestjs/typeorm';
import {MailerService} from '@nest-modules/mailer';
import {TelegramUser} from './telegram/telegram-user.entity';
import {PasswordReset} from './password-reset/password-reset.entity';
import {PasswordChange} from './password-change/password-change.entity';
import {EmailChange} from './email-change/email-change.entity';
import {MAILER_OPTIONS} from '@nest-modules/mailer/dist/constants/mailer-options.constant';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {Session} from './session.entity';
import {InvalidTokenException} from '../../exceptions/InvalidTokenException';
import {AlreadyUsedException} from '../../exceptions/AlreadyUsedException';
import {EntityGoneException} from '../../exceptions/EntityGoneException';
import {EmptyFieldsException} from '../../exceptions/EmptyFieldsException';
import {ExpiredTokenException} from '../../exceptions/ExpiredTokenException';
import {InternalErrorException} from '../../exceptions/InternalErrorException';
import {InvalidRequestException} from '../../exceptions/InvalidRequestException';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const btoa = require('btoa');
var userMapper = require('./user.mapper');

describe('UserService', () => {
    let userService: UserService;
    let mailerService: MailerService;
    let module: TestingModule;
    let userRepositoryMock: MockType<Repository<User>>;
    let telegramUserRepositoryMock: MockType<Repository<TelegramUser>>;
    let passwordResetRepositoryMock: MockType<Repository<PasswordReset>>;
    let passwordChangeRepositoryMock: MockType<Repository<PasswordChange>>;
    let emailChangeRepositoryMock: MockType<Repository<EmailChange>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserService,
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
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
        mailerService = module.get<MailerService>(MailerService);

        userRepositoryMock = module.get(getRepositoryToken(User));
        telegramUserRepositoryMock = module.get(getRepositoryToken(TelegramUser));
        passwordResetRepositoryMock = module.get(getRepositoryToken(PasswordReset));
        passwordChangeRepositoryMock = module.get(getRepositoryToken(PasswordChange));
        emailChangeRepositoryMock = module.get(getRepositoryToken(EmailChange));
    });

    it('should be defined', () => {
        expect(userService).toBeDefined();
    });

    describe('* find user', () => {
        describe('* by id', () => {
            it('* successful should return entity', async () => {
                const __given_id = '583bb85b-c951-4cd0-8b82-16500b5bda17';

                const __existing_user = new User();
                __existing_user.id = __given_id;

                userRepositoryMock.findOne.mockReturnValue(__existing_user);

                const __expected = __existing_user;

                const __actual = await userService.findById(__given_id);

                expect(__actual).toEqual(__expected);
            });

            it('failure should return error', async (done) => {
                const __given_id = '583bb85b-c951-4cd0-8b82-16500b5bda17';

                const __existing_user = undefined;

                userRepositoryMock.findOne.mockReturnValue(__existing_user);

                try {
                    await userService.findById(__given_id);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    expect(e.data).toBe('user');
                    done();
                }
            });
        });

        describe('* by email', () => {
            it('* successful should return entity', async () => {
                const __given_email = 'test@example.com';

                const __existing_user = new User();
                __existing_user.id = __given_email;

                userRepositoryMock.findOne.mockReturnValue(__existing_user);

                const __expected = __existing_user;

                const __actual = await userService.findByEmail(__given_email);

                expect(__actual).toEqual(__expected);
            });

            it('failure should return error', async (done) => {
                const __given_email = 'test@example.com';

                const __existing_user = undefined;

                userRepositoryMock.findOne.mockReturnValue(__existing_user);

                try {
                    await userService.findByEmail(__given_email);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    expect(e.data).toBe('user');
                    done();
                }
            });
        });

        describe('* by username', () => {
            it('* successful should return entity', async () => {
                const __given_username = 'username';

                const __existing_user = new User();
                __existing_user.id = __given_username;

                userRepositoryMock.findOne.mockReturnValue(__existing_user);

                const __expected = __existing_user;

                const __actual = await userService.findByUsername(__given_username);

                expect(__actual).toEqual(__expected);
            });

            it('failure should return error', async (done) => {
                const __given_username = 'username';

                const __existing_user = undefined;

                userRepositoryMock.findOne.mockReturnValue(__existing_user);

                try {
                    await userService.findByUsername(__given_username);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    expect(e.data).toBe('user');
                    done();
                }
            });
        });

        describe('* by email or username', () => {
            it('* successful should return entity', async () => {
                const __given_username = 'username';

                const __existing_user = new User();
                __existing_user.id = __given_username;

                userRepositoryMock.findOne.mockReturnValue(__existing_user);

                const __expected = __existing_user;

                const __actual = await userService.findByEmailOrUsername(__given_username);

                expect(__actual).toEqual(__expected);
            });

            it('failure should return error', async (done) => {
                const __given_username = 'username';

                const __existing_user = undefined;

                userRepositoryMock.findOne.mockReturnValue(__existing_user);

                try {
                    await userService.findByEmailOrUsername(__given_username);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    expect(e.data).toBe('user');
                    done();
                }
            });
        });
    });

    describe('* get user object (for return)', () => {
        it('* successful should return entity', async () => {
            const __given_user = new User();
            __given_user.id = '583bb85b-c951-4cd0-8b82-16500b5bda17';

            const __existing_user = new User();
            __existing_user.id = __given_user.id;

            userRepositoryMock.findOne.mockReturnValue(__existing_user);

            const __expected = __existing_user;

            const __actual = await userService.get(__given_user);

            expect(__actual).toEqual(__expected);
        });

        it('failure should return error', async (done) => {
            const __given_user = new User();
            __given_user.id = '583bb85b-c951-4cd0-8b82-16500b5bda17';

            const __existing_user = undefined;

            userRepositoryMock.findOne.mockReturnValue(__existing_user);

            try {
                await userService.get(__given_user);
                done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
            } catch (e) {
                expect(e).toBeInstanceOf(EntityNotFoundException);
                expect(e.data).toBe('user');
                done();
            }
        });
    });

    describe('* get user', () => {
        it('should return entity if successful', async () => {
            const userToSatisfyParameter = new User();

            let user = new User();
            user.emailChange = [];
            userRepositoryMock.findOne.mockReturnValue(user);

            const actual = await userService.get(userToSatisfyParameter);

            user = userMapper.basic(userService, user);
            expect(actual).toEqual(user);
        });

        it('should return error if entity not found', async () => {
            const userToSatisfyParameter = new User();

            const user = undefined;

            userRepositoryMock.findOne.mockReturnValue(user);
            userService.get(userToSatisfyParameter)
                .then(() => {
                    throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                })
                .catch((err) => {
                    expect(err).toBeInstanceOf(EntityNotFoundException);
                });
        });
    });

    describe('* register user', () => {
        describe('* successful should return created object', () => {
            it('* successful', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                __given_user.mail = 'mail@example.com';
                __given_user.password = 'password';
                const __given_domain = 'example.com/{{0}}/{{1}}';

                userRepositoryMock.findOne.mockReturnValueOnce(undefined); // username not in use
                userRepositoryMock.findOne.mockReturnValueOnce(undefined); // email not in use
                userRepositoryMock.save.mockReturnValueOnce(__given_user);

                jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                const actual = await userService.register(__given_user, __given_domain);

                const __expected = userMapper.basic(userService, __given_user);
                expect(actual).toEqual(__expected);
            });

            it('successful - even if send mail failed', async () => {
                const __given_user = new User();
                __given_user.username = 'username';
                __given_user.mail = 'mail@example.com';
                __given_user.password = 'password';
                const __given_domain = 'example.com/{{0}}/{{1}}';

                userRepositoryMock.findOne.mockReturnValueOnce(undefined); // username not in use
                userRepositoryMock.findOne.mockReturnValueOnce(undefined); // email not in use
                userRepositoryMock.save.mockReturnValueOnce(__given_user);

                jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.reject({}));

                const actual = await userService.register(__given_user, __given_domain);

                const __expected = userMapper.basic(userService, __given_user);
                expect(actual).toEqual(__expected);
            });
        });

        describe('* failure should return error', () => {
            describe('* duplicate values', () => {
                it('* username', async (done) => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    __given_user.mail = 'mail@example.com';
                    __given_user.password = 'password';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    userRepositoryMock.findOne.mockReturnValueOnce(new User()); // username already taken
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined); // needed because always checking username and email on register

                    try {
                        await userService.register(__given_user, __given_domain);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten an DuplicateValueException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(DuplicateValueException);
                        expect(e.data).toEqual(['username']);
                        done();
                    }
                });

                it('* email', async (done) => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    __given_user.mail = 'mail@example.com';
                    __given_user.password = 'password';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    userRepositoryMock.findOne.mockReturnValueOnce(new User()); // username already taken

                    try {
                        await userService.register(__given_user, __given_domain);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten an DuplicateValueException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(DuplicateValueException);
                        expect(e.data).toEqual(['email']);
                        done();
                    }
                });

                it('username and email', async (done) => {
                    const __given_user = new User();
                    __given_user.username = 'username';
                    __given_user.mail = 'mail@example.com';
                    __given_user.password = 'password';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    userRepositoryMock.findOne.mockReturnValueOnce(new User());
                    userRepositoryMock.findOne.mockReturnValueOnce(new User());

                    try {
                        await userService.register(__given_user, __given_domain);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten an DuplicateValueException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(DuplicateValueException);
                        expect(e.data.sort()).toEqual(['email', 'username'].sort());
                        done();
                    }
                });
            });
        });
    });

    describe('* update user', () => {
        describe('* successful should return updated entity', () => {
            it('* name', async () => {
                const __given_user_change_data = {
                    name: 'newName'
                };
                const __given_user = new User();
                __given_user.id = '1';
                const __given_domain = 'example.com/{{0}}/{{1}}';

                const __existing_user = new User();
                __existing_user.name = 'name';

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                userRepositoryMock.save.mockImplementation((val) => val);

                const actual = await userService.update(__given_user_change_data, __given_user, __given_domain);
                expect(actual.name).toEqual(__given_user_change_data.name);
            });

            describe('* email', () => {
                it('* still old email (due to pending verification)', async () => {
                    const __given_user_change_data = {
                        mail: 'newmail@example.com'
                    };
                    const __given_user = new User();
                    __given_user.id = '1';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    const __existing_user = new User();
                    __existing_user.mail = 'current@example.com';

                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined); // new mail not in use

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(undefined); // new mail not blocked
                    emailChangeRepositoryMock.query.mockReturnValueOnce(undefined); // invalidate all pending mal changes for user
                    emailChangeRepositoryMock.save.mockImplementationOnce(val => {
                        val.iat = new Date();
                        return val;
                    });

                    jest.spyOn(mailerService, 'sendMail').mockImplementationOnce((): Promise<any> => Promise.resolve({}));

                    userRepositoryMock.save.mockImplementation(val => val);

                    const actual = await userService.update(__given_user_change_data, __given_user, __given_domain);
                    expect(actual.mail).toEqual(__existing_user.mail);
                });

                it('* correct email change object', async () => {
                    const __given_user_change_data = {
                        mail: 'newmail@example.com'
                    };
                    const __given_user = new User();
                    __given_user.id = '1';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    const __existing_user = new User();
                    __existing_user.mail = 'current@example.com';

                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined); // new mail not in use

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(undefined); // new mail not blocked
                    emailChangeRepositoryMock.query.mockReturnValueOnce(undefined); // invalidate all pending mal changes for user
                    const date = new Date();
                    emailChangeRepositoryMock.save.mockImplementationOnce(val => {
                        val.iat = date;
                        return val;
                    });

                    jest.spyOn(mailerService, 'sendMail').mockImplementationOnce((): Promise<any> => Promise.resolve({}));

                    userRepositoryMock.save.mockImplementation((val) => val);

                    const __expected = new EmailChange();
                    __expected.newMail = __given_user_change_data.mail;
                    __expected.oldMail = __existing_user.mail;
                    __expected.iat = date;

                    const __actual = await userService.update(__given_user_change_data, __given_user, __given_domain);
                    expect(__actual.emailChange).toEqual([__expected]);
                    expect(__actual.emailChange).toHaveLength(1);
                });
            });

            it('update password', async () => {
                const __given_user_change_data = {
                    password: 'newPlainPassword'
                };
                const __given_user = new User();
                __given_user.id = '1';
                const __given_domain = 'example.com/{{0}}/{{1}}';

                const __existing_password = 'currentPassword';
                const __existing_user = new User();
                __existing_user.password = __existing_password;

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);

                jest.spyOn(mailerService, 'sendMail').mockImplementationOnce((): Promise<any> => Promise.resolve({}));

                userRepositoryMock.save.mockImplementation((val) => {
                    expect(val.password).not.toBe(__existing_password);
                    return val;
                });

                await userService.update(__given_user_change_data, __given_user, __given_domain);
            });

            it('* non existing attribute', async () => {
                const __given_user_change_data = {
                    invalid: 'attribute'
                };
                const __given_user = new User();
                __given_user.id = '1';
                const __given_domain = 'example.com/{{0}}/{{1}}';

                const __existing_user = new User();
                __existing_user.name = 'name';

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                userRepositoryMock.save.mockImplementation((val) => val);

                const __actual = await userService.update(__given_user_change_data, __given_user, __given_domain);
                expect(__actual).toEqual(__existing_user);
            });
        });

        describe('* failure should return error', () => {
            it('* user not found', async (done) => {
                const __given_user_change_data = {
                    name: 'newName'
                };
                const __given_user = new User();
                __given_user.id = '1';
                const __given_domain = 'example.com/{{0}}/{{1}}';

                const __existing_user = new User();
                __existing_user.name = 'name';

                userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                try {
                    await userService.update(__given_user_change_data, __given_user, __given_domain);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    expect(e.data).toEqual('user');
                    done();
                }
            });

            it('* email change error (just forward error)', async (done) => {
                const __given_user_change_data = {
                    mail: 'new@example.com'
                };
                const __given_user = new User();
                __given_user.id = '1';
                const __given_domain = 'example.com/{{0}}/{{1}}';

                const __existing_user = new User();
                __existing_user.mail = 'current@example.com';

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                try {
                    await userService.update(__given_user_change_data, __given_user, __given_domain);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    done();
                }
            });
        });
    });

    describe('* activate user', () => {
        it('* successful should return void', async (done) => {
            const __existing_user = new User();
            __existing_user.mail = 'mail@example.com';
            __existing_user.username = 'username';
            __existing_user.activated = false;
            __existing_user.iat = new Date();

            const __given_mail = __existing_user.mail;
            const __given_token = crypto
                .createHmac('sha256', __existing_user.mail + process.env.SALT_MAIL + __existing_user.username + (new Date(__existing_user.iat)).getTime())
                .digest('hex');

            userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);

            try {
                await userService.activateAccount(__given_mail, __given_token);
                done();
            } catch (e) {
                done.fail(new Error('I have failed you, Anakin. Should have been all fine (void fnc)'));
            }
        });

        describe('* failure should return error', () => {
            it('* user not found', async (done) => {
                const __existing_user = new User();
                __existing_user.mail = 'mail@example.com';
                __existing_user.username = 'username';
                __existing_user.activated = false;
                __existing_user.iat = new Date();

                const __given_mail = __existing_user.mail;
                const __given_token = crypto
                    .createHmac('sha256', __existing_user.mail + process.env.SALT_MAIL + __existing_user.username + __existing_user.iat)
                    .digest('hex');

                userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                try {
                    await userService.activateAccount(__given_mail, __given_token);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten EntityGoneException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityGoneException);
                    done();
                }
            });

            it('* invalid token', async (done) => {
                const __existing_user = new User();
                __existing_user.mail = 'mail@example.com';
                __existing_user.username = 'username';
                __existing_user.activated = false;
                __existing_user.iat = new Date();

                const __given_mail = __existing_user.mail;
                const __given_token = 'falseToken';

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);

                try {
                    await userService.activateAccount(__given_mail, __given_token);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten InvalidTokenException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(InvalidTokenException);
                    done();
                }
            });

            it('* already used', async (done) => {
                const __existing_user = new User();
                __existing_user.mail = 'mail@example.com';
                __existing_user.username = 'username';
                __existing_user.activated = true;
                __existing_user.iat = new Date();

                const __given_mail = __existing_user.mail;
                const __given_token = crypto
                    .createHmac('sha256', __existing_user.mail + process.env.SALT_MAIL + __existing_user.username + (new Date(__existing_user.iat)).getTime())
                    .digest('hex');

                userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);

                try {
                    await userService.activateAccount(__given_mail, __given_token);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten AlreadyUsedException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(AlreadyUsedException);
                    done();
                }
            });
        });
    });

    describe('* password reset', () => {
        describe('* initialization', () => {
            describe('* successful should return URL', () => {
                it('* normal', async () => {
                    const __given_mail = 'mail@example.com';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    const __existing_user = new User();
                    __existing_user.username = 'username';
                    __existing_user.mail = 'mail@example.com';

                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    passwordResetRepositoryMock.update.mockReturnValueOnce(undefined); // reset all pending password resets
                    passwordResetRepositoryMock.save.mockImplementationOnce(val => val);

                    jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                    const __actual = await userService.passwordReset_initialize(__given_mail, __given_domain);
                    const __expected_regex = new RegExp('https:\/\/' + __given_domain.split('/')[0] + '\/' + (btoa(__given_mail).replace('/\=/g', '')) + '\/.{64}', 'g');
                    expect(__actual).toMatch(__expected_regex);
                });

                it('* mail send failed', async () => {
                    const __given_mail = 'mail@example.com';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    const __existing_user = new User();
                    __existing_user.username = 'username';
                    __existing_user.mail = 'mail@example.com';

                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    passwordResetRepositoryMock.update.mockReturnValueOnce(undefined); // reset all pending password resets
                    passwordResetRepositoryMock.save.mockImplementationOnce(val => val);

                    jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.reject({}));

                    const __actual = await userService.passwordReset_initialize(__given_mail, __given_domain);
                    const __expected_regex = new RegExp('https:\/\/' + __given_domain.split('/')[0] + '\/' + (btoa(__given_mail).replace('/\=/g', '')) + '\/.{64}', 'g');
                    expect(__actual).toMatch(__expected_regex);
                });
            });

            describe('* failure should return error', () => {
                it('* user not found', async (done) => {
                    const __given_mail = 'mail@example.com';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    try {
                        await userService.passwordReset_initialize(__given_mail, __given_domain);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten EntityNotFoundException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(EntityNotFoundException);
                        expect(e.data).toBe('user');
                        done();
                    }
                });

                it('* missing domain', async (done) => {
                    const __given_mail = 'mail@example.com';
                    const __given_domain = undefined;

                    const __existing_user = new User();
                    __existing_user.username = 'username';
                    __existing_user.mail = 'mail@example.com';

                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);

                    try {
                        await userService.passwordReset_initialize(__given_mail, __given_domain);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten EmptyFieldsException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(EmptyFieldsException);
                        expect(e.data).toEqual(['domain']);
                        done();
                    }
                });
            });

            describe('* change password', () => {
                describe('* successful should return nothing', () => {
                    it('* normal', async (done) => {
                        const __given_mail = 'mail@example.com';
                        const __given_token = 'token';
                        const __given_password = 'password';

                        const __existing_password_reset = new PasswordReset();
                        __existing_password_reset.iat = new Date();
                        __existing_password_reset.used = null;

                        const __existing_user = new User();
                        __existing_user.mail = __given_mail;

                        passwordResetRepositoryMock.findOne.mockReturnValueOnce(__existing_password_reset);
                        userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                        userRepositoryMock.save.mockImplementationOnce(val => val);
                        passwordResetRepositoryMock.update.mockReturnValueOnce(undefined);

                        try {
                            await userService.passwordReset_updatePassword(__given_mail, __given_token, __given_password);
                            done();
                        } catch (e) {
                            console.log(e);
                            done.fail(new Error('I have failed you, Anakin. Should have gotten nothing'));
                        }
                    });

                    it('* mark as used failed', async (done) => {
                        const __given_mail = 'mail@example.com';
                        const __given_token = 'token';
                        const __given_password = 'password';

                        const __existing_password_reset = new PasswordReset();
                        __existing_password_reset.iat = new Date();
                        __existing_password_reset.used = null;

                        const __existing_user = new User();
                        __existing_user.mail = __given_mail;

                        passwordResetRepositoryMock.findOne.mockReturnValueOnce(__existing_password_reset);
                        userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                        userRepositoryMock.save.mockImplementationOnce(val => val);
                        passwordResetRepositoryMock.update.mockReturnValueOnce(Promise.reject());

                        try {
                            await userService.passwordReset_updatePassword(__given_mail, __given_token, __given_password);
                            done();
                        } catch (e) {
                            console.log(e);
                            done.fail(new Error('I have failed you, Anakin. Should have gotten nothing'));
                        }
                    });
                });

                describe('* failure should return error', () => {
                    it('* invalid token', async (done) => {
                        const __given_mail = 'mail@example.com';
                        const __given_token = 'token';
                        const __given_password = 'password';

                        passwordResetRepositoryMock.findOne.mockReturnValueOnce(undefined);

                        try {
                            await userService.passwordReset_updatePassword(__given_mail, __given_token, __given_password);
                            done.fail(new Error('I have failed you, Anakin. Should have gotten InvalidTokenException'));
                        } catch (e) {
                            expect(e).toBeInstanceOf(InvalidTokenException);
                            done();
                        }
                    });

                    it('* user not found', async (done) => {
                        const __given_mail = 'mail@example.com';
                        const __given_token = 'token';
                        const __given_password = 'password';

                        const __existing_password_reset = new PasswordReset();
                        __existing_password_reset.iat = new Date();
                        __existing_password_reset.used = null;

                        passwordResetRepositoryMock.findOne.mockReturnValueOnce(__existing_password_reset);
                        userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                        try {
                            await userService.passwordReset_updatePassword(__given_mail, __given_token, __given_password);
                            done.fail(new Error('I have failed you, Anakin. Should have gotten EntityNotFoundException'));
                        } catch (e) {
                            expect(e).toBeInstanceOf(EntityNotFoundException);
                            expect(e.data).toBe('user');
                            done();
                        }
                    });
                });
            });

            describe('* verify token', () => {
                it('* successful should return true', async () => {
                    const __given_mail = 'mail@example.com';
                    const __given_token = 'token';

                    const __existing_passwordReset = new PasswordReset();
                    __existing_passwordReset.used = null;
                    __existing_passwordReset.oldPassword = null;
                    __existing_passwordReset.iat = new Date();

                    passwordResetRepositoryMock.findOne.mockReturnValueOnce(__existing_passwordReset);

                    const __actual = await userService.passwordReset_tokenVerification(__given_mail, __given_token);
                    expect(__actual).toBeTruthy;
                });

                describe('* failure should return error', () => {
                    it('* password reset not found', async (done) => {
                        const __given_mail = 'mail@example.com';
                        const __given_token = 'token';

                        passwordResetRepositoryMock.findOne.mockReturnValueOnce(undefined);

                        try {
                            await userService.passwordReset_tokenVerification(__given_mail, __given_token);
                            done.fail(new Error('I have failed you, Anakin. Should have gotten InvalidTokenException'));
                        } catch (e) {
                            expect(e).toBeInstanceOf(InvalidTokenException);
                            done();
                        }
                    });

                    it('* new token created', async (done) => {
                        const __given_mail = 'mail@example.com';
                        const __given_token = 'token';

                        const __existing_passwordReset = new PasswordReset();
                        __existing_passwordReset.used = null;
                        __existing_passwordReset.oldPassword = 'invalid';
                        __existing_passwordReset.iat = new Date();

                        passwordResetRepositoryMock.findOne.mockReturnValueOnce(__existing_passwordReset);

                        try {
                            await userService.passwordReset_tokenVerification(__given_mail, __given_token);
                            done.fail(new Error('I have failed you, Anakin. Should have gotten ExpiredTokenException'));
                        } catch (e) {
                            expect(e).toBeInstanceOf(ExpiredTokenException);
                            expect(e.code).toBe('OUTDATED');
                            done();
                        }
                    });

                    it('* token expired', async (done) => {
                        const __given_mail = 'mail@example.com';
                        const __given_token = 'token';

                        const __existing_passwordReset = new PasswordReset();
                        __existing_passwordReset.used = null;
                        __existing_passwordReset.oldPassword = null;
                        __existing_passwordReset.iat = new Date(Date.now() - (50 * 60 * 60 * 1000));

                        passwordResetRepositoryMock.findOne.mockReturnValueOnce(__existing_passwordReset);

                        try {
                            await userService.passwordReset_tokenVerification(__given_mail, __given_token);
                            done.fail(new Error('I have failed you, Anakin. Should have gotten ExpiredTokenException'));
                        } catch (e) {
                            expect(e).toBeInstanceOf(ExpiredTokenException);
                            done();
                        }
                    });

                    it('* token already used', async (done) => {
                        const __given_mail = 'mail@example.com';
                        const __given_token = 'token';

                        const __existing_passwordReset = new PasswordReset();
                        __existing_passwordReset.used = new Date();
                        __existing_passwordReset.oldPassword = null;
                        __existing_passwordReset.iat = new Date();

                        passwordResetRepositoryMock.findOne.mockReturnValueOnce(__existing_passwordReset);

                        try {
                            await userService.passwordReset_tokenVerification(__given_mail, __given_token);
                            done.fail(new Error('I have failed you, Anakin. Should have gotten AlreadyUsedException'));
                        } catch (e) {
                            expect(e).toBeInstanceOf(AlreadyUsedException);
                            done();
                        }
                    });
                });
            });
        });
    });

    describe('* mail change', () => {
        describe('* initialize', () => {
            describe('* successful should return EmailChange entity', () => {
                it('* normal ', async () => {
                    const __given_user = new User();
                    __given_user.id = 'dc70b9ca-8bc3-4d8b-9da8-2b2910931233';
                    const __given_mail = 'changed@example.com';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    const __existing_user = new User();
                    __existing_user.id = __given_user.id;
                    __existing_user.mail = 'current@example.com';

                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined); // email not in use
                    emailChangeRepositoryMock.update.mockReturnThis(); // reset prev changes
                    emailChangeRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(mailerService, 'sendMail').mockReturnValueOnce(Promise.resolve({}));

                    const __expected = new EmailChange();
                    __expected.newMail = __given_mail;
                    __expected.oldMail = __existing_user.mail;
                    __expected.user = __existing_user;

                    const __actual = await userService.emailChange_initialize(__given_user, __given_mail, __given_domain);
                    expect(__actual).toMatchObject(__expected);
                    expect(__actual.token).toMatch(/^.{64}$/);
                });

                it('* even if mail send failed ', async () => {
                    const __given_user = new User();
                    __given_user.id = 'dc70b9ca-8bc3-4d8b-9da8-2b2910931233';
                    const __given_mail = 'changed@example.com';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    const __existing_user = new User();
                    __existing_user.id = __given_user.id;
                    __existing_user.mail = 'current@example.com';

                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined); // email not in use
                    emailChangeRepositoryMock.update.mockReturnThis(); // reset prev changes
                    emailChangeRepositoryMock.save.mockImplementationOnce((val) => val);

                    jest.spyOn(mailerService, 'sendMail').mockReturnValueOnce(Promise.reject({}));

                    const __expected = new EmailChange();
                    __expected.newMail = __given_mail;
                    __expected.oldMail = __existing_user.mail;
                    __expected.user = __existing_user;

                    const __actual = await userService.emailChange_initialize(__given_user, __given_mail, __given_domain);
                    expect(__actual).toMatchObject(__expected);
                    expect(__actual.token).toMatch(/^.{64}$/);
                });
            });

            describe('* failure should return error', () => {
                it('* user not found', async (done) => {
                    const __given_user = new User();
                    __given_user.id = 'dc70b9ca-8bc3-4d8b-9da8-2b2910931233';
                    const __given_mail = 'changed@example.com';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    try {
                        await userService.emailChange_initialize(__given_user, __given_mail, __given_domain);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten a EntityNotFoundException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(EntityNotFoundException);
                        expect(e.data).toBe('user');
                        done();
                    }
                });

                it('* email already in use', async (done) => {
                    const __given_user = new User();
                    __given_user.id = 'dc70b9ca-8bc3-4d8b-9da8-2b2910931233';
                    const __given_mail = 'changed@example.com';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    const __existing_user = new User();
                    __existing_user.id = __given_user.id;
                    __existing_user.mail = 'current@example.com';

                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    userRepositoryMock.findOne.mockReturnValueOnce(new User());

                    try {
                        await userService.emailChange_initialize(__given_user, __given_mail, __given_domain);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten a DuplicateValueException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(DuplicateValueException);
                        expect(e.data).toEqual(['email']);
                        done();
                    }
                });

                it('* email blocked', async (done) => {
                    const __given_user = new User();
                    __given_user.id = 'dc70b9ca-8bc3-4d8b-9da8-2b2910931233';
                    const __given_mail = 'changed@example.com';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    const __existing_user = new User();
                    __existing_user.id = __given_user.id;
                    __existing_user.mail = 'current@example.com';

                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(new EmailChange());

                    try {
                        await userService.emailChange_initialize(__given_user, __given_mail, __given_domain);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten a DuplicateValueException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(DuplicateValueException);
                        expect(e.data).toEqual(['email']);
                        done();
                    }
                });

                it('* domain not provided', async (done) => {
                    const __given_user = new User();
                    __given_user.id = 'dc70b9ca-8bc3-4d8b-9da8-2b2910931233';
                    const __given_mail = 'changed@example.com';
                    const __given_domain = '';

                    const __existing_user = new User();
                    __existing_user.id = __given_user.id;
                    __existing_user.mail = 'current@example.com';

                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    try {
                        await userService.emailChange_initialize(__given_user, __given_mail, __given_domain);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten a EmptyFieldsException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(EmptyFieldsException);
                        expect(e.data).toEqual(['domain']);
                        done();
                    }
                });

                it('reset previous mail changes error', async (done) => {
                    const __given_user = new User();
                    __given_user.id = 'dc70b9ca-8bc3-4d8b-9da8-2b2910931233';
                    const __given_mail = 'changed@example.com';
                    const __given_domain = 'example.com/{{0}}/{{1}}';

                    const __existing_user = new User();
                    __existing_user.id = __given_user.id;
                    __existing_user.mail = 'current@example.com';

                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined); // email not in use
                    emailChangeRepositoryMock.update.mockReturnValueOnce(Promise.reject()); // reset prev changes

                    try {
                        await userService.emailChange_initialize(__given_user, __given_mail, __given_domain);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten a InternalErrorException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(InternalErrorException);
                        done();
                    }
                });
            });
        });

        describe('* execute', () => {
            describe('* successful should return true', () => {
                it('* normal', async () => {
                    const __given_email = 'mail@example.com';
                    const __given_token = 'validToken';

                    const __existing_emailChange = new EmailChange();
                    __existing_emailChange.oldMail = null;
                    __existing_emailChange.newMail = null;
                    __existing_emailChange.used = null;
                    __existing_emailChange.iat = new Date();

                    const __existing_user = new User();
                    __existing_user.mail = 'current@example.com';

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(__existing_emailChange);
                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    userRepositoryMock.save.mockImplementationOnce(val => val);
                    emailChangeRepositoryMock.update.mockReturnValueOnce(undefined);

                    const __actual = await userService.emailChange_updateEmail(__given_email, __given_token);
                    expect(__actual).toBeTruthy();
                });

                it('* even if email change update failed', async () => {
                    const __given_email = 'mail@example.com';
                    const __given_token = 'validToken';

                    const __existing_emailChange = new EmailChange();
                    __existing_emailChange.oldMail = null;
                    __existing_emailChange.newMail = null;
                    __existing_emailChange.used = null;
                    __existing_emailChange.iat = new Date();

                    const __existing_user = new User();
                    __existing_user.mail = 'current@example.com';

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(__existing_emailChange);
                    userRepositoryMock.findOne.mockReturnValueOnce(__existing_user);
                    userRepositoryMock.save.mockImplementationOnce(val => val);
                    emailChangeRepositoryMock.update.mockReturnValueOnce(Promise.reject());

                    const __actual = await userService.emailChange_updateEmail(__given_email, __given_token);
                    expect(__actual).toBeTruthy();
                });
            });

            describe('* failure should return error', () => {
                it('* invalid token (forward error) ', async (done) => {
                    const __given_email = 'mail@example.com';
                    const __given_token = 'validToken';

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    try {
                        await userService.emailChange_updateEmail(__given_email, __given_token);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten a InvalidTokenException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(InvalidTokenException);
                        done();
                    }
                });

                it('user not found', async (done) => {
                    const __given_email = 'mail@example.com';
                    const __given_token = 'validToken';

                    const __existing_emailChange = new EmailChange();
                    __existing_emailChange.oldMail = null;
                    __existing_emailChange.newMail = null;
                    __existing_emailChange.used = null;
                    __existing_emailChange.iat = new Date();

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(__existing_emailChange);
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    try {
                        await userService.emailChange_updateEmail(__given_email, __given_token);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten a EntityNotFoundException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(EntityNotFoundException);
                        expect(e.data).toBe('user');
                        done();
                    }
                });
            });
        });

        describe('* verify token', () => {
            it('* successful should return true', async () => {
                const __given_mail = 'mail@example.com';
                const __given_token = 'token';

                const __existing_emaiChange = new EmailChange();
                __existing_emaiChange.used = null;
                __existing_emaiChange.oldMail = null;
                __existing_emaiChange.newMail = null;
                __existing_emaiChange.iat = new Date();

                emailChangeRepositoryMock.findOne.mockReturnValueOnce(__existing_emaiChange);

                const __actual = await userService.emailChange_tokenVerification(__given_mail, __given_token);
                expect(__actual).toBeTruthy;
            });

            describe('* failure should return error', () => {
                it('* email change not found', async (done) => {
                    const __given_mail = 'mail@example.com';
                    const __given_token = 'token';

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    try {
                        await userService.passwordReset_tokenVerification(__given_mail, __given_token);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten InvalidTokenException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(InvalidTokenException);
                        done();
                    }
                });

                it('* new token created', async (done) => {
                    const __given_mail = 'mail@example.com';
                    const __given_token = 'token';

                    const __existing_emailChange = new EmailChange();
                    __existing_emailChange.used = null;
                    __existing_emailChange.oldMail = 'invalid';
                    __existing_emailChange.newMail = null;
                    __existing_emailChange.iat = new Date();

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(__existing_emailChange);

                    try {
                        await userService.emailChange_tokenVerification(__given_mail, __given_token);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten ExpiredTokenException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(ExpiredTokenException);
                        expect(e.code).toBe('OUTDATED');
                        done();
                    }
                });

                it('* token expired', async (done) => {
                    const __given_mail = 'mail@example.com';
                    const __given_token = 'token';

                    const __existing_emailChange = new EmailChange();
                    __existing_emailChange.used = null;
                    __existing_emailChange.oldMail = null;
                    __existing_emailChange.newMail = null;
                    __existing_emailChange.iat = new Date(Date.now() - (50 * 60 * 60 * 1000));

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(__existing_emailChange);

                    try {
                        await userService.emailChange_tokenVerification(__given_mail, __given_token);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten ExpiredTokenException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(ExpiredTokenException);
                        done();
                    }
                });

                it('* token already used', async (done) => {
                    const __given_mail = 'mail@example.com';
                    const __given_token = 'token';

                    const __existing_emailChange = new EmailChange();
                    __existing_emailChange.used = new Date();
                    __existing_emailChange.oldMail = null;
                    __existing_emailChange.newMail = null;
                    __existing_emailChange.iat = new Date();

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(__existing_emailChange);

                    try {
                        await userService.emailChange_tokenVerification(__given_mail, __given_token);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten AlreadyUsedException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(AlreadyUsedException);
                        done();
                    }
                });
            });
        });

        describe('* resend mail', () => {
            it('successful should return email change entity', async () => {
                const __given_user = new User();
                __given_user.id = 'a33c4639-a7ba-4c22-bb97-07ab4acfeddd';
                const __given_domain = 'domain';

                const __existing_emailChange = new EmailChange();
                __existing_emailChange.newMail = 'new@example.com';
                __existing_emailChange.oldMail = 'old@example.com';
                __existing_emailChange.iat = new Date();
                __existing_emailChange.used = null;

                emailChangeRepositoryMock.findOne.mockReturnValueOnce(new EmailChange());
                jest.spyOn(userService, 'emailChange_initialize').mockReturnValueOnce(Promise.resolve(__existing_emailChange));

                const __actual = await userService.emailChange_resendEmail(__given_user, __given_domain);
                expect(__actual).toBe(__existing_emailChange);
            });

            describe('* should return error if failed', () => {
                it('* no pending mail change', async (done) => {
                    const __given_user = new User();
                    __given_user.id = 'a33c4639-a7ba-4c22-bb97-07ab4acfeddd';
                    const __given_domain = 'domain';

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    try {
                        await userService.emailChange_resendEmail(__given_user, __given_domain);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten InvalidRequestException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(InvalidRequestException);
                        done();
                    }
                });

                it('* email change initialize not possible (forward error)', async (done) => {
                    const __given_user = new User();
                    __given_user.id = 'a33c4639-a7ba-4c22-bb97-07ab4acfeddd';
                    const __given_domain = 'domain';

                    const __existing_emailChange = new EmailChange();
                    __existing_emailChange.newMail = 'new@example.com';
                    __existing_emailChange.oldMail = 'old@example.com';
                    __existing_emailChange.iat = new Date();
                    __existing_emailChange.used = null;

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(__existing_emailChange);
                    userRepositoryMock.findOne.mockReturnValueOnce(new User());
                    userRepositoryMock.findOne.mockReturnValueOnce(new User()); // email in use

                    try {
                        await userService.emailChange_resendEmail(__given_user, __given_domain);
                        done.fail(new Error('I have failed you, Anakin. Should have gotten DuplicateValueException'));
                    } catch (e) {
                        expect(e).toBeInstanceOf(DuplicateValueException);
                        expect(e.data).toEqual(['email']);
                        done();
                    }
                });
            });
        });

        describe('* cancel change', () => {
            it('successful should return void', async () => {
                const __given_user = new User();

                emailChangeRepositoryMock.update.mockReturnValueOnce(Promise.resolve(undefined));

                await userService.emailChange_cancelPendingChanges(__given_user);
            });

            it('* failure should return error (forward error)', async (done) => {
                const __given_user = new User();

                emailChangeRepositoryMock.update.mockReturnValueOnce(Promise.reject(new EntityNotFoundException()));

                try {
                    await userService.emailChange_cancelPendingChanges(__given_user);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an InternalErrorException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(InternalErrorException);
                    done();
                }
            });
        });
    });

    describe('* password change date', () => {
        describe('* successful should return correct date', () => {
            it('* changed by password reset', async () => {
                const __given_user = new User();
                __given_user.id = 'b7eedb11-2dab-47e5-aab6-b16cce2b7f43';
                const __given_password = 'password';

                const __existing_passwordReset = new PasswordReset();
                __existing_passwordReset.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordReset.used = new Date();

                passwordResetRepositoryMock.find.mockReturnValueOnce([__existing_passwordReset]);
                passwordChangeRepositoryMock.find.mockReturnValueOnce(undefined);

                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);

                const __actual = await userService.getLastValidityDateOfPassword(__given_user, __given_password);
                expect(__actual).toEqual(__existing_passwordReset.used);
            });

            it('* changed by password change', async () => {
                const __given_user = new User();
                __given_user.id = 'b7eedb11-2dab-47e5-aab6-b16cce2b7f43';
                const __given_password = 'password';

                const __existing_passwordChange = new PasswordChange();
                __existing_passwordChange.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordChange.iat = new Date();

                passwordResetRepositoryMock.find.mockReturnValueOnce(undefined);
                passwordChangeRepositoryMock.find.mockReturnValueOnce([__existing_passwordChange]);

                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);

                const __actual = await userService.getLastValidityDateOfPassword(__given_user, __given_password);
                expect(__actual).toEqual(__existing_passwordChange.iat);
            });

            it('* changed by both (1 item each, reset more recent)', async () => {
                const __given_user = new User();
                __given_user.id = 'b7eedb11-2dab-47e5-aab6-b16cce2b7f43';
                const __given_password = 'password';

                const __existing_passwordReset = new PasswordReset();
                __existing_passwordReset.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordReset.used = new Date();

                const __existing_passwordChange = new PasswordChange();
                __existing_passwordChange.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordChange.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));

                passwordResetRepositoryMock.find.mockReturnValueOnce([__existing_passwordReset]);
                passwordChangeRepositoryMock.find.mockReturnValueOnce([__existing_passwordChange]);

                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);
                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);

                const __actual = await userService.getLastValidityDateOfPassword(__given_user, __given_password);
                expect(__actual).toEqual(__existing_passwordReset.used);
            });

            it('* changed by both (1 item each, change more recent)', async () => {
                const __given_user = new User();
                __given_user.id = 'b7eedb11-2dab-47e5-aab6-b16cce2b7f43';
                const __given_password = 'password';

                const __existing_passwordReset = new PasswordReset();
                __existing_passwordReset.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordReset.used = new Date(Date.now() - (2 * 60 * 60 * 1000));

                const __existing_passwordChange = new PasswordChange();
                __existing_passwordChange.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordChange.iat = new Date();

                passwordResetRepositoryMock.find.mockReturnValueOnce([__existing_passwordReset]);
                passwordChangeRepositoryMock.find.mockReturnValueOnce([__existing_passwordChange]);

                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);
                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);

                const __actual = await userService.getLastValidityDateOfPassword(__given_user, __given_password);
                expect(__actual).toEqual(__existing_passwordChange.iat);
            });

            it('* changed by both (1 item each, reset password not matching)', async () => {
                const __given_user = new User();
                __given_user.id = 'b7eedb11-2dab-47e5-aab6-b16cce2b7f43';
                const __given_password = 'password';

                const __existing_passwordReset = new PasswordReset();
                __existing_passwordReset.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordReset.used = new Date();

                const __existing_passwordChange = new PasswordChange();
                __existing_passwordChange.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordChange.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));

                passwordResetRepositoryMock.find.mockReturnValueOnce([__existing_passwordReset]);
                passwordChangeRepositoryMock.find.mockReturnValueOnce([__existing_passwordChange]);

                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(false);
                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);

                const __actual = await userService.getLastValidityDateOfPassword(__given_user, __given_password);
                expect(__actual).toEqual(__existing_passwordChange.iat);
            });

            it('* changed by both (1 item each, change password not matching)', async () => {
                const __given_user = new User();
                __given_user.id = 'b7eedb11-2dab-47e5-aab6-b16cce2b7f43';
                const __given_password = 'password';

                const __existing_passwordReset = new PasswordReset();
                __existing_passwordReset.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordReset.used = new Date(Date.now() - (2 * 60 * 60 * 1000));

                const __existing_passwordChange = new PasswordChange();
                __existing_passwordChange.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordChange.iat = new Date();

                passwordResetRepositoryMock.find.mockReturnValueOnce([__existing_passwordReset]);
                passwordChangeRepositoryMock.find.mockReturnValueOnce([__existing_passwordChange]);

                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);
                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(false);

                const __actual = await userService.getLastValidityDateOfPassword(__given_user, __given_password);
                expect(__actual).toEqual(__existing_passwordReset.used);
            });

            it('* changed by both (2 items each, first reset more recent)', async () => {
                const __given_user = new User();
                __given_user.id = 'b7eedb11-2dab-47e5-aab6-b16cce2b7f43';
                const __given_password = 'password';

                const __existing_passwordReset_1 = new PasswordReset();
                __existing_passwordReset_1.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordReset_1.used = new Date();

                const __existing_passwordReset_2 = new PasswordReset();
                __existing_passwordReset_2.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordReset_2.used = new Date(Date.now() - (2 * 60 * 60 * 1000));

                const __existing_passwordChange_1 = new PasswordChange();
                __existing_passwordChange_1.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordChange_1.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));

                const __existing_passwordChange_2 = new PasswordChange();
                __existing_passwordChange_2.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordChange_2.iat = new Date(Date.now() - (3 * 60 * 60 * 1000));

                passwordResetRepositoryMock.find.mockReturnValueOnce([__existing_passwordReset_1, __existing_passwordReset_2]);
                passwordChangeRepositoryMock.find.mockReturnValueOnce([__existing_passwordChange_1, __existing_passwordChange_2]);

                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);
                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);
                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);
                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);

                const __actual = await userService.getLastValidityDateOfPassword(__given_user, __given_password);
                expect(__actual).toEqual(__existing_passwordReset_1.used);
            });

            it('* changed by both (2 item each, first change more recent)', async () => {
                const __given_user = new User();
                __given_user.id = 'b7eedb11-2dab-47e5-aab6-b16cce2b7f43';
                const __given_password = 'password';

                const __existing_passwordReset_1 = new PasswordReset();
                __existing_passwordReset_1.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordReset_1.used = new Date(Date.now() - (1 * 60 * 60 * 1000));

                const __existing_passwordReset_2 = new PasswordReset();
                __existing_passwordReset_2.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordReset_2.used = new Date(Date.now() - (2 * 60 * 60 * 1000));

                const __existing_passwordChange_1 = new PasswordChange();
                __existing_passwordChange_1.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordChange_1.iat = new Date();

                const __existing_passwordChange_2 = new PasswordChange();
                __existing_passwordChange_2.oldPassword = 'oldPassword (actually a hash)';
                __existing_passwordChange_2.iat = new Date(Date.now() - (3 * 60 * 60 * 1000));

                passwordResetRepositoryMock.find.mockReturnValueOnce([__existing_passwordReset_1, __existing_passwordReset_2]);
                passwordChangeRepositoryMock.find.mockReturnValueOnce([__existing_passwordChange_1, __existing_passwordChange_2]);

                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);
                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);
                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);
                jest.spyOn(bcrypt, 'compareSync').mockReturnValueOnce(true);

                const __actual = await userService.getLastValidityDateOfPassword(__given_user, __given_password);
                expect(__actual).toEqual(__existing_passwordChange_1.iat);
            });
        });
    });

    // describe('* filter active EmailChange(s)', () => {
    //     it('by date (1 active, 1 expired)', async () => {
    //         let mailChangeToRemove = new EmailChange();
    //         mailChangeToRemove.iat = new Date(Date.now() - (30 * 60 * 60 * 1000));
    //         mailChangeToRemove.used = null;
    //
    //         let mailChangeToKeep = new EmailChange();
    //         mailChangeToKeep.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
    //         mailChangeToKeep.used = null;
    //
    //         const emailChange = [mailChangeToRemove, mailChangeToKeep];
    //
    //         const actual = await userService.retrieveActiveMailChanges(emailChange);
    //         expect(actual).toEqual([mailChangeToKeep]);
    //     });
    //
    //     it('used state (1 used, 1 unused)', async () => {
    //         let mailChangeToRemove = new EmailChange();
    //         mailChangeToRemove.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
    //         mailChangeToRemove.used = new Date();
    //
    //         let mailChangeToKeep = new EmailChange();
    //         mailChangeToKeep.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
    //         mailChangeToKeep.used = null;
    //
    //         const emailChange = [mailChangeToRemove, mailChangeToKeep];
    //
    //         const actual = await userService.retrieveActiveMailChanges(emailChange);
    //         expect(actual).toEqual([mailChangeToKeep]);
    //     });
    // });
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
