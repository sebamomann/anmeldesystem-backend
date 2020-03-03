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
        if (user != undefined) {
            if (await bcrypt.compare(pass, user.password)) {
                const {password, activated, ...result} = user;
                return result;
            } else {
                const passwordChangeDate = await this.userService.getLastPasswordDate(user, pass);
                if (passwordChangeDate != null) {
                    return new Date(passwordChangeDate);
                }
            }
        }

        return null;
    }

    async login(user: any) {
        /* change here for more data */
        const payload = {sub: user.id, mail: user.mail, username: user.username};
        user.token = this.jwtService.sign(payload);
        return user;
    }
}
