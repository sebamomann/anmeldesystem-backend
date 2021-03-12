import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {AuthGuard} from './auth.gurad';

@Injectable()
export class AuthOptGuard implements CanActivate {
    constructor(private guard: AuthGuard) {
    }

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        if (request.headers.authorization) {
            try {
                await this.guard.canActivate(context);
            } catch {
                request.user = null;
                // request.headers["X-Valid-Authorization"] = false;
            }
        } else {
            // request.headers.add["X-Valid-Authorization"] = false;
            request.user = null;
        }

        return true;
    }
}
