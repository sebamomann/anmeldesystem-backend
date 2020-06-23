import {EmailChange} from './email-change.entity';

module.exports = {
    basic: function(_emailChange: EmailChange) {
        return (({newMail, oldMail, iat,}) =>
            ({newMail, oldMail, iat,}))
        (_emailChange);
    },
};
