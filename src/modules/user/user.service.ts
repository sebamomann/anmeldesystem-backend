import {Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {User} from './user.entity';
import {getRepository, Repository} from 'typeorm';
import {TelegramUser} from './telegram/telegram-user.entity';
import {MailerService} from '@nest-modules/mailer';
import {PasswordReset} from './password-reset/password-reset.entity';
import {InvalidTokenException} from '../../exceptions/InvalidTokenException';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {EmailChange} from './email-change/email-change.entity';
import {PasswordChange} from './password-change/password-change.entity';
import {EmptyFieldsException} from '../../exceptions/EmptyFieldsException';
import {AlreadyUsedException} from '../../exceptions/AlreadyUsedException';
import {UnknownUserException} from '../../exceptions/UnknownUserException';
import {InvalidRequestException} from '../../exceptions/InvalidRequestException';
import {ExpiredTokenException} from '../../exceptions/ExpiredTokenException';

var crypto = require('crypto');
var bcrypt = require('bcryptjs');

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(TelegramUser)
        private readonly telegramUserRepository: Repository<TelegramUser>,
        @InjectRepository(PasswordReset)
        private readonly passwordResetRepository: Repository<PasswordReset>,
        @InjectRepository(PasswordChange)
        private readonly passwordChangeRepository: Repository<PasswordChange>,
        @InjectRepository(EmailChange)
        private readonly emailChangeRepository: Repository<EmailChange>,
        private mailerService: MailerService,
    ) {
    }

    public async findById(id: number): Promise<User | undefined> {
        return await this.userRepository.findOne({where: {id: id}});
    }

    public async findByEmail(mail: string): Promise<User | undefined> {
        return await this.userRepository.findOne({where: [{mail: mail}]});
    }

    public async findByUsername(username: string): Promise<User | undefined> {
        return await this.userRepository.findOne({where: [{username: username}]});
    }

    async findByEmailOrUsername(value: string) {
        return await this.userRepository.findOne({where: [{mail: value}, {username: value}]});
    }

    public async get(user: User) {
        const _user = await this.findById(user.id);

        if (_user === undefined) {
            throw new NotFoundException();
        }

        _user.emailChange = _user.emailChange.filter(fEmailChange =>
            (fEmailChange.iat.getTime()) + (24 * 60 * 60 * 1000) > Date.now()
            && fEmailChange.oldMail != 'invalid'
            && fEmailChange.used === null);

        if (JSON.stringify(_user.emailChange) === JSON.stringify([])) {
            delete _user.emailChange;
        }

        return _user;
    }

    public async register(user: User, domain: string) {
        const userToDb = new User();
        userToDb.name = user.name;
        userToDb.username = user.username;
        userToDb.mail = user.mail;

        try {
            await this.checkForDuplicateValues(user);
        } catch (e) {
            throw e;
        }

        try {
            userToDb.password = bcrypt.hashSync(user.password, 10);
        } catch (e) {
            console.log(e);
        }

        const savedUser = await this.userRepository.save(userToDb);

        let token = crypto.createHmac('sha256',
            user.mail + process.env.SALT_MAIL + savedUser.username + savedUser.iat)
            .digest('hex');

        this.mailerService
            .sendMail({
                to: user.mail,
                from: process.env.MAIL_ECA,
                subject: 'Neuer Account',
                template: 'register',
                context: {
                    name: user.username,
                    url: `https://${domain}/${user.mail}/${token}`
                },
            })
            .then(() => {
            })
            .catch((err) => {
                console.log(err);
            });

        return savedUser;
    }

    async update(_toChange: any, _user: User) {
        let user = await this.findById(_user.id);

        for (const [key, value] of Object.entries(_toChange)) {
            if (key in user && user[key] !== value) {
                let _value = value;
                if (key === 'username') {
                    _value = user.username;
                }

                if (key === 'mail') {
                    this.handleEmailChange(_user, _toChange)
                        .catch(err => {
                            throw err;
                        });
                    _value = user.mail;
                }

                if (key === 'password') {
                    _value = bcrypt.hashSync(_value, 10);

                    const passwordChange = new PasswordChange();
                    passwordChange.oldPassword = user.password;
                    passwordChange.user = user;

                    await this.passwordChangeRepository.save(passwordChange);
                }

                user[key] = _value;
            }
        }

        let ret_user = await this.userRepository.save(user);

        return await this.get(ret_user);
    }

    async activate(mail: string, token: string) {
        let user = await this.findByEmail(mail);

        if (user != undefined) {
            const verifyingToken = crypto
                .createHmac('sha256', user.mail + process.env.SALT_MAIL + user.username + user.iat)
                .digest('hex');

            const tokenIsValid = verifyingToken === token;

            if (tokenIsValid) {
                if (!!user.activated === false) {
                    user.activated = true;
                    await this.userRepository.save(user);

                    return true;
                }

                throw new AlreadyUsedException(null, 'User is already verified');
            }

            throw new InvalidTokenException();
        }

        throw new UnknownUserException();
    }

    public async resetPasswordInitialization(mail: string, domain: string) {
        const user = await this.findByEmail(mail);

        if (user != undefined) {
            await this.passwordResetRepository
                .query('UPDATE user_password_reset ' +
                    'SET oldPassword = \'invalid\' ' +
                    'WHERE used IS NULL ' +
                    'AND oldPassword IS NULL ' +
                    'AND userId = ?', [user.id]);

            let token = crypto
                .createHmac('sha256', mail + process.env.SALT_MAIL + Date.now())
                .digest('hex');

            const passwordReset = new PasswordReset();
            passwordReset.user = user;
            passwordReset.token = token;

            await this.passwordResetRepository.save(passwordReset);

            this.mailerService
                .sendMail({
                    to: mail,
                    from: process.env.MAIL_ECA,
                    subject: 'Jemand möchte dein Passwort zurücksetzen. Bist das du?',
                    template: 'passwordreset',
                    context: {
                        name: user.username,
                        url: `https://${domain}/${mail}/${token}`
                    },
                })
                .then(() => {
                })
                .catch(() => {
                });
        }
    }

    async updatePassword(mail: string, token: string, pass: string) {
        return this.resetPasswordTokenVerification(mail, token)
            .then(async () => {
                const user = await this.findByEmail(mail);

                let currentPassword = user.password;
                user.password = bcrypt.hashSync(pass, 10);

                await this.userRepository.save(user);
                await this.passwordResetRepository
                    .createQueryBuilder('pwr')
                    .update(PasswordReset)
                    .set({used: new Date(Date.now()), oldPassword: currentPassword})
                    .where('token = :token', {token: token})
                    .execute();

                return true;
            })
            .catch(() => {
                throw new UnauthorizedException();
            });
    }

    public mailChangeVerifyTokenAndExecuteChange(mail: string, token: string) {
        return this.validateMailChangeToken(mail, token)
            .then(async res => {
                const user = await this.findByEmail(res.oldMail);

                let currentMail = user.mail;
                user.mail = mail;

                await this.userRepository.save(user);
                await this.passwordResetRepository
                    .createQueryBuilder('emailChange')
                    .update(EmailChange)
                    .set({used: new Date(Date.now()), oldMail: currentMail})
                    .where('token = :token', {token: token})
                    .execute();

                return true;
            })
            .catch(() => {
                throw new UnauthorizedException();
            });
    }

    async resetPasswordTokenVerification(mail: string, token: string) {
        let passwordReset = await this.passwordResetRepository
            .createQueryBuilder('passwordReset')
            .where('passwordReset.token = :token', {token: token})
            .innerJoin('passwordReset.user', 'user', 'user.mail = :mail', {mail})
            .getOne();

        if (passwordReset != undefined) {
            if ((passwordReset.iat.getTime() + (24 * 60 * 60 * 1000)) > Date.now()) {
                if (passwordReset.oldPassword === 'invalid') {
                    throw new ExpiredTokenException('OUTDATED', 'Provided token was already replaced by a new one');
                } else if (passwordReset.used === null) {
                    return true;
                }

                throw new AlreadyUsedException(null, 'Provided token was already used at the following date', {date: new Date(passwordReset.used)});
            }

            throw new ExpiredTokenException();
        }

        throw new InvalidTokenException();
    }

    public async mailChangeResendMail(user: User, domain: string) {
        let emailChange = await getRepository(EmailChange)
            .createQueryBuilder('emailChange')
            .where('emailChange.oldMail NOT LIKE :oldMail', {oldMail: 'invalid'})
            .andWhere('emailChange.used IS NULL')
            .orderBy('emailChange.iat', 'DESC')
            .getOne();

        if (emailChange !== undefined) {
            this.handleEmailChange(user, {mail: emailChange.newMail, domain: domain});
            return true;
        }

        throw new InvalidRequestException(null, 'There is no active mail change going on. Email resend is not possible');
    }

    public async mailChangeDeactivateToken(user: User) {
        return this.resetPreviousMailChanges(user);
    }

    public async getLastPasswordDate(user: User, pass: string) {
        let used = null;

        const passwordChangeListByReset = await this.userRepository
            .query('SELECT oldPassword, used ' +
                'FROM user_password_reset ' +
                'WHERE oldPassword IS NOT NULL ' +
                'AND userId = ? ' +
                'ORDER BY iat DESC ', [user.id]);

        if (passwordChangeListByReset) {
            for (const _pass of passwordChangeListByReset) {
                if (await bcrypt.compare(pass, _pass.oldPassword)) {
                    used = _pass.used;
                    break;
                }
            }
        }

        const passwordChangeListByChange = await this.userRepository
            .query('SELECT oldPassword, iat ' +
                'FROM user_password_change ' +
                'WHERE userId = ? ' +
                'ORDER BY iat DESC ', [user.id]);

        if (passwordChangeListByChange) {
            for (const _pass of passwordChangeListByChange) {
                if (await bcrypt.compare(pass, _pass.oldPassword)) {
                    if (used < _pass.iat) {
                        used = _pass.iat;
                    }

                    break;
                }
            }
        }

        return used;
    }

    private async existsByUsername(username: string) {
        return await this.findByUsername(username).catch() !== undefined;
    }

    private async existsByMail(mail: string) {
        return await this.findByEmail(mail).catch() !== undefined;
    }

    // async addTelegramUser(telegramUser: TelegramUser, user: User) {
    //     let savedTelegramUser = await this.telegramUserRepository.save(telegramUser);
    //     let userFromDb = await this.find(user.id);
    //     userFromDb.telegramUser = savedTelegramUser;
    //     return this.userRepository.save(userFromDb);
    // }

    // -------------------- UTIL -------------------- //
    // -------------------- UTIL -------------------- //
    // -------------------- UTIL -------------------- //

    private async validateMailChangeToken(mail: string, token: string) {
        let emailChange = await this.emailChangeRepository
            .createQueryBuilder('emailChange')
            .where('emailChange.token = :token', {token: token})
            .andWhere('emailChange.newMail = :mail', {mail: mail})
            .getOne();
        if (emailChange != undefined) {
            if ((emailChange.iat.getTime() + (24 * 60 * 60 * 1000)) > Date.now()) {
                if (emailChange.oldMail === 'invalid') {
                    throw new InvalidTokenException('OUTDATED', 'Provided token was already replaced by a new one', null);
                } else if (emailChange.used === null) {
                    return emailChange;
                }

                throw new AlreadyUsedException(null, 'Provided token was already used');
            }

            throw new ExpiredTokenException();
        }

        throw new InvalidTokenException();
    }

    private async handleEmailChange(user: User, {mail, domain}) {
        const _user = await this.findByEmail(user.mail);

        if (await this.findByEmail(mail) !== undefined) {
            throw new DuplicateValueException(null, null, ['email']);
        }

        if (domain === undefined
            || domain === null
            || domain === '') {
            throw new EmptyFieldsException(null, 'Due to the mail change you need to provide the domain for the activation call');
        }

        if (_user != null) {
            await this.resetPreviousMailChanges(_user);

            let token = crypto
                .createHmac('sha256', mail + process.env.SALT_MAIL + Date.now())
                .digest('hex');

            const emailChange = new EmailChange();
            emailChange.user = user;
            emailChange.token = token;
            emailChange.newMail = mail;
            emailChange.oldMail = user.mail;

            await this.emailChangeRepository.save(emailChange);

            this.mailerService
                .sendMail({
                    to: mail,
                    from: process.env.MAIL_ECA,
                    subject: 'Bitte bestätige deine neue Email-Adresse',
                    template: 'emailchange',
                    context: {
                        name: _user.username,
                        url: `https://${domain}/${mail}/${token}`
                    },
                })
                .then(() => {
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }

    private async resetPreviousMailChanges(user: User) {
        return await this.emailChangeRepository
            .query('UPDATE user_mail_change ' +
                'SET oldMail = \'invalid\' ' +
                'WHERE used IS NULL ' +
                'AND userId = ?', [user.id]);
    }

    private async checkForDuplicateValues(user: User) {
        let duplicateValues = [];
        if (await this.existsByUsername(user.username)) {
            duplicateValues.push('username');
        }

        if (await this.existsByMail(user.mail)) {
            duplicateValues.push('mail');
        }

        if (duplicateValues.length > 0) {
            throw new DuplicateValueException(null, null, duplicateValues);
        }
    }
}
