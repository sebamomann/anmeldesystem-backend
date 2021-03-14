import {Injectable, NotImplementedException} from '@nestjs/common';
import {JWT_User} from './user.model';

import KcAdminClient from 'keycloak-admin';
import {Issuer} from 'openid-client';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {KeycloakUser} from './KeycloakUser';

require('dotenv').config();

@Injectable()
export class UserService {
    private kcAdminClient;

    constructor() {
        this.kcAdminClient = new KcAdminClient({
                baseUrl: process.env.KEYCLOAK_URL + 'auth',
                realmName: process.env.KEYCLOAK_REALM,
            }
        );

        this.kcAdminClient.auth({
            username: process.env.KEYCLOAK_ADMIN_USERNAME,
            password: process.env.KEYCLOAK_ADMIN_PASSWORD,
            grantType: 'password',
            clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID,
        })
            .then(async () => {
                const keycloakIssuer = await Issuer.discover(
                    process.env.KEYCLOAK_URL + 'auth/admin/realms/' + process.env.KEYCLOAK_REALM,
                );

                const client = new keycloakIssuer.Client({
                    client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID,
                    token_endpoint_auth_method: 'none', // to send only client_id in the header
                });

                let tokenSet = await client.grant({
                    grant_type: 'password',
                    username: process.env.KEYCLOAK_ADMIN_USERNAME,
                    password: process.env.KEYCLOAK_ADMIN_PASSWORD
                });

                setInterval(async () => {
                    console.log("REFRESH");
                    console.log(tokenSet);
                    const refreshToken = tokenSet.refresh_token;
                    tokenSet = await client.refresh(refreshToken);
                    this.kcAdminClient.setAccessToken(tokenSet.access_token);
                }, 58 * 1000);
            })
            .catch((err) => {
                console.log(err);
            })
        ;
    }

    public async __save(user: any) {
    }

    public async findById(id: string): Promise<KeycloakUser> { // TODO REIMPLEMENT KEYCLOAK
        let user: KeycloakUser;

        try {
            user = await this.kcAdminClient.users.findOne({id});
        } catch (e) {
            console.log(e);
            throw new EntityNotFoundException(null, null, 'user');
        }

        return user;
    }

    public async findByUsername(username: string): Promise<JWT_User> { // TODO REIMPLEMENT KEYCLOAK
        throw new NotImplementedException();
    }
}
