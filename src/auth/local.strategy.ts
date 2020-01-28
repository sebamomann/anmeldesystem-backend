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
        const res = await this.authService.validateUser(mail, password);
        if (!res) {
            throw new UnauthorizedException();
        }

        return res;
    }
}
