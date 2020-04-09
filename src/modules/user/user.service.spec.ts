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

            it('should return error if not found', async () => {
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
    });
});

// @ts-ignore
export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    save: jest.fn()
}));

export type MockType<T> = {
    [P in keyof T]: jest.Mock<{}>;
};
