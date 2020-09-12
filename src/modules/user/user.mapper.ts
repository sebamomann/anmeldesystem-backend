import {User} from './user.entity';
import {UserService} from './user.service';
import {UserUtil} from '../../util/user.util';

const emailChangeMapper = require('./email-change/email-change.mapper');

module.exports = {
    // TODO refresh token should not be returned actually ....
    basic: function(userService: UserService, _user: User) {
        const newUser = (({
                              id,
                              name,
                              username,
                              mail,
                              emailChange,
                              iat,
                              refreshToken,
                              accountActivationToken,
                              accountActivationEmail
                          }) =>
            ({
                id,
                name,
                username,
                mail,
                emailChange: UserUtil.filterActiveEmailChanges(emailChange), // shouldn't be like that, dont pass service
                iat,
                refreshToken,
                accountActivationToken,
                accountActivationEmail
            }))
        (_user);

        if (newUser.emailChange.length === 0) {
            delete newUser.emailChange;
        } else {
            newUser.emailChange = newUser.emailChange.map(mEmailChange => {
                return emailChangeMapper.basic(mEmailChange);
            });
        }

        return newUser;
    },
};
