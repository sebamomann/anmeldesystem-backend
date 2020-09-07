import {Injectable, UnauthorizedException} from '@nestjs/common';
import {UserService} from '../modules/user/user.service';
import {JwtService} from '@nestjs/jwt';
import {User} from '../modules/user/user.entity';

const userMapper = require('../modules/user/user.mapper');
var bcrypt = require('bcryptjs');

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService,
                private readonly jwtService: JwtService) {
    }

    public async login(value: string, pass: string): Promise<any> {
        let user;

        try {
            user = await this.userService.findByEmailOrUsername(value);
        } catch (e) {
            throw new UnauthorizedException({
                code: 'INVALID_PASSWORD',
                message: 'Invalid password or username',
            });
        }

        if (user.activated) {
            if (await bcrypt.compare(pass, user.password)) {
                const session = await this.userService.createSession(user);

                user.refreshToken = session.refreshToken;

                return userMapper.basic(this.userService, user);
            } else {
                const passwordChangeDate = await this.userService.getLastValidityDateOfPassword(user, pass);

                if (passwordChangeDate != null) {
                    throw new UnauthorizedException({
                        code: 'INVALID_PASSWORD',
                        message: 'This password has been changed',
                        data: new Date(passwordChangeDate)
                    });
                } else {
                    throw new UnauthorizedException({
                        code: 'INVALID_PASSWORD',
                        message: 'Invalid password or username',
                    });
                }
            }
        } else {
            throw new UnauthorizedException({
                code: 'ACCOUNT_LOCK',
                message: 'This account has not been activated yet',
                data: 'NOT_ACTIVATED'
            });
        }
    }

    public addJwtToObject(user: User) {
        /* change here for more data | and in jwt strategy */
        const payload = {sub: user.id, mail: user.mail, username: user.username, name: user.name};
        user.token = this.jwtService.sign(payload);

        return user;
    }

    public async generateAccessToken(data: { user: { id: string }; refreshToken: string }) {
        let user;

        try {
            user = await this.userService.findById(data.user.id);
        } catch (e) {
            throw e;
        }

        try {
            await this.userService.sessionExists(data.refreshToken, data.user.id);
        } catch (e) {
            throw new UnauthorizedException();
        }

        const _user = userMapper.basic(this.userService, user);

        const token = this.addJwtToObject(_user);

        return {
            ..._user,
            token: token.token,
            refreshToken: data.refreshToken,
        };
    }
}
