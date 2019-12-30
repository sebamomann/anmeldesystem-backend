import {User} from "../modules/user/user.entity";

export class UserUtil {

    public static minimizeUser = function (user: User) {
        let _user: User = new User();
        _user.username = user.username;
        return user
    }
}
