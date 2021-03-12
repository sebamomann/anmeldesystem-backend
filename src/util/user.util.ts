import {User} from '../modules/user/user.entity';

export class UserUtil {
    public static stripUserMin(user: User) {
        return (({name, username}) => ({
            name, username,
        }))
        (user);
    }
}
