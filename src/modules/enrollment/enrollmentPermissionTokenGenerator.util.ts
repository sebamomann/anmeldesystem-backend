const crypto = require('crypto');

export class EnrollmentPermissionTokenGeneratorUtil {
    constructor() {
    }

    /**
     * Generate a {@link Enrollment} permission token by {@link Enrollment} id.<br/>
     * Token is generated as a sha256 hash with a salt.
     *
     * @param id        ID of {@link Enrollment}
     *
     * @return Permission token
     */
    public generateToken(id: string): string {
        return crypto.createHash('sha256')
            .update(id + process.env.SALT_ENROLLMENT)
            .digest('hex');
    }
}
