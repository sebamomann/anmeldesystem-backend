import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {User} from './user.entity';
import {IsNull, MoreThan, Not, Repository} from 'typeorm';
import {TelegramUser} from './telegram/telegram-user.entity';
import {MailerService} from '@nest-modules/mailer';
import {PasswordReset} from './password-reset/password-reset.entity';
import {InvalidTokenException} from '../../exceptions/InvalidTokenException';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {EmailChange} from './email-change/email-change.entity';
import {PasswordChange} from './password-change/password-change.entity';
import {EmptyFieldsException} from '../../exceptions/EmptyFieldsException';
import {AlreadyUsedException} from '../../exceptions/AlreadyUsedException';
import {InvalidRequestException} from '../../exceptions/InvalidRequestException';
import {ExpiredTokenException} from '../../exceptions/ExpiredTokenException';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {EntityGoneException} from '../../exceptions/EntityGoneException';
import {InternalErrorException} from '../../exceptions/InternalErrorException';
import {GeneratorUtil} from '../../util/generator.util';
import {Session} from './session.entity';
import {DomainUtil} from '../../util/domain.util';
import {PasswordUtil} from '../../util/password.util';

var logger = require('../../logger');
var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var userMapper = require('./user.mapper');
const btoa = require('btoa');

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
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

    public async __save(user: any) {
        return await this.userRepository.save(user);
    }

    public async findById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({where: {id: id}, relations: ['pinned']});

        if (user === undefined) {
            throw new EntityNotFoundException(null, null, 'user');
        }

        return user;
    }

    public async findByEmail(mail: string): Promise<User> {
        const user = await this.userRepository.findOne({where: [{mail: mail}]});

        if (user === undefined) {
            throw new EntityNotFoundException(null, null, 'user');
        }

        return user;
    }

    public async findByUsername(username: string): Promise<User> {
        const user = await this.userRepository.findOne({where: [{username: username}]});

        if (user === undefined) {
            throw new EntityNotFoundException(null, null, 'user');
        }

        return user;
    }

    public async findByEmailOrUsername(value: string): Promise<User> {
        const user = await this.userRepository.findOne({where: [{mail: value}, {username: value}]});

        if (user === undefined) {
            throw new EntityNotFoundException(null, null, 'user');
        }

        return user;
    }

    /**
     * Fetch user based on ID of passed user object.<br/>
     * Return mapped version.
     *
     * @param user_referenced
     *
     * @throws See {@link findById} for reference
     */
    public async get(user_referenced: User) {
        let user;

        try {
            user = await this.findById(user_referenced.id);
        } catch (e) {
            throw e;
        }

        return userMapper.basic(this, user);
    }

    /**
     * Create a new account based on the passed parameters.<br/>
     * On success send activation email to specified email address
     *
     * @param user_raw User Object with data to be
     * @param domain String template for activation parameters sent in the verification email
     *
     * @throws See {@link _checkForDuplicateValues} for reference
     */
    public async register(user_raw: User, domain: string) {
        const user = new User();

        await this._checkForDuplicateValues(user_raw);

        user.name = user_raw.name;
        user.username = user_raw.username;
        user.mail = user_raw.mail;
        user.password = PasswordUtil.cryptPassword(user_raw.password);

        console.log(process.env.NODE_ENV);

        if (process.env.NODE_ENV === 'test_postman') {
            user.activated = true;
        }

        const savedUser = await this.userRepository.save(user);

        this._sendRegisterEmail(savedUser, domain);

        return userMapper.basic(this, savedUser);
    }

    /**
     * Change an existing User with the given values. <br />
     * The allowedValuesToChange array shows all updatable options.
     *
     * @param user_to_change_values Values to change
     * @param userFromJwt User gotten from authentication check
     * @param domain String template for verification parameters
     */
    public async update(user_to_change_values: any, userFromJwt: User, domain: string) {
        let user;

        try {
            user = await this.findById(userFromJwt.id);
        } catch (e) {
            throw e;
        }

        const allowedValuesToChange = ['name', 'mail', 'password'];

        for (const [key, value] of Object.entries(user_to_change_values)) {
            if (key in user
                && user[key] !== value
                && allowedValuesToChange.indexOf(key) > -1) {
                let finalValue = value;

                if (key === 'mail') {
                    try {
                        const emailChange = await this.emailChange_initialize(userFromJwt, user_to_change_values.mail, domain);
                        user.emailChange = [emailChange];
                    } catch (e) {
                        throw e;
                    }

                    finalValue = user.mail;
                }

                if (key === 'password') {
                    finalValue = bcrypt.hashSync(finalValue, 10);

                    const passwordChange = new PasswordChange();
                    passwordChange.oldPassword = user.password;
                    passwordChange.user = user;

                    await this.passwordChangeRepository.save(passwordChange);
                }

                user[key] = finalValue;
            }
        }

        let savedUser = await this.userRepository.save(user);
        return userMapper.basic(this, savedUser);
    }

    /**
     * Activate created account (set activated attribute to 1).<br/>
     * Proper error messages on invalid token or already used
     *
     * @param mail String email address of account to activate
     * @param token String token send with mail on account creation
     */
    public async activateAccount(mail: string, token: string) {
        let user;

        try {
            user = await this.findByEmail(mail);
        } catch (e) {
            throw new EntityGoneException();
        }

        const verifyingToken = crypto
            .createHmac('sha256', user.mail + process.env.SALT_MAIL + user.username + user.iat.getTime())
            .digest('hex');

        const tokenIsValid = verifyingToken === token;

        if (tokenIsValid) {
            if (!!user.activated === false) {
                user.activated = true;
                await this.userRepository.save(user);

                return;
            }

            throw new AlreadyUsedException(null, 'User is already verified');
        }

        throw new InvalidTokenException();
    }

    /**
     * Initialize password forgotten sequence.<br />
     * Consisting of invalidate all previous password forgotten instances
     * and sending mail to set new password.
     *
     * @param mail Mail address of user who wants to reset his password
     * @param domain Domain to send url for password update to
     *
     * @returns url Url where to change password
     *
     * @throws See {@link findByEmail} for reference
     * @throws EmptyFieldsException if domain was not provided
     */
    public async passwordReset_initialize(mail: string, domain: string) {
        const user = await this.findByEmail(mail);

        if (!domain) {
            throw new EmptyFieldsException(null,
                'In order to send the password verification link you need to provide a domain',
                ['domain']);
        }

        await this._invalidatePendingPasswordResets(user);

        let token = crypto
            .createHmac('sha256', mail + process.env.SALT_MAIL + Date.now())
            .digest('hex');

        await this._storePasswordResetEntity(user, token); // TODO in own service

        // noinspection UnnecessaryLocalVariableJS
        let url = await this._sendPasswordResetInitializationEmail(domain, mail, token, user);

        return url;
    }

    /**
     * Updates the password of a user. <br />
     * Check for token validity and update passwordReset object. <br />
     *
     * @param mail mail address of user (from link)
     * @param token verification token (from link)
     * @param newPassword new password (from body)
     *
     * @return true if everything went accordingly
     *
     * @throws EntityNotFoundException when user with given mail does not exist anymore
     * @throws See {@link passwordReset_tokenVerification} for reference
     */
    public async passwordReset_updatePassword(mail: string, token: string, newPassword: string) {
        await this.passwordReset_tokenVerification(mail, token);

        const user = await this.findByEmail(mail);

        let currentPassword = user.password;
        user.password = PasswordUtil.cryptPassword(newPassword);

        await this.userRepository.save(user);

        this._markPasswordResetAsUsed(token, currentPassword)
            .catch(() => {
            }); // do nothing on catch because password is actually updated // TODO reset change

        return true;
    }

    /**
     * Check corresponding {@link PasswordReset} entity for being<br />
     * <ol>
     *     <li>Less than 24 hours in age</li>
     *     <li>Already being used</li>
     *     <li>Replaced by a new one</li>
     * </ol>
     * Note that the token does not need to be validated by recreation, due to database save.
     * The possibility of guessing a correct token is already low enough.
     *
     * @param mail mail address of user check for
     * @param token token created with mail address and
     *
     * @returns boolean (true) if token is valid
     *
     * @throws ExpiredTokenException if token is already replaced
     * @throws AlreadyUsedException if password reset is already done, so the token is used (1 time usage token)
     * @throws ExpiredTokenException if token is not used or replaced, but older than 24 hours
     */
    public async passwordReset_tokenVerification(mail: string, token: string) {
        const passwordReset = await this.passwordResetRepository.findOne({where: {token: token}}); // TODO in own service

        if (passwordReset === undefined) {
            throw new InvalidTokenException();
        }

        if ((passwordReset.iat.getTime() + (24 * 60 * 60 * 1000)) > Date.now()) {
            if (passwordReset.oldPassword === 'invalid') {
                throw new ExpiredTokenException('OUTDATED',
                    'Provided token was already replaced by a new one');
            } else if (passwordReset.used === null) {
                return true;
            }

            throw new AlreadyUsedException(null,
                'Provided token was already used at the following date',
                {date: new Date(passwordReset.used)});
        }

        throw new ExpiredTokenException();
    }

    /**
     * Initializes mail change event. This includes invalidating previous change attempts (pending verification) and
     * sending a verification mail to the new mail address.
     *
     * @param user The user whose mail is going to change
     * @param mail New mail address
     * @param domain Domain to build verification link with
     *
     * @returns url Email verification link to verify new mail address and execute mail change
     *
     * @throws See {@link findByEmail} for reference
     * @throws DuplicateValueException if new mail is already in use
     * @throws EmptyFieldsException if domain is missing
     */
    public async emailChange_initialize(user: User, mail, domain) {
        const _user = await this.findById(user.id);

        if (await this._existsByMail(mail) || await this._emailBlocked(mail)) {
            throw new DuplicateValueException(null, null, ['email']);
        }

        if (!domain) {
            throw new EmptyFieldsException(null,
                'Due to the mail change you need to provide the domain for the activation call',
                ['domain']);
        }

        await this._cancelPendingMailChanges(_user);

        let token = crypto
            .createHmac('sha256', mail + process.env.SALT_MAIL + Date.now())
            .digest('hex');

        let emailChange = await this.createEmailChangeEntity(_user, token, mail);

        this._sendEmailChangeEmail(domain, mail, token, _user);

        return emailChange;
    }

    /**
     * Updates the mail address of a user. <br />
     * Check for token validity and update {@link EmailChange} object. <br />
     *
     * @param mail mail address of user (from link)
     * @param token verification token (from link)
     *
     * @return true if everything went accordingly
     *
     * @throws EntityNotFoundException when user with given mail does not exist anymore
     * @throws See {@link emailChange_tokenVerification} for reference
     */
    public async emailChange_updateEmail(mail: string, token: string) {
        const emailChange = await this.emailChange_tokenVerification(mail, token);

        const user = await this.findByEmail(emailChange.oldMail);

        let currentMail = user.mail;
        user.mail = mail;

        await this.userRepository.save(user);

        await this._updateEmailChangeEntity(token, currentMail)
            .catch(() => {
            });

        return true;
    }

    /**
     * Check corresponding {@link EmailChange} entity for being<br />
     * <ol>
     *     <li>Less than 24 hours in age</li>
     *     <li>Already being used</li>
     *     <li>Replaced by a new one</li>
     * </ol>
     * Note that the token does not need to be validated by recreation, due to database save.
     * The possibility of guessing a correct token is already low enough.
     *
     * @param mail mail address of user check for
     * @param token token created with mail address and
     *
     * @returns EmailChange Object
     *
     * @throws ExpiredTokenException if token is already replaced
     * @throws AlreadyUsedException if password reset is already done, so the token is used (1 time usage token)
     * @throws ExpiredTokenException if token is not used or replaced, but older than 24 hours
     */
    public async emailChange_tokenVerification(mail: string, token: string) {
        let emailChange = await this.emailChangeRepository.findOne({where: {token: token, newMail: mail}});

        if (emailChange === undefined) {
            throw new InvalidTokenException();
        }

        if ((emailChange.iat.getTime() + (24 * 60 * 60 * 1000)) > Date.now()) {
            if (emailChange.oldMail === 'invalid') {
                throw new ExpiredTokenException('OUTDATED',
                    'Provided token was already replaced by a new one');
            } else if (emailChange.used === null) {
                return emailChange;
            }

            throw new AlreadyUsedException(null,
                'Provided token was already used',
                {date: new Date(emailChange.used)});
        }

        throw new ExpiredTokenException();
    }

    /**
     * Re-Execute initial mail change.<br />
     * Includes checking for mail to be already used by different user and resending mail with token.
     *
     * @param user
     * @param domain
     *
     * @returns emaiLChange object
     *
     * @throws InvalidTokenException if the email cant be resend due to no active email change
     * @throws See {@link emailChange_initialize} for reference
     */
    public async emailChange_resendEmail(user: User, domain: string) {
        let emailChange = await this.emailChangeRepository.findOne({
            where: {
                oldMail: Not('invalid'),
                used: IsNull()
            },
            order: {
                iat: 'DESC'
            }
        });

        if (!emailChange) {
            throw new InvalidRequestException(null,
                'There is no active mail change going on. Email resend is not possible');
        }

        return await this.emailChange_initialize(user, emailChange.newMail, domain);
    }

    /**
     * Reset all pending mail changes for given user. This invalidates all active tokens. <br />
     * Normally there is just one token for a email change active at any given time (per user)
     *
     * @param user User to cancel mail changes for
     *
     * @returns void
     *
     * @throws See {@link _cancelPendingMailChanges} for reference
     */
    public async emailChange_cancelPendingChanges(user: User) {
        await this._cancelPendingMailChanges(user);
    }

    /**
     * Gives the User more information about his password.<br />
     * Function is used to get the date, at which the user changed the provided password to a new one.<br />
     *
     * @param user User to retrieve information for
     * @param password Password to check when it was changed
     *
     * @returns date at which provided password was lastly changed | null if this password was never used
     */
    public async getLastValidityDateOfPassword(user: User, password: string) {
        let used = null;

        const passwordChangeListByReset = await this.passwordResetRepository.find({
            where: {
                oldPassword: !IsNull(),
                user: {
                    id: user.id
                }
            },
            order: {
                iat: 'DESC'
            }
        });

        if (passwordChangeListByReset) {
            for (const _pass of passwordChangeListByReset) {
                if (PasswordUtil.compare(password, _pass.oldPassword)) {
                    used = _pass.used;
                    break;
                }
            }
        }

        const passwordChangeListByChange = await this.passwordChangeRepository.find({
            where: {
                oldPassword: !IsNull(),
                user: {
                    id: user.id
                }
            },
            order: {
                iat: 'DESC'
            }
        });

        if (passwordChangeListByChange) {
            for (const _pass of passwordChangeListByChange) {
                if (PasswordUtil.compare(password, _pass.oldPassword)) {
                    if (used < _pass.iat) {
                        used = _pass.iat;
                    }

                    break;
                }
            }
        }

        return used;
    }

    public async createSession(user) { // todo own session service
        const refreshToken = GeneratorUtil.makeid(40);

        const session = new Session();
        session.refreshToken = refreshToken;
        session.user = user;
        session.last_used = new Date();

        await this.sessionRepository.save(session);

        return session;
    }

    public async sessionExists(refreshToken: string, id: string) {
        const session = await this.sessionRepository.findOne({where: {refreshToken: refreshToken, user: id}});

        if (session === undefined) {
            throw new EntityNotFoundException();
        }

        session.last_used = new Date();
        session.times_used = session.times_used + 1;
        await this.sessionRepository.save(session);

        return session;
    }

    private async createEmailChangeEntity(_user, token: string, mail) {
        let emailChange = new EmailChange();
        emailChange.user = _user;
        emailChange.token = token;
        emailChange.newMail = mail;
        emailChange.oldMail = _user.mail;

        emailChange = await this.emailChangeRepository.save(emailChange);
        return emailChange;
    }

    private _sendEmailChangeEmail(domain, mail, token: string, _user) {
        const url = `https://${DomainUtil.replaceDomain(domain, btoa(mail).replace('=', ''), token)}`;

        this.mailerService
            .sendMail({
                to: mail,
                from: process.env.MAIL_ECA,
                subject: 'Bitte bestätige deine neue Email-Adresse',
                template: 'emailchange',
                context: {
                    name: _user.username,
                    url: url
                },
            })
            .then(() => {
            })
            .catch(() => {
                logger.log('error', 'Could not send mail change mail to %s', mail);
            });
    }

    private async _invalidatePendingPasswordResets(user: User) {
        await this.passwordResetRepository.update({
            used: IsNull(),
            oldPassword: IsNull(),
            user: {
                id: user.id
            }
        }, {
            oldPassword: 'invalid'
        });
    }

    private _sendPasswordResetInitializationEmail(domain: string, mail: string, token: string, user: User) {
        let url = `https://${DomainUtil.replaceDomain(domain, btoa(mail).replace('=', ''), token)}`;

        this.mailerService
            .sendMail({
                to: mail,
                from: process.env.MAIL_ECA,
                subject: 'Jemand möchte dein Passwort zurücksetzen. Bist das du?',
                template: 'passwordreset',
                context: {
                    name: user.username,
                    url: url
                },
            })
            .then(() => {
            })
            .catch(() => {
                logger.log('error', 'Could not send register mail to %s', user.mail);
            });
        return url;
    }

    private async _storePasswordResetEntity(user: User, token: string) {
        const passwordReset = new PasswordReset();
        passwordReset.user = user;
        passwordReset.token = token;

        await this.passwordResetRepository.save(passwordReset);
    }

    private _sendRegisterEmail(user: User, domain: string) {
        let token = crypto.createHmac('sha256',
            user.mail + process.env.SALT_MAIL + user.username + (new Date(user.iat)).getTime())
            .digest('hex');

        console.log(user.mail + process.env.SALT_MAIL + user.username + (new Date(user.iat)).getTime());
        console.log(token);

        this.mailerService
            .sendMail({
                to: user.mail,
                from: process.env.MAIL_ECA,
                subject: 'Neuer Account',
                template: 'register',
                context: {
                    name: user.username,
                    url: `https://${DomainUtil.replaceDomain(domain, btoa(user.mail), token)}`
                },
            })
            .then(() => {
            })
            .catch((err) => {
                // maybe cleanup registered user ?
                logger.log('error', `Could not send register mail to "${user.mail}"`);
                logger.log('error', err);
            });
    }

    private async _checkForDuplicateValues(user: User) {
        let duplicateValues = [];
        if (await this._existsByUsername(user.username)) {
            duplicateValues.push('username');
        }

        if (await this._existsByMail(user.mail)) {
            duplicateValues.push('email');
        }

        if (duplicateValues.length > 0) {
            throw new DuplicateValueException(null, null, duplicateValues);
        }
    }

    private async _existsByUsername(username: string) {
        return this.findByUsername(username)
            .then(() => {
                return true;
            })
            .catch(() => {
                return false;
            });
    }

    private async _existsByMail(mail: string) {
        return this.findByEmail(mail)
            .then(() => {
                return true;
            })
            .catch(() => {
                return false;
            });
    }

    private async _markPasswordResetAsUsed(token: string, currentPassword: string) {
        try {
            await this.passwordResetRepository
                .update({
                    token: token
                }, {
                    used: new Date(Date.now()),
                    oldPassword: currentPassword
                });
        } catch (e) {
            logger.log('error', `Can't execute query to update password reset entity with token ${token}`);
            throw new InternalErrorException();
        }
    }

    private async _updateEmailChangeEntity(token: string, currentMail: string) {
        try {
            await this.emailChangeRepository
                .update({
                    token: token
                }, {
                    used: new Date(Date.now()),
                    oldMail: currentMail
                });
        } catch (e) {
            logger.log('error', `Can't execute query to update email change entity with token ${token}`);
            throw new InternalErrorException();
        }
    }

    private async _cancelPendingMailChanges(user: User) {
        try {
            await this.emailChangeRepository
                .update({
                    used: IsNull(),
                    user: {
                        id: user.id
                    }
                }, {
                    oldMail: 'invalid'
                });
        } catch (e) {
            logger.log('error', `Can't execute query to cancel mail change of user ${user.id}`);
            throw new InternalErrorException(null, 'Cannot cancel mail change due to a database error');
        }
    }

    private async _emailBlocked(mail: any) {
        return await this.emailChangeRepository.findOne({
            where: {
                used: MoreThan(new Date(new Date().getTime() - 15 * 60000)),
                oldMail: mail
            }
        }) !== undefined;
    }
}
