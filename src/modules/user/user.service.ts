import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {User} from "./user.entity";
import {Repository} from 'typeorm';
import {TelegramUser} from "./telegram/telegram-user.entity";
import {MailerService} from "@nest-modules/mailer";
import {PasswordReset} from "./password-reset/password-reset.entity";
import {InvalidTokenException} from "../../exceptions/InvalidTokenException";

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
        private readonly mailerService: MailerService
    ) {
    }

    findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    register(user: User): Promise<User> {
        const userToDb = new User();
        userToDb.username = user.username;
        userToDb.mail = user.mail;
        try {
            userToDb.password = bcrypt.hashSync(user.password, 10);
        } catch (e) {
            console.log(e);
        }

        return this.userRepository.save(userToDb);
    }

    async findByEmail(email: string): Promise<User | undefined> {
        return this.userRepository.findOne({
            where: {mail: email},
            select: ["id", "username", "mail", "password"]
        });
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

    async resetPasswordInit(mail: string, domain: string) {
        const user = await this.findByEmail(mail);
        console.log(user);
        if (user != null) {
            console.log(process.env.MAIL_TOKEN_SALT);
            let token = crypto.createHmac('sha256', mail + process.env.MAIL_TOKEN_SALT + Date.now()).digest('hex');
            const passwordReset = new PasswordReset();
            passwordReset.user = user;
            passwordReset.token = token;

            await this.passwordResetRepository.save(passwordReset);

            this
                .mailerService
                .sendMail({
                    to: mail,
                    from: 'no-reply@eca.cg-hh.de',
                    subject: 'Jemand möchte dein Passwort zurücksetzen. Bist das du?',
                    template: 'passwordreset', // The `.pug` or `.hbs` extension is appended automatically.
                    context: {  // Data to be sent to template engine.
                        name: user.username,
                        url: `${domain}/${mail}/${token}`
                    },
                })
                .then(() => {
                })
                .catch((err) => {
                    console.log(err);
                });
        }
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
                if (passwordReset.used === null) {
                    throw new InvalidTokenException('OUTDATED', 'Provided token was already replaced by a new one', null);
                } else if (isNaN(passwordReset.used.getTime())) {
                    return true;
                }

                throw new InvalidTokenException('USED', 'Provided token was already used', {date: passwordReset.used});
            }

            throw new InvalidTokenException('EXPIRED', 'Provided token expired', null);
        }

        throw new InvalidTokenException('INVALID', 'Provided token is not valid', null);
    }

    async updatePassword(mail: string, token: string, pass: string) {
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
}
