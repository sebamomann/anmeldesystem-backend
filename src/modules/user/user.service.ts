import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {User} from "./user.entity";
import {getRepository, Repository} from 'typeorm';
import {TelegramUser} from "./telegram/telegram-user.entity";
import {MailerService} from "@nest-modules/mailer";
import {PasswordReset} from "./password-reset/password-reset.entity";
import {InvalidTokenException} from "../../exceptions/InvalidTokenException";
import {DuplicateValueException} from "../../exceptions/DuplicateValueException";
import {EmailChange} from "./email-change/email-change.entity";
import {AppointmentService} from "../appointment/appointment.service";

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
        @InjectRepository(EmailChange)
        private readonly emailChangeRepository: Repository<EmailChange>,
        private mailerService: MailerService,
        private appointmentService: AppointmentService
    ) {
    }

    async get(user) {
        const _user = await this.userRepository.findByIds(user.id);
        const __user = _user[0];
        __user.emailChange = __user.emailChange.filter(fEmailChange =>
            (fEmailChange.iat.getTime()) + (24 * 60 * 60 * 1000) > Date.now()
            && fEmailChange.oldMail != 'invalid'
            && fEmailChange.used === null);

        if (JSON.stringify(__user.emailChange) === JSON.stringify([])) {
            delete __user.emailChange;
        }

        return __user;
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

        let token = crypto.createHmac('sha256',
            user.mail + process.env.MAIL_TOKEN_SALT + user.username + Date.now())
            .digest('hex');

        this.mailerService
            .sendMail({
                to: user.mail,
                from: 'no-reply@eca.cg-hh.de',
                subject: 'Neuer Account',
                template: 'register', // The `.pug` or `.hbs` extension is appended automatically.
                context: {  // Data to be sent to template engine.
                    name: user.username,
                    url: `https://${domain}/${user.mail}/${token}`
                },
            })
            .then(() => {
            })
            .catch((err) => {
                console.log(err);
            });

        return await this.userRepository.save(userToDb);
    }

    async verifyAccountByEmail(mail: string, token: string) {
        let user = await this.findByEmail(mail);
        if (user != undefined) {
            if (!!user.activated === false) {
                user.activated = true;
                await this.userRepository.save(user);
                return true;
            }

            throw new InvalidTokenException('USED', 'User is already verified', null);
        }

        throw new InvalidTokenException('INVALID', 'Provided token is not valid', null);
    }

    public async findByEmail(mail: string): Promise<User | undefined> {
        return await this.userRepository
            .createQueryBuilder("user")
            .where("user.mail = :mail", {mail: mail})
            .getOne();
    }

    public async findByUsername(username: string): Promise<User | undefined> {
        return await this.userRepository
            .createQueryBuilder("user")
            .where("user.username = :username", {username: username})
            .getOne();
    }

    public async findById(id: string): Promise<User | undefined> {
        return await this.userRepository
            .createQueryBuilder("user")
            .where("user.id = :id", {id: id})
            .getOne();
    }

    public async resetPasswordInit(mail: string, domain: string) {
        const user = await this.findByEmail(mail);
        if (user != null) {
            await this.passwordResetRepository.query("UPDATE user_password_reset " +
                "SET oldPassword = 'invalid' " +
                "WHERE used IS NULL " +
                "AND oldPassword IS NULL " +
                "AND userId = ?", [user.id]);

            let token = crypto.createHmac('sha256', mail + process.env.MAIL_TOKEN_SALT + Date.now()).digest('hex');
            const passwordReset = new PasswordReset();
            passwordReset.user = user;
            passwordReset.token = token;

            await this.passwordResetRepository.save(passwordReset);

            this.mailerService
                .sendMail({
                    to: mail,
                    from: 'no-reply@eca.cg-hh.de',
                    subject: 'Jemand möchte dein Passwort zurücksetzen. Bist das du?',
                    template: 'passwordreset', // The `.pug` or `.hbs` extension is appended automatically.
                    context: {  // Data to be sent to template engine.
                        name: user.username,
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

    private async checkForDuplicateValues(user: User) {
        let duplicateValues = [];
        if (await this.existsByUsername(user.username)) {
            duplicateValues.push('username');
        }

        if (await this.existsByMail(user.mail)) {
            duplicateValues.push('mail');
        }

        if (duplicateValues.length > 0) {
            throw new DuplicateValueException('DUPLICATE_ENTRY',
                'Following values are already taken',
                duplicateValues);
        }
    }

    private async existsByUsername(username: string) {
        return await this.userRepository.findOne({
            where: {
                username: username
            },
        }) !== undefined;
    }

    async addTelegramUser(telegramUser: TelegramUser, user: User) {
        let savedTelegramUser = await this.telegramUserRepository.save(telegramUser);
        let userFromDb = await this.find(user.id);
        userFromDb.telegramUser = savedTelegramUser;
        return this.userRepository.save(userFromDb);
    }

    private async find(id: number) {
        return await this.userRepository.findOne({where: {id: id}});
    }

    private async existsByMail(mail: string) {
        return await this.findByEmail(mail).catch() !== undefined;
    }

    makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    async validatePasswordresetToken(mail: string, token: string) {
        let passwordReset = await this.passwordResetRepository
            .createQueryBuilder("passwordReset")
            .where("passwordReset.token = :token", {token: token})
            .innerJoin("passwordReset.user", "user", "user.mail = :mail", {mail})
            .getOne();
        if (passwordReset != undefined) {
            if ((passwordReset.iat.getTime() + (24 * 60 * 60 * 1000)) > Date.now()) {
                if (passwordReset.oldPassword === 'invalid') {
                    throw new InvalidTokenException('OUTDATED', 'Provided token was already replaced by a new one', null);
                } else if (passwordReset.used === null) {
                    return true;
                }

                throw new InvalidTokenException('USED', 'Provided token was already used', {date: new Date(passwordReset.used)});
            }

            throw new InvalidTokenException('EXPIRED', 'Provided token expired', null);
        }

        throw new InvalidTokenException('INVALID', 'Provided token is not valid', null);
    }

    public async validateMailChangeToken(mail: string, token: string) {
        let emailChange = await this.emailChangeRepository
            .createQueryBuilder("emailChange")
            .where("emailChange.token = :token", {token: token})
            .andWhere("emailChange.newMail = :mail", {mail: mail})
            .getOne();
        if (emailChange != undefined) {
            if ((emailChange.iat.getTime() + (24 * 60 * 60 * 1000)) > Date.now()) {
                if (emailChange.oldMail === 'invalid') {
                    throw new InvalidTokenException('OUTDATED', 'Provided token was already replaced by a new one', null);
                } else if (emailChange.used === null) {
                    return emailChange;
                }

                throw new InvalidTokenException('USED', 'Provided token was already used', {date: new Date(emailChange.used)});
            }

            throw new InvalidTokenException('EXPIRED', 'Provided token expired', null);
        }

        throw new InvalidTokenException('INVALID', 'Provided token is not valid', null);
    }

    async updatePassword(mail: string, token: string, pass: string): Promise<boolean> {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.validatePasswordresetToken(mail, token)
                .then(async res => {
                    console.log(res);
                    const user = await self.findByEmail(mail);
                    let currentPassword = user.password;
                    let newPassword;
                    newPassword = bcrypt.hashSync(pass, 10);

                    user.password = newPassword;
                    await self.userRepository.save(user);
                    await self.passwordResetRepository
                        .createQueryBuilder("pwr")
                        .update(PasswordReset)
                        .set({used: new Date(Date.now()), oldPassword: currentPassword})
                        .where("token = :token", {token: token})
                        .execute();

                    return resolve(true);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    async getLastPasswordDate(user: User, pass: string) {
        const res = await this.userRepository.query("SELECT * " +
            "FROM user_password_reset " +
            "WHERE oldPassword IS NOT NULL " +
            "AND userId = ? " +
            "ORDER BY iat DESC " +
            "LIMIT 1", [user.id]);
        console.log(res);
        if (res) {
            if (await bcrypt.compare(pass, res[0].oldPassword)) {
                console.log("is old pass");
                console.log(res[0].used);
                return res[0].used;
            }
        }
    }

    async update(toChange: any, user: User) {
        let _user = await this.find(user.id);

        for (const [key, value] of Object.entries(toChange)) {
            if (key in _user && _user[key] !== value) {
                let _value = value;
                if (key === "username") {
                    _value = _user.username;
                }
                if (key === "mail") {
                    this.handleEmailChange(user, toChange)
                        .catch(err => {
                            console.log(err);
                            throw err;
                        });
                    _value = _user.mail;
                }
                if (key === "password") {
                    _value = bcrypt.hashSync(_value, 10);
                }

                console.log(`${key} changed from ${JSON.stringify(_user[key])} to ${JSON.stringify(_value)}`);

                _user[key] = _value;
            }
        }

        let ret_user = await this.userRepository.save(_user);

        return await this.get(ret_user);
    }

    public verifyMailChange(mail: string, token: string) {
        const self = this;
        return new Promise(function (resolve, reject) {
            self.validateMailChangeToken(mail, token)
                .then(async res => {
                    const user = await self.findByEmail(res.oldMail);
                    let currentMail = user.mail;
                    user.mail = mail;

                    await self.userRepository.save(user);
                    await self.passwordResetRepository
                        .createQueryBuilder("emailChange")
                        .update(EmailChange)
                        .set({used: new Date(Date.now()), oldMail: currentMail})
                        .where("token = :token", {token: token})
                        .execute();

                    return resolve(true);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    cancelMailChange(user: User) {
        return this.resetPreviousMailChanges(user);
    }

    private async handleEmailChange(user: User, {mail, domain}) {
        console.log("handleMailChange");
        const _user = await this.findByEmail(user.mail);

        if (await this.findByEmail(mail) !== undefined) {
            throw new DuplicateValueException('DUPLICATE_ENTRY',
                'Following values are already taken',
                ['mail']);
        }

        if (domain === '') {
            console.log("missing domain");
            throw new BadRequestException("EMPTY_FIELDS", "Due to the mail change you need to provide the domain for the activation call");
        }

        if (_user != null) {
            await this.resetPreviousMailChanges(_user);

            let token = crypto.createHmac('sha256', mail + process.env.MAIL_TOKEN_SALT + Date.now()).digest('hex');

            const emailChange = new EmailChange();
            emailChange.user = user;
            emailChange.token = token;
            emailChange.newMail = mail;
            emailChange.oldMail = user.mail;

            await this.emailChangeRepository.save(emailChange);

            this.mailerService
                .sendMail({
                    to: mail,
                    from: 'no-reply@eca.cg-hh.de',
                    subject: 'Bitte bestätige deine neue Email-Adresse',
                    template: 'emailchange', // The `.pug` or `.hbs` extension is appended automatically.
                    context: {  // Data to be sent to template engine.
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

    async resendMailChange(user, domain: string) {
        let emailChange = await getRepository(EmailChange)
            .createQueryBuilder("emailChange")
            .where("emailChange.oldMail NOT LIKE :oldMail", {oldMail: 'invalid'})
            .andWhere("emailChange.used IS NULL")
            .orderBy("emailChange.iat", "DESC")
            .getOne();

        if (emailChange !== undefined) {
            this.handleEmailChange(user, {mail: emailChange.newMail, domain: domain});
        }
    }

    private async resetPreviousMailChanges(user: User) {
        await this.emailChangeRepository.query("UPDATE user_mail_change " +
            "SET oldMail = 'invalid' " +
            "WHERE used IS NULL " +
            "AND userId = ?", [user.id]);
    }

    async pinAppointment(user: User, link: string) {
        const appointment = await this.appointmentService.find(link);
        const _user = await this.find(user.id);

        if (_user.pinned.includes(appointment)) {
            const removeIndex = _user.pinned.indexOf(appointment);
            _user.pinned.splice(removeIndex, 1);
        } else {
            _user.pinned.push(appointment);
        }

        return this.userRepository.save(_user);
    }
}
