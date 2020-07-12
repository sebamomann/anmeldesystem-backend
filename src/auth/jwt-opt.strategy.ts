import {AuthGuard} from '@nestjs/passport';
import {UnauthorizedException} from '@nestjs/common';

export class JwtOptStrategy extends AuthGuard('jwt') {

    // Override handleRequest so it never throws an error
    handleRequest(err, user, info, context) {
        const authHeader = context.switchToHttp().getRequest().headers.authorization;

        console.log(info);
        console.log(authHeader);

        if (info && authHeader !== '' && authHeader !== undefined) {
            throw new UnauthorizedException();
        }

        return user;
    }
}
