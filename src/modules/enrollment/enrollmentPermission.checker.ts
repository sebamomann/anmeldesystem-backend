import {JWT_User} from '../user/user.model';
import {Enrollment} from './enrollment.entity';

export class EnrollmentPermissionChecker {
    private enrollment;

    constructor(enrollment: Enrollment) {
        this.enrollment = enrollment;
    }

    /**
     * Check if {@link JWT_User} is the creator of of the {@link Enrollment}
     *
     * @param user          {@link JWT_User} to check ownership for
     */
    public userIsCreator(user: JWT_User) {
        if (!user) {
            return false;
        }

        return this.enrollment.creatorId === user.sub;
    }
}
