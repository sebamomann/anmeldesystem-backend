import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
/*
    Custom imports for AuthService, jwt secret, etc...
*/
import * as jwt from 'jsonwebtoken';
import {User} from '../modules/user/user.entity';
import {jwtConstants} from './constants';
import {WsException} from '@nestjs/websockets';

require('dotenv').config();

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor() {
    }

    async canActivate(context: ExecutionContext) {
        const client = context.switchToWs().getClient();
        const auth: string = client.handshake.headers.authorization;

        if (auth !== undefined) {
            const authToken = auth.split(' ')[1];

            try {
                const jwtPayload: any = <User> jwt.verify(authToken, jwtConstants.secret);
                context.switchToWs().getData().user = jwtPayload;
                return Boolean(jwtPayload);
            } catch (e) {
                throw new WsException('Invalid credentials.');
            }
        }

        return Boolean(true);
    }
}
