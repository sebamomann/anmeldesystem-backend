var bcrypt = require('bcryptjs');

exports.cryptPassword = function (password) {
    bcrypt.genSalt(10, function (err, salt) {
        if (err)
            throw Error;

        bcrypt.hash(password, salt, function (err, hash) {
            console.log('In function Hash' + hash);
            return hash;
        });
    });
};

