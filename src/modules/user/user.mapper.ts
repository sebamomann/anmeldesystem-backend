import {User} from './user.entity';
import {UserService} from './user.service';

const emailChangeMapper = require('./email-change/email-change.mapper');

module.exports = {
    basic: function(userService: UserService, _user: User) {
        const newUser = (({id, name, username, mail, emailChange, iat,}) =>
            ({id, name, username, mail, emailChange: userService.retrieveActiveMailChanges(emailChange), iat}))
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
