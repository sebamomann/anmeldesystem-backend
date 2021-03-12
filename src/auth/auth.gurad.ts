import {CanActivate, ExecutionContext, HttpService, Injectable, UnauthorizedException} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private httpService: HttpService) {
    }

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const url = `${process.env.KEYCLOAK_URL}auth/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;

        try {
            const response = await this.httpService.get<any>(url, {
                headers: {
                    authorization: `${request.headers.authorization}`,
                },
            }).toPromise();

            request.user = response.data;

            return true;
        } catch (e) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }
    }
}
