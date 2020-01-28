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
                console.log("correct password");
                const {password, ...result} = user;
                console.log(result);
                return result;
            } else {
                console.log("wrong password");
                const passwordChangeDate = await this.userService.getLastPasswordDate(user, pass);
                console.log(passwordChangeDate);
                if (passwordChangeDate != null) {
                    console.log("is old pw");
                    return new Date(passwordChangeDate);
                }
            }
        }
        return null;
    }

    async login(user: any) {
        const payload = {sub: user.id, mail: user.mail};
        user.token = this.jwtService.sign(payload);
        return user;
    }

}
