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

const crypto = require('crypto');

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

    describe('* find user', () => {
        describe('* by id', () => {
            it('should return entity if found', async () => {
                const idToSatisfyParameter = 1;
                const user = new User();

                userRepositoryMock.findOne.mockReturnValue(user);
                expect(await userService.findById(idToSatisfyParameter)).toEqual(user);
            });

            it('should return error if not found', async () => {
                const idToSatisfyParameter = 1;
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

    describe('* overall information (by id from jwt)', () => {
        it('should return entity if found', async () => {
            const userToSatisfyParameter = new User();

            let mainUserValue = new User();
            mainUserValue.emailChange = [];
            userRepositoryMock.findOne.mockReturnValue(mainUserValue);

            const actual = await userService.get(userToSatisfyParameter);
            expect(actual).toEqual(mainUserValue);
        });

        describe('* should return entity if found with valid emailChange filtering', () => {
            it('determine by date', async () => {
                const userToSatisfyParameter = new User();

                let mainUserValue = new User();

                let mailChangeToRemove = new EmailChange();
                mailChangeToRemove.iat = new Date(Date.now() - (30 * 60 * 60 * 1000));

                let mailChangeToKeep = new EmailChange();
                mailChangeToKeep.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
                mailChangeToKeep.used = null;

                mainUserValue.emailChange = [mailChangeToRemove, mailChangeToKeep];
                userRepositoryMock.findOne.mockReturnValue(mainUserValue);

                const actual = await userService.get(userToSatisfyParameter);
                expect(actual).toEqual(mainUserValue);
                expect(actual.emailChange).toEqual([mailChangeToKeep]);
            });

            it('determine by used state', async () => {
                const userToSatisfyParameter = new User();

                let mainUserValue = new User();

                let mailChangeToRemove = new EmailChange();
                mailChangeToRemove.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
                mailChangeToRemove.used = new Date();

                let mailChangeToKeep = new EmailChange();
                mailChangeToKeep.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
                mailChangeToKeep.used = null;

                mainUserValue.emailChange = [mailChangeToRemove, mailChangeToKeep];
                userRepositoryMock.findOne.mockReturnValue(mainUserValue);

                const actual = await userService.get(userToSatisfyParameter);
                expect(actual).toEqual(mainUserValue);
                expect(actual.emailChange).toEqual([mailChangeToKeep]);
            });

            it('remove emailChange list if empty', async () => {
                const userToSatisfyParameter = new User();

                let mainUserValue = new User();

                let mailChangeToRemove = new EmailChange();
                mailChangeToRemove.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
                mailChangeToRemove.used = new Date();

                let mailChangeToRemove2 = new EmailChange();
                mailChangeToRemove2.iat = new Date(Date.now() - (2 * 60 * 60 * 1000));
                mailChangeToRemove2.used = new Date();

                mainUserValue.emailChange = [mailChangeToRemove, mailChangeToRemove2];
                userRepositoryMock.findOne.mockReturnValue(mainUserValue);

                const actual = await userService.get(userToSatisfyParameter);
                expect(actual).toEqual(mainUserValue);
                expect(actual.emailChange).toEqual(undefined);
            });
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
        it('should return registered user if successful', async () => {
            const user = new User();
            user.username = 'username';
            user.mail = 'mail@example.com';
            user.password = 'password';
            const domainToSatisfyParameter = 'example.de';

            userRepositoryMock.findOne.mockReturnValueOnce(undefined);
            userRepositoryMock.findOne.mockReturnValueOnce(undefined);
            userRepositoryMock.save.mockReturnValueOnce(user);
            jest.spyOn(mailerService, 'sendMail').mockImplementation((): Promise<any> => Promise.resolve({}));

            const actual = await userService.register(user, domainToSatisfyParameter);
            expect(actual).toEqual(user);
        });

        describe('* should return error if user already exists with given values', () => {
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

    describe('* update user', () => {
        describe('* should return updated user if successful', () => {
            it('name', async () => {
                const valuesToUpdate = {
                    name: 'updatedName'
                };
                const userFromJwt = new User();
                userFromJwt.id = 1;

                const currentUser = new User();
                currentUser.name = 'currentName';
                userRepositoryMock.findOne.mockReturnValueOnce(currentUser);

                userRepositoryMock.save.mockImplementation((val) => val);

                const actual = await userService.update(valuesToUpdate, userFromJwt);
                expect(actual.name).toEqual(valuesToUpdate.name);
            });

            it('email (email still same due to mail verification)', async () => {
                const valuesToUpdate = {
                    mail: 'changed@example.com',
                    domain: 'domain'
                };
                const userFromJwt = new User();
                userFromJwt.id = 1;

                const currentUser = new User();
                currentUser.mail = 'current@example.com';
                userRepositoryMock.findOne.mockReturnValueOnce(currentUser);
                jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.resolve(new User()));
                jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.reject(new EntityNotFoundException()));
                emailChangeRepositoryMock.query.mockReturnValueOnce(undefined);
                emailChangeRepositoryMock.save.mockReturnValueOnce(undefined);
                jest.spyOn(mailerService, 'sendMail').mockImplementationOnce((): Promise<any> => Promise.resolve({}));
                userRepositoryMock.save.mockImplementation((val) => val);

                const actual = await userService.update(valuesToUpdate, userFromJwt);
                expect(actual.mail).toEqual(currentUser.mail);
            });

            it('password', async () => {
                const valuesToUpdate = {
                    password: 'newPassword'
                };
                const userFromJwt = new User();
                userFromJwt.id = 1;

                const currentUser = new User();
                currentUser.password = 'currentPassword';
                userRepositoryMock.findOne.mockReturnValueOnce(currentUser);
                passwordChangeRepositoryMock.save.mockImplementation((val) => val);
                userRepositoryMock.save.mockImplementation((val) => val);

                const actual = await userService.update(valuesToUpdate, userFromJwt);
                expect(actual).toBe(currentUser);
            });
        });

        describe('* should return error if request was invalid', () => {
            it('email already in use', async () => {
                const valuesToUpdate = {
                    mail: 'changed@example.com',
                    domain: 'domain'
                };
                const userFromJwt = new User();
                userFromJwt.id = 1;

                const currentUser = new User();
                currentUser.mail = 'current@example.com';
                userRepositoryMock.findOne.mockReturnValueOnce(currentUser);
                jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.resolve(new User()));
                jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.resolve(new User()));

                userService
                    .update(valuesToUpdate, userFromJwt)
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
                    mail: 'changed@example.com'
                };
                const userFromJwt = new User();
                userFromJwt.id = 1;

                const currentUser = new User();
                currentUser.mail = 'current@example.com';
                userRepositoryMock.findOne.mockReturnValueOnce(currentUser);
                jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.resolve(new User()));
                jest.spyOn(userService, 'findByEmail').mockImplementationOnce(() => Promise.reject(new EntityNotFoundException()));

                userService
                    .update(valuesToUpdate, userFromJwt)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten a DuplicateValuesException (email)');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EmptyFieldsException);
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
});

// @ts-ignore
export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    query: jest.fn()
}));

export type MockType<T> = {
    [P in keyof T]: jest.Mock<{}>;
};
