import {Injectable} from '@nestjs/common';
import {UserService} from "../modules/user/user.service";
import {JwtService} from '@nestjs/jwt';

var bcrypt = require('bcryptjs');

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService,
                private readonly jwtService: JwtService) {
    }

    async validateUser(mail: string, pass: string): Promise<any> {
        const user = await this.userService.findByEmail(mail);
        if (user && bcrypt.compare(user.password, pass)) {
            const {password, ...result} = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = {sub: user.id};
        user.token = this.jwtService.sign(payload);
        return user;
    }

}
