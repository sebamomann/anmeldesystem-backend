import {IUserDTO} from '../modules/user/IUserDTO';
import {KeycloakUser} from '../modules/user/KeycloakUser';

export class UserUtil {
    public static stripUserMin(user: KeycloakUser): IUserDTO {
        return (({firstName, lastName, username}) => ({
            name: firstName + ' ' + lastName, username,
        }))
        (user);
    }
}
