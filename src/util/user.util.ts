import {IUserMinified} from '../modules/user/IUserMinified';
import {KeycloakUser} from '../modules/user/KeycloakUser';

export class UserUtil {
    public static stripUserMin(user: KeycloakUser): IUserMinified {
        return (({firstName, lastName, username}) => ({
            name: firstName + ' ' + lastName, username,
        }))
        (user);
    }
}
