import {Enrollment} from './enrollment.entity';
import {EnrollmentPermissionList} from './enrollmentPermissionList';
import {JWT_User} from '../user/user.model';
import {EnrollmentPermissionChecker} from './enrollmentPermission.checker';
import {EnrollmentMapper} from './enrollment.mapper';
import {UserService} from '../user/user.service';
import {IEnrollmentDTO} from './IEnrollmentDTO';

export class EnrollmentList {
    private list: Enrollment[];

    constructor(list: Enrollment[]) {
        if (list) {
            this.list = list;
        } else {
            this.list = [];
        }
    }

    public getArray(): Enrollment[] {
        return this.list;
    }

    public containsPermittedEnrollment(permissions: EnrollmentPermissionList) {
        for (const fEnrollment of this.list) {
            for (const iPermission of permissions.getArray()) {
                if (iPermission.enrollmentId === fEnrollment.id) {
                    return true;
                }
            }
        }

        return false;
    }

    public containsEnrollmentCreatedByUser(user: JWT_User) {
        return this.list
            .some(
                (sEnrollment: Enrollment) => {
                    const enrollmentPermissionChecker = new EnrollmentPermissionChecker(sEnrollment);
                    return enrollmentPermissionChecker.userIsCreator(user);

                }
            );
    }

    public async getDTOArray(userService: UserService): Promise<IEnrollmentDTO[]> {
        const output: IEnrollmentDTO[] = [];

        const enrollmentMapper = new EnrollmentMapper(userService);

        for (const fEnrollment of this.list) {
            output.push(
                await enrollmentMapper.basic(fEnrollment)
            );
        }

        return output;
    }

    async getPermittedDTOArray(user: JWT_User, permissions: EnrollmentPermissionList, userService: UserService): Promise<IEnrollmentDTO[]> {
        const enrollmentMapper = new EnrollmentMapper(userService);

        const output = [];

        for (const fEnrollment of this.list) {
            const hasEnrollmentPermission = permissions.includesEnrollmentById(fEnrollment.id);

            const enrollmentPermissionChecker = new EnrollmentPermissionChecker(fEnrollment);
            const isEnrollmentCreator = enrollmentPermissionChecker.userIsCreator(user);

            if (hasEnrollmentPermission || isEnrollmentCreator) {
                output.push(await enrollmentMapper.basic(fEnrollment));
            }
        }

        return output;
    }
}
