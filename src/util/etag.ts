var crypto = require('crypto');

export class Etag {
    public static generate = function(string: String) {
        return crypto
            .createHash('sha256')
            .update(string)
            .digest('base64')
            .substring(0, 27);
    };
}
