import {User} from './user.entity';
import {UserService} from './user.service';

module.exports = {
    // TODO refresh token should not be returned actually ....
    basic: function(userService: UserService, _user: User) {
        return (({
                     // id,
                     // name,
                     // username,
                     // mail,
                     // emailChange,
                     // iat,
                     // refreshToken,
                     // accountActivationToken,
                     // accountActivationEmail
                 }) =>
            ({
                // id,
                // name,
                // username,
                // mail,
                // emailChange: UserUtil.filterActiveEmailChanges(emailChange), // shouldn't be like that, dont pass service
                // iat,
                // refreshToken,
                // accountActivationToken,
                // accountActivationEmail
            }))
        (_user);
    },
};
