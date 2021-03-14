import {Test, TestingModule} from '@nestjs/testing';
import {UserService} from './user.service';
import {Repository} from 'typeorm';
import {getRepositoryToken} from '@nestjs/typeorm';
import {MailerService} from '@nest-modules/mailer';
import {MAILER_OPTIONS} from '@nest-modules/mailer/dist/constants/mailer-options.constant';
import {User} from './user.model';

describe('UserService', () => {
    let userService: UserService;
    let mailerService: MailerService;
    let module: TestingModule;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserService,
                MailerService,
                {provide: getRepositoryToken(User), useFactory: repositoryMockFactory},
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
    });

    it('should be defined', () => {
        expect(userService).toBeDefined();
    });

    // describe('* find user', () => {
    //     describe('* by id', () => {
    //         it('* successful should return entity', async () => {
    //             const __given_id = '583bb85b-c951-4cd0-8b82-16500b5bda17';
    //
    //             const __existing_user = new User();
    //             __existing_user.sub = __given_id;
    //
    //             userRepositoryMock.findOne.mockReturnValue(__existing_user);
    //
    //             const __expected = __existing_user;
    //
    //             const __actual = await userService.findById(__given_id);
    //
    //             expect(__actual).toEqual(__expected);
    //         });
    //
    //         it('failure should return error', async (done) => {
    //             const __given_id = '583bb85b-c951-4cd0-8b82-16500b5bda17';
    //
    //             const __existing_user = undefined;
    //
    //             userRepositoryMock.findOne.mockReturnValue(__existing_user);
    //
    //             try {
    //                 await userService.findById(__given_id);
    //                 done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
    //             } catch (e) {
    //                 expect(e).toBeInstanceOf(EntityNotFoundException);
    //                 expect(e.data).toBe('user');
    //                 done();
    //             }
    //         });
    //     });
    //
    //     describe('* by username', () => {
    //         it('* successful should return entity', async () => {
    //             const __given_username = 'username';
    //
    //             const __existing_user = new User();
    //             __existing_user.sub = __given_username;
    //
    //             userRepositoryMock.findOne.mockReturnValue(__existing_user);
    //
    //             const __expected = __existing_user;
    //
    //             const __actual = await userService.findByUsername(__given_username);
    //
    //             expect(__actual).toEqual(__expected);
    //         });
    //
    //         it('failure should return error', async (done) => {
    //             const __given_username = 'username';
    //
    //             const __existing_user = undefined;
    //
    //             userRepositoryMock.findOne.mockReturnValue(__existing_user);
    //
    //             try {
    //                 await userService.findByUsername(__given_username);
    //                 done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
    //             } catch (e) {
    //                 expect(e).toBeInstanceOf(EntityNotFoundException);
    //                 expect(e.data).toBe('user');
    //                 done();
    //             }
    //         });
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
