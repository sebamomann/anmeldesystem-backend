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
import {EmptyFieldsException} from '../../exceptions/EmptyFieldsException';
import {EntityGoneException} from '../../exceptions/EntityGoneException';
import {InvalidTokenException} from '../../exceptions/InvalidTokenException';
import {AlreadyUsedException} from '../../exceptions/AlreadyUsedException';
import {ExpiredTokenException} from '../../exceptions/ExpiredTokenException';
import {InvalidRequestException} from '../../exceptions/InvalidRequestException';
import {InternalErrorException} from '../../exceptions/InternalErrorException';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
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

    describe('* UTIL - find user', () => {
        describe('* by id', () => {
            it('should return entity if found', async () => {
                const idToSatisfyParameter = '1';
                const user = new User();

                userRepositoryMock.findOne.mockReturnValue(user);
                expect(await userService.findById(idToSatisfyParameter)).toEqual(user);
            });

            it('should return error if not found', async () => {
                const idToSatisfyParameter = '1';
                const user = undefined;

                userRepositoryMock.findOne.mockReturnValue(user);
                userService.findById(idToSatisfyParameter)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toBe('user');
                    });
            });
        });

        describe('* by email', () => {
            it('should return entity if found', async () => {
                const emailToSatisfyParameter = 'mail@example.com';
                const user = new User();

                userRepositoryMock.findOne.mockReturnValue(user);
                expect(await userService.findByEmail(emailToSatisfyParameter)).toEqual(user);
            });

            it('should return error if not found', async () => {
                const emailToSatisfyParameter = 'mail@example.com';
                const user = undefined;

                userRepositoryMock.findOne.mockReturnValue(user);
                userService.findByEmail(emailToSatisfyParameter)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toBe('user');
                    });
            });
        });

        describe('* by username', () => {
            it('should return entity if found', async () => {
                const usernameToSatisfyParameter = 'username';
                const user = new User();

                userRepositoryMock.findOne.mockReturnValue(user);
                expect(await userService.findByUsername(usernameToSatisfyParameter)).toEqual(user);
            });

            it('should return error if not found', async () => {
                const usernameToSatisfyParameter = 'username';
                const user = undefined;

                userRepositoryMock.findOne.mockReturnValue(user);
                userService.findByUsername(usernameToSatisfyParameter)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toBe('user');
                    });
            });
        });

        describe('* by email or username', () => {
            it('should return entity if found', async () => {
                const emailOrUsernameToSatisfyParameter = 'username';
                const user = new User();

                userRepositoryMock.findOne.mockReturnValue(user);
                expect(await userService.findByEmailOrUsername(emailOrUsernameToSatisfyParameter)).toEqual(user);
            });

            it('should return error if not found', async () => {
                const emailOrUsernameToSatisfyParameter = 'username';
                const user = undefined;

                userRepositoryMock.findOne.mockReturnValue(user);
                userService.findByEmailOrUsername(emailOrUsernameToSatisfyParameter)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toBe('user');
                    });
            });
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
        describe('should return registered user if successful', () => {
            it('successful', async () => {
                let user = new User();
                user.username = 'username';
                user.mail = 'mail@example.com';
                user.password = 'password';
                const domainToSatisfyParameter = 'example.de';

                userRepositoryMock.findOne.mockReturnValueOnce(undefined);
                userRepositoryMock.findOne.mockReturnValueOnce(undefined);
                userRepositoryMock.save.mockReturnValueOnce(user);
                jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                const actual = await userService.register(user, domainToSatisfyParameter);

                user = userMapper.basic(userService, user);
                expect(actual).toEqual(user);
            });

            it('successful - even if send mail failed', async () => {
                let user = new User();
                user.username = 'username';
                user.mail = 'mail@example.com';
                user.password = 'password';
                const domainToSatisfyParameter = 'example.de';

                userRepositoryMock.findOne.mockReturnValueOnce(undefined);
                userRepositoryMock.findOne.mockReturnValueOnce(undefined);
                userRepositoryMock.save.mockReturnValueOnce(user);
                jest.spyOn(mailerService, 'sendMail').mockReturnValueOnce(Promise.reject());

                const actual = await userService.register(user, domainToSatisfyParameter);

                user = userMapper.basic(userService, user);
                expect(actual).toEqual(user);
            });
        });

        describe('* should return error if failed', () => {
            describe('* values already in use', () => {
                it('username', async () => {
                    const user = new User();
                    user.username = 'username';
                    user.mail = 'mail@example.com';
                    user.password = 'password';
                    const domainToSatisfyParameter = 'example.de';

                    userRepositoryMock.findOne.mockReturnValueOnce(new User());
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    userRepositoryMock.save.mockReturnValueOnce(user);
                    jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                    userService
                        .register(user, domainToSatisfyParameter)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have gotten an DuplicateValuesException (username)');
                        })
                        .catch((e) => {
                            expect(e).toBeInstanceOf(DuplicateValueException);
                            expect(e.data).toEqual(['username']);
                        });
                });

                it('email', async () => {
                    const user = new User();
                    user.username = 'username';
                    user.mail = 'mail@example.com';
                    user.password = 'password';
                    const domainToSatisfyParameter = 'example.de';

                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    userRepositoryMock.findOne.mockReturnValueOnce(new User());
                    userRepositoryMock.save.mockReturnValueOnce(user);
                    jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                    userService
                        .register(user, domainToSatisfyParameter)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have gotten an DuplicateValuesException (username)');
                        })
                        .catch((e) => {
                            expect(e).toBeInstanceOf(DuplicateValueException);
                            expect(e.data).toEqual(['email']);
                        });
                });

                it('username and email', async () => {
                    const user = new User();
                    user.username = 'username';
                    user.mail = 'mail@example.com';
                    user.password = 'password';
                    const domainToSatisfyParameter = 'example.de';

                    userRepositoryMock.findOne.mockReturnValueOnce(new User());
                    userRepositoryMock.findOne.mockReturnValueOnce(new User());
                    userRepositoryMock.save.mockReturnValueOnce(user);
                    jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                    userService
                        .register(user, domainToSatisfyParameter)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have gotten an DuplicateValuesException (username)');
                        })
                        .catch((e) => {
                            expect(e).toBeInstanceOf(DuplicateValueException);
                            expect(e.data).toEqual(['username', 'email']);
                        });
                });
            });
        });
    });

    describe('* update user', () => {
        describe('* should return updated user if successful', () => {
            it('update name', async () => {
                const valuesToUpdate = {name: 'updatedName'};
                const userFromJwt = new User();
                userFromJwt.id = '1';

                const currentUser = new User();
                currentUser.name = 'currentName';
                userRepositoryMock.findOne.mockReturnValueOnce(currentUser);

                userRepositoryMock.save.mockImplementation((val) => val);

                const actual = await userService.update(valuesToUpdate, userFromJwt);
                expect(actual.name).toEqual(valuesToUpdate.name);
            });

            it('update email (should return updated user with EmailChange entity)', async () => {
                const valuesToUpdate = {
                    mail: 'changed@example.com',
                    domain: 'domain'
                };
                const userFromJwt = new User();
                userFromJwt.id = '1';

                const currentUser = new User();
                currentUser.mail = 'current@example.com';
                userRepositoryMock.findOne.mockReturnValueOnce(currentUser);
                userRepositoryMock.findOne.mockReturnValueOnce(new User());
                userRepositoryMock.findOne.mockReturnValueOnce(undefined);
                emailChangeRepositoryMock.query.mockReturnValueOnce(undefined);
                emailChangeRepositoryMock.save.mockReturnValueOnce(undefined);
                jest.spyOn(mailerService, 'sendMail').mockImplementationOnce((): Promise<any> => Promise.resolve({}));
                userRepositoryMock.save.mockImplementation((val) => {
                    const emailChange = new EmailChange();
                    emailChange.iat = new Date();
                    emailChange.oldMail = currentUser.mail;
                    emailChange.used = null;

                    val.emailChange = [emailChange];
                    return val;
                });

                const actual = await userService.update(valuesToUpdate, userFromJwt);
                expect(actual.mail).toEqual(currentUser.mail);
                expect(actual.emailChange).toHaveLength(1);
            });

            it('update password', async () => {
                const valuesToUpdate = {password: 'newPassword'};

                const userFromJwt = new User();
                userFromJwt.id = '1';

                let currentUser = new User();
                currentUser.password = 'currentPassword';

                userRepositoryMock.findOne.mockReturnValueOnce(currentUser);
                passwordChangeRepositoryMock.save.mockImplementation((val) => val);
                userRepositoryMock.save.mockImplementation((val) => val);

                const actual = await userService.update(valuesToUpdate, userFromJwt);

                currentUser = userMapper.basic(userService, currentUser);
                expect(actual).toEqual(currentUser);
            });
        });

        describe('* should return error if failed', () => {
            it('user not found', async () => {
                const valuesToUpdate = {
                    mail: 'changed@example.com',
                    domain: 'domain'
                };
                const userFromJwt = new User();
                userFromJwt.id = '1';

                const currentUser = new User();
                currentUser.name = 'currentName';
                userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                userService
                    .update(valuesToUpdate, userFromJwt)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have returned EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                    });
            });

            describe('handleEmailChange error (just forward error)', () => {
                it('Error', async () => {
                    const valuesToUpdate = {
                        mail: 'changed@example.com',
                        domain: 'domain'
                    };
                    const userFromJwt = new User();
                    userFromJwt.id = '1';

                    const currentUser = new User();
                    currentUser.name = 'currentName';
                    userRepositoryMock.findOne.mockReturnValueOnce(currentUser);

                    jest.spyOn(userService, 'handleEmailChange').mockReturnValueOnce(Promise.reject(new Error()));

                    userService
                        .update(valuesToUpdate, userFromJwt)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned Error');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(Error);
                        });
                });

                it('DuplicateValueException', async () => {
                    const valuesToUpdate = {
                        mail: 'changed@example.com',
                        domain: 'domain'
                    };
                    const userFromJwt = new User();
                    userFromJwt.id = '1';

                    const currentUser = new User();
                    currentUser.mail = 'current@example.com';
                    userRepositoryMock.findOne.mockReturnValueOnce(currentUser);

                    jest.spyOn(userService, 'handleEmailChange').mockReturnValueOnce(Promise.reject(new DuplicateValueException()));

                    userService
                        .update(valuesToUpdate, userFromJwt)
                        .then((res) => {
                            throw new Error('I have failed you, Anakin. Should have returned DuplicateValueException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(DuplicateValueException);
                        });
                });
            });
        });
    });

    describe('* activate user', () => {
        it('should return nothing if successful', async (done) => {
            const user = new User();
            user.mail = 'mail@example.com';
            user.username = 'username';
            user.activated = false;
            user.iat = new Date();
            const token = crypto
                .createHmac('sha256', user.mail + process.env.SALT_MAIL + user.username + user.iat)
                .digest('hex');

            jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.resolve(user));

            userService
                .activate(user.mail, token)
                .then(() => {
                    done();
                })
                .catch(() => {
                    throw new Error('I have failed you, Anakin. Should have been all fine (void fnc)');
                });
        });

        describe('should return error if failed', () => {
            it('entity not found', async () => {
                const user = new User();
                user.mail = 'mail@example.com';
                const token = crypto
                    .createHmac('sha256', user.mail + process.env.SALT_MAIL + user.username + user.iat)
                    .digest('hex');

                jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.reject());

                userService
                    .activate(user.mail, token)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have returned EntityGoneException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityGoneException);
                    });
            });

            it('token invalid', async () => {
                const user = new User();
                user.mail = 'mail@example.com';
                user.username = 'username';
                user.activated = false;
                user.iat = new Date();
                const token = 'invalidToken';

                jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.resolve(user));

                userService
                    .activate(user.mail, token)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have returned EntityGoneException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(InvalidTokenException);
                    });
            });

            it('user already activated', async () => {
                const user = new User();
                user.mail = 'mail@example.com';
                user.username = 'username';
                user.activated = true;
                user.iat = new Date();
                const token = crypto
                    .createHmac('sha256', user.mail + process.env.SALT_MAIL + user.username + user.iat)
                    .digest('hex');

                jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.resolve(user));

                userService
                    .activate(user.mail, token)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have returned EntityGoneException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(AlreadyUsedException);
                    });
            });
        });
    });

    describe('* password reset', () => {
        describe('* initialization', () => {
            it('should return correct URL if successful', async (done) => {
                const mail = 'mail@example.de';
                const domain = 'domain';

                const user = new User();

                jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.resolve(user));
                passwordResetRepositoryMock.update.mockReturnValueOnce(undefined);
                passwordResetRepositoryMock.save.mockReturnValueOnce(undefined);
                jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

                userService
                    .resetPasswordInitialization(mail, domain)
                    .then((res) => {
                        const regex = new RegExp('https:\/\/' + domain + '\/' + mail + '\/.{64}', 'g');
                        expect(res).toMatch(regex);
                        done();
                    })
                    .catch(() => {
                        throw new Error('I have failed you, Anakin. Should have returned correct url');
                    });
            });

            it('should return correct URL if successful, even if mail send failed', async (done) => {
                const mail = 'mail@example.de';
                const domain = 'domain';

                const user = new User();

                jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.resolve(user));
                passwordResetRepositoryMock.update.mockReturnValueOnce(undefined);
                passwordResetRepositoryMock.save.mockReturnValueOnce(undefined);
                jest.spyOn(mailerService, 'sendMail').mockReturnValueOnce(Promise.reject());

                userService
                    .resetPasswordInitialization(mail, domain)
                    .then((res) => {
                        const regex = new RegExp('https:\/\/' + domain + '\/' + mail + '\/.{64}', 'g');
                        expect(res).toMatch(regex);
                        done();
                    })
                    .catch(() => {
                        throw new Error('I have failed you, Anakin. Should have returned correct url');
                    });
            });

            describe('should return error if failed', () => {
                it('entity not found', async () => {
                    const mail = 'mail@example.de';
                    const domain = 'domain';

                    jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.reject(new EntityNotFoundException()));

                    userService
                        .resetPasswordInitialization(mail, domain)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityGoneException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                        });
                });

                it('domain missing', async () => {
                    const mail = 'mail@example.de';
                    const domain = undefined;

                    jest.spyOn(userService, 'findByEmail').mockReturnValueOnce(Promise.resolve(new User()));

                    userService
                        .resetPasswordInitialization(mail, domain)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityGoneException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EmptyFieldsException);
                            expect(err.data).toEqual(['domain']);
                        });
                });

            });
        });

        describe('* change password', () => {
            it('should return nothing if successful', async (done) => {
                const mail = 'mail@example.com';
                const token = 'token';
                const password = 'password';

                jest.spyOn(userService, 'resetPasswordTokenVerification').mockReturnValueOnce(Promise.resolve(true));
                jest.spyOn(userService, 'findByEmail').mockReturnValueOnce(Promise.resolve(new User()));
                userRepositoryMock.save.mockReturnValueOnce(undefined);
                passwordResetRepositoryMock.save.mockReturnValueOnce(undefined);

                userService
                    .updatePassword(mail, token, password)
                    .then(() => {
                        done();
                    })
                    .catch(() => {
                        throw new Error('I have failed you, Anakin. Should have returned void');
                    });
            });

            it('should return nothing if successful, even if update of PasswordReset entity failed', async (done) => {
                const mail = 'mail@example.com';
                const token = 'token';
                const password = 'password';

                jest.spyOn(userService, 'resetPasswordTokenVerification').mockReturnValueOnce(Promise.resolve(true));
                jest.spyOn(userService, 'findByEmail').mockReturnValueOnce(Promise.resolve(new User()));
                userRepositoryMock.save.mockReturnValueOnce(new User());
                passwordResetRepositoryMock.update.mockReturnValueOnce(Promise.reject());

                userService
                    .updatePassword(mail, token, password)
                    .then(() => {
                        done();
                    })
                    .catch((err) => {
                        throw new Error('I have failed you, Anakin. Should have returned void');
                    });
            });

            describe('should return error if failed', () => {
                it('user not found', async () => {
                    const mail = 'mail@example.com';
                    const token = 'token';
                    const password = 'password';

                    jest.spyOn(userService, 'resetPasswordTokenVerification').mockReturnValueOnce(Promise.resolve(true));
                    jest.spyOn(userService, 'findByEmail').mockReturnValueOnce(Promise.reject(new EntityNotFoundException()));

                    userService
                        .updatePassword(mail, token, password)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityNotFoundException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                        });
                });
                describe('token validation error (just forward thrown error)', () => {
                    it('Error', async () => {
                        const mail = 'mail@example.com';
                        const token = 'token';
                        const password = 'password';

                        jest.spyOn(userService, 'resetPasswordTokenVerification').mockReturnValueOnce(Promise.reject(new Error()));

                        userService
                            .updatePassword(mail, token, password)
                            .then(() => {
                                throw new Error('I have failed you, Anakin. Should have returned Error');
                            })
                            .catch((err) => {
                                expect(err).toBeInstanceOf(Error);
                            });
                    });

                    it('InvalidTokenException', async () => {
                        const mail = 'mail@example.com';
                        const token = 'token';
                        const password = 'password';

                        jest.spyOn(userService, 'resetPasswordTokenVerification').mockReturnValueOnce(Promise.reject(new InvalidTokenException()));

                        userService
                            .updatePassword(mail, token, password)
                            .then(() => {
                                throw new Error('I have failed you, Anakin. Should have returned InvalidTokenException');
                            })
                            .catch((err) => {
                                expect(err).toBeInstanceOf(InvalidTokenException);
                            });
                    });
                });
            });
        });

        describe('* verify token', () => {
            it('should return true if successful', async (done) => {
                const mail = 'mail@example.com';
                const token = 'token';

                const passwordReset = new PasswordReset();
                passwordReset.used = null;
                passwordReset.oldPassword = null;
                passwordReset.iat = new Date();
                passwordResetRepositoryMock.findOne.mockReturnValueOnce(passwordReset);

                userService
                    .resetPasswordTokenVerification(mail, token)
                    .then((res) => {
                        expect(res).toBe(true);
                        done();
                    })
                    .catch(() => {
                        throw new Error('I have failed you, Anakin. Should have returned true');
                    });
            });

            describe('should return error if not valid', () => {
                it('PasswordReset entity not found', async () => {
                    const mail = 'mail@example.com';
                    const token = 'token';

                    passwordResetRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    userService
                        .resetPasswordTokenVerification(mail, token)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned InvalidTokenException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(InvalidTokenException);
                        });
                });

                it('token replaced', async () => {
                    const mail = 'mail@example.com';
                    const token = 'token';

                    const passwordReset = new PasswordReset();
                    passwordReset.oldPassword = 'invalid';
                    passwordReset.iat = new Date();
                    passwordResetRepositoryMock.findOne.mockReturnValueOnce(passwordReset);

                    userService
                        .resetPasswordTokenVerification(mail, token)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned ExpiredTokenException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(ExpiredTokenException);
                            expect(err.code).toBe('OUTDATED');
                        });
                });

                it('token already used', async () => {
                    const mail = 'mail@example.com';
                    const token = 'token';

                    const passwordReset = new PasswordReset();
                    passwordReset.oldPassword = 'thisismyoldpassword (should actually be hashed)';
                    passwordReset.used = new Date();
                    passwordReset.iat = new Date();
                    passwordResetRepositoryMock.findOne.mockReturnValueOnce(passwordReset);

                    userService
                        .resetPasswordTokenVerification(mail, token)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned ExpiredTokenException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(AlreadyUsedException);
                        });
                });

                it('token expired', async () => {
                    const mail = 'mail@example.com';
                    const token = 'token';

                    const passwordReset = new PasswordReset();
                    passwordReset.oldPassword = 'thisismyoldpassword (should actually be hashed)';
                    passwordReset.used = new Date();
                    passwordReset.iat = new Date(Date.now() - (30 * 60 * 60 * 1000));
                    passwordResetRepositoryMock.findOne.mockReturnValueOnce(passwordReset);

                    userService
                        .resetPasswordTokenVerification(mail, token)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned ExpiredTokenException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(ExpiredTokenException);
                        });
                });
            });
        });
    });

    describe('* mail change', () => {
        describe('* execute', () => {
            it('returns void if successful', async (done) => {
                const mail = 'mail@example.com';
                const token = 'validToken';

                jest.spyOn(userService, 'mailChangeTokenVerification').mockReturnValueOnce(Promise.resolve(new EmailChange()));
                jest.spyOn(userService, 'findByEmail').mockReturnValueOnce(Promise.resolve(new User()));
                userRepositoryMock.save.mockReturnValueOnce(undefined);
                emailChangeRepositoryMock.update.mockReturnValueOnce(undefined);

                await userService
                    .mailChange(mail, token)
                    .then(() => {
                        done();
                    })
                    .catch(() => {
                        throw new Error('I have failed you, Anakin. Should have returned nothing ');
                    });
            });

            it('returns void if successful, even if updateEmailChangeEntity fails', async (done) => {
                const mail = 'mail@example.com';
                const token = 'validToken';

                jest.spyOn(userService, 'mailChangeTokenVerification').mockReturnValueOnce(Promise.resolve(new EmailChange()));
                jest.spyOn(userService, 'findByEmail').mockReturnValueOnce(Promise.resolve(new User()));
                userRepositoryMock.save.mockReturnValueOnce(new User());
                emailChangeRepositoryMock.update.mockReturnValueOnce(Promise.reject());

                await userService
                    .mailChange(mail, token)
                    .then(() => {
                        done();
                    })
                    .catch(() => {
                        throw new Error('I have failed you, Anakin. Should have returned nothing ');
                    });
            });

            describe('should return error if failed', () => {
                it('user not found', async () => {
                    const mail = 'mail@example.com';
                    const token = 'validToken';

                    jest.spyOn(userService, 'mailChangeTokenVerification').mockReturnValueOnce(Promise.resolve(new EmailChange()));
                    jest.spyOn(userService, 'findByEmail').mockReturnValueOnce(Promise.reject(new EntityNotFoundException()));

                    userService
                        .mailChange(mail, token)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned EntityNotFoundException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                        });
                });

                describe('token validation error (just forward thrown error)', () => {
                    it('Error', async () => {
                        const mail = 'mail@example.com';
                        const token = 'validToken';

                        jest.spyOn(userService, 'mailChangeTokenVerification').mockReturnValueOnce(Promise.resolve(new EmailChange()));
                        jest.spyOn(userService, 'findByEmail').mockReturnValueOnce(Promise.reject(new Error()));

                        userService
                            .mailChange(mail, token)
                            .then(() => {
                                throw new Error('I have failed you, Anakin. Should have returned Error');
                            })
                            .catch((err) => {
                                expect(err).toBeInstanceOf(Error);
                            });
                    });

                    it('InvalidTokenException', async () => {
                        const mail = 'mail@example.com';
                        const token = 'validToken';

                        jest.spyOn(userService, 'mailChangeTokenVerification').mockReturnValueOnce(Promise.resolve(new EmailChange()));
                        jest.spyOn(userService, 'findByEmail').mockReturnValueOnce(Promise.reject(new InvalidTokenException()));

                        userService
                            .mailChange(mail, token)
                            .then(() => {
                                throw new Error('I have failed you, Anakin. Should have returned InvalidTokenException');
                            })
                            .catch((err) => {
                                expect(err).toBeInstanceOf(InvalidTokenException);
                            });
                    });
                });
            });
        });

        describe('* verify token', () => {
            it('should return true if successful', async (done) => {
                const mail = 'mail@example.com';
                const token = 'token';

                const emailChange = new EmailChange();
                emailChange.used = null;
                emailChange.oldMail = null;
                emailChange.iat = new Date();
                emailChangeRepositoryMock.findOne.mockReturnValueOnce(emailChange);

                userService
                    .mailChangeTokenVerification(mail, token)
                    .then((res) => {
                        expect(res).toBe(emailChange);
                        done();
                    })
                    .catch((err) => {

                        console.log(err);
                        throw new Error('I have failed you, Anakin. Should have returned passwordReset enti');
                    });
            });

            describe('should return error if not valid', () => {
                it('EmailChange entity not found', async () => {
                    const mail = 'mail@example.com';
                    const token = 'token';

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    userService
                        .mailChangeTokenVerification(mail, token)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned InvalidTokenException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(InvalidTokenException);
                        });
                });

                it('token replaced', async () => {
                    const mail = 'mail@example.com';
                    const token = 'token';

                    const emailChange = new EmailChange();
                    emailChange.oldMail = 'invalid';
                    emailChange.iat = new Date();
                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(emailChange);

                    userService
                        .mailChangeTokenVerification(mail, token)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned ExpiredTokenException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(ExpiredTokenException);
                            expect(err.code).toBe('OUTDATED');
                        });
                });

                it('token already used', async () => {
                    const mail = 'mail@example.com';
                    const token = 'token';

                    const emailChange = new EmailChange();
                    emailChange.oldMail = 'oldmail@example.com';
                    emailChange.used = new Date();
                    emailChange.iat = new Date();
                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(emailChange);

                    userService
                        .mailChangeTokenVerification(mail, token)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned ExpiredTokenException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(AlreadyUsedException);
                        });
                });

                it('token expired', async () => {
                    const mail = 'mail@example.com';
                    const token = 'token';

                    const emailChange = new EmailChange();
                    emailChange.oldMail = 'oldmail@example.com';
                    emailChange.used = new Date();
                    emailChange.iat = new Date(Date.now() - (30 * 60 * 60 * 1000));
                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(emailChange);

                    userService
                        .mailChangeTokenVerification(mail, token)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned ExpiredTokenException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(ExpiredTokenException);
                        });
                });
            });
        });

        describe('* resend mail', () => {
            it('should return EmailChange entity if successful', async (done) => {
                const user = new User();
                const domain = 'domain';

                emailChangeRepositoryMock.findOne.mockReturnValueOnce(new EmailChange());
                jest.spyOn(userService, 'handleEmailChange').mockReturnValueOnce(Promise.resolve(new EmailChange()));

                await userService
                    .mailChangeResendMail(user, domain)
                    .then((res) => {
                        expect(res).toBeInstanceOf(EmailChange);
                        done();
                    })
                    .catch((err) => {
                        throw new Error('I have failed you, Anakin. Should have returned nothing');
                    });
            });

            describe('* should return error if failed', () => {
                it('no active mail change happening atm', async () => {
                    const user = new User();
                    const domain = 'domain';

                    emailChangeRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    await userService
                        .mailChangeResendMail(user, domain)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have returned InvalidRequestException');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(InvalidRequestException);
                        });
                });

                describe('* handleEmailChange returns error (just forward thrown error)', () => {
                    it('Error', async () => {
                        const user = new User();
                        const domain = 'domain';

                        emailChangeRepositoryMock.findOne.mockReturnValueOnce(new EmailChange());
                        jest.spyOn(userService, 'handleEmailChange').mockReturnValueOnce(Promise.reject(new Error()));

                        await userService
                            .mailChangeResendMail(user, domain)
                            .then(() => {
                                throw new Error('I have failed you, Anakin. Should have returned InvalidRequestException');
                            })
                            .catch((err) => {
                                expect(err).toBeInstanceOf(Error);
                            });
                    });

                    it('DuplicateValueException', async () => {
                        const user = new User();
                        const domain = 'domain';

                        emailChangeRepositoryMock.findOne.mockReturnValueOnce(new EmailChange());
                        jest.spyOn(userService, 'handleEmailChange').mockReturnValueOnce(Promise.reject(new DuplicateValueException()));

                        await userService
                            .mailChangeResendMail(user, domain)
                            .then(() => {
                                throw new Error('I have failed you, Anakin. Should have returned DuplicateValueException');
                            })
                            .catch((err) => {
                                expect(err).toBeInstanceOf(DuplicateValueException);
                            });
                    });
                });
            });
        });

        describe('* cancel change', () => {
            it('should return void if successful', async (done) => {
                const user = new User();

                emailChangeRepositoryMock.update.mockReturnValueOnce(Promise.resolve(undefined));

                await userService
                    .mailChangeDeactivateToken(user)
                    .then(() => {
                        done();
                    })
                    .catch(() => {
                        throw new Error('I have failed you, Anakin. Should have returned nothing');
                    });
            });

            describe('should return error if failed', () => {
                describe('* resetPreviousMailChanges returns error (just forward thrown error)', () => {
                    it('InternalErrorException', async () => {
                        const user = new User();

                        emailChangeRepositoryMock.update.mockReturnValueOnce(Promise.reject());

                        await userService
                            .mailChangeDeactivateToken(user)
                            .then(() => {
                                throw new Error('I have failed you, Anakin. Should have returned InternalErrorException');
                            })
                            .catch((err) => {
                                expect(err).toBeInstanceOf(InternalErrorException);
                            });
                    });
                });
            });
        });

        describe('* handle mail change', () => {
            describe('* should return EmailChange entity', () => {
                it('if successful', async (done) => {
                    const userFromJwt = new User();
                    userFromJwt.id = '1';

                    const valuesToUpdate = {
                        mail: 'changed@example.com',
                        domain: 'domain'
                    };

                    const currentUser = new User();
                    currentUser.id = '1';
                    currentUser.mail = 'current@example.com';
                    userRepositoryMock.findOne.mockReturnValueOnce(currentUser);

                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    emailChangeRepositoryMock.update.mockReturnThis();
                    emailChangeRepositoryMock.save.mockImplementationOnce((val) => val);
                    jest.spyOn(mailerService, 'sendMail').mockReturnValueOnce(Promise.resolve({}));

                    userService
                        .handleEmailChange(userFromJwt, valuesToUpdate)
                        .then((res) => {
                            expect(res.newMail).toEqual(valuesToUpdate.mail);
                            expect(res.oldMail).toEqual(currentUser.mail);
                            expect(res.token).toMatch(/^.{64}$/);
                            expect(res.user).toBe(currentUser);
                            done();
                        })
                        .catch((err) => {
                            console.log(err);
                            throw new Error('I have failed you, Anakin. Should have returned EmailChange entity');
                        });
                });

                it('if successful - but mail send failed', async (done) => {
                    const userFromJwt = new User();
                    userFromJwt.id = '1';

                    const valuesToUpdate = {
                        mail: 'changed@example.com',
                        domain: 'domain'
                    };

                    const currentUser = new User();
                    currentUser.id = '1';
                    currentUser.mail = 'current@example.com';
                    userRepositoryMock.findOne.mockReturnValueOnce(currentUser);

                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    emailChangeRepositoryMock.update.mockReturnThis();
                    emailChangeRepositoryMock.save.mockImplementationOnce((val) => val);
                    jest.spyOn(mailerService, 'sendMail').mockReturnValueOnce(Promise.reject());

                    userService
                        .handleEmailChange(userFromJwt, valuesToUpdate)
                        .then((res) => {
                            expect(res.newMail).toEqual(valuesToUpdate.mail);
                            expect(res.oldMail).toEqual(currentUser.mail);
                            expect(res.token).toMatch(/^.{64}$/);
                            expect(res.user).toBe(currentUser);
                            done();
                        })
                        .catch((err) => {
                            console.log(err);
                            throw new Error('I have failed you, Anakin. Should have returned EmailChange entity');
                        });
                });
            });

            describe('* should return error if request was invalid', () => {
                it('user not found', async () => {
                    const userFromJwt = new User();
                    userFromJwt.id = '1';
                    const valuesToUpdate = {
                        mail: 'changed@example.com',
                        domain: 'domain'
                    };

                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    userService
                        .handleEmailChange(userFromJwt, valuesToUpdate)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have gotten a DuplicateValuesException (email)');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EntityNotFoundException);
                            expect(err.data).toEqual('user');
                        });
                });

                it('email already in use', async () => {
                    const userFromJwt = new User();
                    userFromJwt.id = '1';
                    const valuesToUpdate = {
                        mail: 'changed@example.com',
                        domain: 'domain'
                    };

                    userRepositoryMock.findOne.mockReturnValueOnce(new User());
                    userRepositoryMock.findOne.mockReturnValueOnce(new User());

                    userService
                        .handleEmailChange(userFromJwt, valuesToUpdate)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have gotten a DuplicateValuesException (email)');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(DuplicateValueException);
                            expect(err.data).toEqual(['email']);
                        });
                });

                it('domain not provided', async () => {
                    const valuesToUpdate = {
                        mail: 'changed@example.com',
                        domain: undefined
                    };
                    const userFromJwt = new User();
                    userFromJwt.id = '1';

                    userRepositoryMock.findOne.mockReturnValueOnce(new User());
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);

                    userService
                        .handleEmailChange(userFromJwt, valuesToUpdate)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have gotten a EmptyFieldsException (email)');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(EmptyFieldsException);
                        });
                });

                it('reset previous mail changes error', async () => {
                    const valuesToUpdate = {
                        mail: 'changed@example.com',
                        domain: 'domain'
                    };
                    const userFromJwt = new User();
                    userFromJwt.id = '1';

                    userRepositoryMock.findOne.mockReturnValueOnce(new User());
                    userRepositoryMock.findOne.mockReturnValueOnce(undefined);
                    emailChangeRepositoryMock.update.mockReturnValueOnce(Promise.reject());

                    userService
                        .handleEmailChange(userFromJwt, valuesToUpdate)
                        .then(() => {
                            throw new Error('I have failed you, Anakin. Should have gotten a EmptyFieldsException (email)');
                        })
                        .catch((err) => {
                            expect(err).toBeInstanceOf(InternalErrorException);
                        });
                });
            });
        });
    });

    describe('* password change date', () => {
        describe('* should return date if successful', () => {
            it('only password reset', async () => {
                const user = new User();
                const password = 'password';

                const passwordReset = new PasswordReset();
                passwordReset.oldPassword = 'oldPassword (actually a hash)';
                passwordReset.used = new Date();
                passwordResetRepositoryMock.find.mockReturnValueOnce([passwordReset]);

                passwordChangeRepositoryMock.find.mockReturnValueOnce(undefined);

                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(Promise.resolve(true));

                const actual = await userService.getLastPasswordDate(user, password);
                expect(actual).toEqual(passwordReset.used);
            });

            it('only password change', async () => {
                const user = new User();
                const password = 'password';

                passwordResetRepositoryMock.find.mockReturnValueOnce(undefined);

                const passwordChange = new PasswordChange();
                passwordChange.oldPassword = 'oldPassword (actually a hash)';
                passwordChange.iat = new Date();
                passwordChangeRepositoryMock.find.mockReturnValueOnce([passwordChange]);

                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(Promise.resolve(true));

                const actual = await userService.getLastPasswordDate(user, password);
                expect(actual).toEqual(passwordChange.iat);
            });

            it('both (1 item each, reset more recent)', async () => {
                const user = new User();
                const password = 'password';

                const passwordReset = new PasswordReset();
                passwordReset.oldPassword = 'oldPassword (actually a hash)';
                passwordReset.used = new Date();
                passwordResetRepositoryMock.find.mockReturnValueOnce([passwordReset]);

                const passwordChange = new PasswordChange();
                passwordChange.oldPassword = 'oldPassword (actually a hash)';
                passwordChange.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
                passwordChangeRepositoryMock.find.mockReturnValueOnce([passwordChange]);

                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(Promise.resolve(true));
                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(Promise.resolve(true));

                const actual = await userService.getLastPasswordDate(user, password);
                expect(actual).toEqual(passwordReset.used);
            });

            it('both (1 item each, change more recent)', async () => {
                const user = new User();
                const password = 'password';

                const passwordReset = new PasswordReset();
                passwordReset.oldPassword = 'oldPassword (actually a hash)';
                passwordReset.used = new Date(Date.now() - (2 * 60 * 60 * 1000));
                passwordResetRepositoryMock.find.mockReturnValueOnce([passwordReset]);

                const passwordChange = new PasswordChange();
                passwordChange.oldPassword = 'oldPassword (actually a hash)';
                passwordChange.iat = new Date();
                passwordChangeRepositoryMock.find.mockReturnValueOnce([passwordChange]);

                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(Promise.resolve(true));
                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(Promise.resolve(true));

                const actual = await userService.getLastPasswordDate(user, password);
                expect(actual).toEqual(passwordChange.iat);
            });

            it('both (1 item each, reset password not matching)', async () => {
                const user = new User();
                const password = 'password';

                const passwordReset = new PasswordReset();
                passwordReset.oldPassword = 'oldPassword (actually a hash)';
                passwordReset.used = new Date();
                passwordResetRepositoryMock.find.mockReturnValueOnce([passwordReset]);

                const passwordChange = new PasswordChange();
                passwordChange.oldPassword = 'oldPassword (actually a hash)';
                passwordChange.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
                passwordChangeRepositoryMock.find.mockReturnValueOnce([passwordChange]);

                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(Promise.resolve(false));
                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(Promise.resolve(true));

                const actual = await userService.getLastPasswordDate(user, password);
                expect(actual).toEqual(passwordChange.iat);
            });

            it('both (1 item each, change password not matching)', async () => {
                const user = new User();
                const password = 'password';

                const passwordReset = new PasswordReset();
                passwordReset.oldPassword = 'oldPassword (actually a hash)';
                passwordReset.used = new Date(Date.now() - (2 * 60 * 60 * 1000));
                passwordResetRepositoryMock.find.mockReturnValueOnce([passwordReset]);

                const passwordChange = new PasswordChange();
                passwordChange.oldPassword = 'oldPassword (actually a hash)';
                passwordChange.iat = new Date();
                passwordChangeRepositoryMock.find.mockReturnValueOnce([passwordChange]);

                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(Promise.resolve(true));
                jest.spyOn(bcrypt, 'compare').mockReturnValueOnce(Promise.resolve(false));

                const actual = await userService.getLastPasswordDate(user, password);
                expect(actual).toEqual(passwordReset.used);
            });
        });
    });

    describe('* filter active EmailChange(s)', () => {
        it('by date (1 active, 1 expired)', async () => {
            let mailChangeToRemove = new EmailChange();
            mailChangeToRemove.iat = new Date(Date.now() - (30 * 60 * 60 * 1000));
            mailChangeToRemove.used = null;

            let mailChangeToKeep = new EmailChange();
            mailChangeToKeep.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
            mailChangeToKeep.used = null;

            const emailChange = [mailChangeToRemove, mailChangeToKeep];

            const actual = await userService.retrieveActiveMailChanges(emailChange);
            expect(actual).toEqual([mailChangeToKeep]);
        });

        it('used state (1 used, 1 unused)', async () => {
            let mailChangeToRemove = new EmailChange();
            mailChangeToRemove.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
            mailChangeToRemove.used = new Date();

            let mailChangeToKeep = new EmailChange();
            mailChangeToKeep.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
            mailChangeToKeep.used = null;

            const emailChange = [mailChangeToRemove, mailChangeToKeep];

            const actual = await userService.retrieveActiveMailChanges(emailChange);
            expect(actual).toEqual([mailChangeToKeep]);
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
