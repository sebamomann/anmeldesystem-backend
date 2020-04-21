import {Test, TestingModule} from '@nestjs/testing';
import {CommentService} from './comment.service';
import {getRepositoryToken} from '@nestjs/typeorm';
import {Comment} from './comment.entity';
import {Repository} from 'typeorm';
import {Enrollment} from '../enrollment.entity';
import {EnrollmentService} from '../enrollment.service';
import {AppointmentService} from '../../appointment/appointment.service';
import {AdditionService} from '../../addition/addition.service';
import {PassengerService} from '../passenger/passenger.service';
import {DriverService} from '../driver/driver.service';
import {MailerService} from '@nest-modules/mailer';
import {Driver} from '../driver/driver.entity';
import {Passenger} from '../passenger/passenger.entity';
import {Key} from '../key/key.entity';
import {Mail} from '../mail/mail.entity';
import {Appointment} from '../../appointment/appointment.entity';
import {User} from '../../user/user.entity';
import {File} from '../../file/file.entity';
import {Addition} from '../../addition/addition.entity';
import {TelegramUser} from '../../user/telegram/telegram-user.entity';
import {PasswordReset} from '../../user/password-reset/password-reset.entity';
import {PasswordChange} from '../../user/password-change/password-change.entity';
import {EmailChange} from '../../user/email-change/email-change.entity';
import {MAILER_OPTIONS} from '@nest-modules/mailer/dist/constants/mailer-options.constant';
import {UserService} from '../../user/user.service';
import {FileService} from '../../file/file.service';
import {EntityNotFoundException} from '../../../exceptions/EntityNotFoundException';

describe('CommentService', () => {
    let commentService: CommentService;
    let enrollmentService: EnrollmentService;
    let appointmentService: AppointmentService;
    let additionService: AdditionService;
    let passengerService: PassengerService;
    let driverService: DriverService;
    let mailerService: MailerService;
    let userService: UserService;
    let fileService: FileService;

    let commentRepositoryMock: MockType<Repository<Comment>>;
    let enrollmentRepositoryMock: MockType<Repository<Enrollment>>;
    let appointmentRepositoryMock: MockType<Repository<Appointment>>;
    let userRepositoryMock: MockType<Repository<User>>;
    let fileRepositoryMock: MockType<Repository<File>>;
    let additionRepositoryMock: MockType<Repository<Addition>>;
    let telegramUserRepositoryMock: MockType<Repository<TelegramUser>>;
    let passwordResetRepositoryMock: MockType<Repository<PasswordReset>>;
    let passwordChangeRepositoryMock: MockType<Repository<PasswordChange>>;
    let emailChangeRepositoryMock: MockType<Repository<EmailChange>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CommentService,
                EnrollmentService,
                AppointmentService,
                AdditionService,
                PassengerService,
                DriverService,
                MailerService,
                UserService,
                AdditionService,
                FileService,
                MailerService,
                {provide: getRepositoryToken(Comment), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Enrollment), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Driver), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Passenger), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Key), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Mail), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Appointment), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(User), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(File), useFactory: repositoryMockFactory},
                {provide: getRepositoryToken(Addition), useFactory: repositoryMockFactory},
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

        commentService = module.get<CommentService>(CommentService);
        enrollmentService = module.get<EnrollmentService>(EnrollmentService);
        appointmentService = module.get<AppointmentService>(AppointmentService);
        additionService = module.get<AdditionService>(AdditionService);
        passengerService = module.get<PassengerService>(PassengerService);
        driverService = module.get<DriverService>(DriverService);
        mailerService = module.get<MailerService>(MailerService);
        userService = module.get<UserService>(UserService);
        fileService = module.get<FileService>(FileService);
        additionService = module.get<AdditionService>(AdditionService);
        mailerService = module.get<MailerService>(MailerService);

        commentRepositoryMock = module.get(getRepositoryToken(Comment));
        enrollmentRepositoryMock = module.get(getRepositoryToken(Enrollment));
        appointmentRepositoryMock = module.get(getRepositoryToken(Appointment));
        userRepositoryMock = module.get(getRepositoryToken(User));
        fileRepositoryMock = module.get(getRepositoryToken(File));
        additionRepositoryMock = module.get(getRepositoryToken(Addition));
        telegramUserRepositoryMock = module.get(getRepositoryToken(TelegramUser));
        passwordResetRepositoryMock = module.get(getRepositoryToken(PasswordReset));
        passwordChangeRepositoryMock = module.get(getRepositoryToken(PasswordChange));
        emailChangeRepositoryMock = module.get(getRepositoryToken(EmailChange));
    });

    it('should be defined', () => {
        expect(commentService).toBeDefined();
    });

    describe('* create appointment', () => {
        describe('should return created entity if successful', () => {
            it('successful request', async () => {
                const enrollment = new Enrollment();
                enrollment.id = '1';
                const comment = new Comment();
                comment.enrollment = enrollment;

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(enrollment);
                commentRepositoryMock.save.mockImplementationOnce((val) => val);

                commentService
                    .create(comment)
                    .then((res) => {
                        expect(res).toBeInstanceOf(Comment);
                        expect(res.enrollment).toEqual(enrollment);
                    })
                    .catch((err) => {
                        throw new Error('I have failed you, Anakin. Should have returned created comment entity');
                    });
            });
        });

        describe('should return error if failed', () => {
            it('enrollment not found', async () => {
                const enrollment = new Enrollment();
                enrollment.id = '1';
                const comment = new Comment();
                comment.enrollment = enrollment;

                enrollmentRepositoryMock.findOne.mockReturnValueOnce(undefined);

                commentService
                    .create(comment)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have returned EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toEqual('enrollment');
                    });
            });
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});

// @ts-ignore
export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
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

