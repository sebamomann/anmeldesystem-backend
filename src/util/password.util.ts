var bcrypt = require('bcryptjs');

export class PasswordUtil {
    public static cryptPassword = function(password) {
        return bcrypt.hashSync(password, 10);
    };

    static compare(password: string, hash: string) {
        return bcrypt.compareSync(password, hash);
    }
}
