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

    async login(value: string, pass: string): Promise<any> {
        let user;

        try {
            user = await this.userService.findByEmailOrUsername(value);
        } catch (e) {
            throw e;
        }

        if (await bcrypt.compare(pass, user.password)) {

            const session = await this.userService.createSession(user);

            user.refreshToken = session.refreshToken;

            return userMapper.basic(this.userService, user);
        } else {
            const passwordChangeDate = await this.userService.getLastPasswordDate(user, pass);

            if (passwordChangeDate != null) {
                return new Date(passwordChangeDate);
            }
        }
    }

    public addJwtToObject(user: User) {
        /* change here for more data */
        const payload = {sub: user.id, mail: user.mail, username: user.username};
        user.token = this.jwtService.sign(payload);
        return user;
    }

    async generateAccessToken(data: { user: { id: string }; refreshToken: string }) {
        let user;

        try {
            user = await this.userService.findById(data.user.id);
        } catch (e) {
            throw e;
        }

        let session;

        try {
            session = await this.userService.sessionExists(data.refreshToken, data.user.id);
        } catch (e) {
            throw new UnauthorizedException();
        }

        const _user = userMapper.basic(this.userService, user);

        const token = this.addJwtToObject(_user);

        return {
            ...user,
            token: token.token,
            refreshToken: data.refreshToken,
        };
    }
}
