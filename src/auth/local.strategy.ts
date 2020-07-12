import {Strategy} from 'passport-local';
import {PassportStrategy} from '@nestjs/passport';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {AuthService} from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super();
    }

    async validate(mail: string, password: string): Promise<any> {
        let res;

        try {
            res = await this.authService.login(mail, password);
        } catch (e) {
            throw new UnauthorizedException();
        }

        return res;
    }
}
