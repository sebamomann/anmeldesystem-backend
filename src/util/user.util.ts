import {IUserMinified} from '../modules/user/IUserMinified';
import {User} from '../modules/user/user.model';

export class UserUtil {
    public static stripUserMin(user: User): IUserMinified {
        return (({name, preferred_username}) => ({
            name, username: preferred_username,
        }))
        (user);
    }
}
