import {EnrollmentPermissionTokenGeneratorUtil} from './enrollmentPermissionTokenGenerator.util';
import {EnrollmentPermission} from '../Permission.model';

export class EnrollmentPermissionList {
    private list: EnrollmentPermission[];

    constructor(permissions: any) {
        this.parsePermissions(permissions);
    }

    public getArray(): EnrollmentPermission[] {
        return this.list;
    }

    public includesEnrollmentById(id: string): boolean {
        return this.list
            .some(
                (sPermission) => {
                    return sPermission.enrollmentId === id;
                }
            );
    }

    public getPermittedEnrollments(): string[] {
        const output = [];

        this.list
            .forEach(
                (fPermission: EnrollmentPermission) => {
                    output.push(fPermission.enrollmentId);
                }
            );

        return output;
    }

    private parsePermissions(permissions: any) {
        const {extractedIds, extractedTokens} = this.filterIdsAndTokens(permissions);

        const enrollmentPermissionTokenGenerator = new EnrollmentPermissionTokenGeneratorUtil();

        this.list = this.validateTokens(extractedIds, enrollmentPermissionTokenGenerator, extractedTokens);
    }

    private validateTokens(extractedIds: string[], enrollmentPermissionTokenGenerator: EnrollmentPermissionTokenGeneratorUtil, extractedTokens: string[]): EnrollmentPermission[] {
        let validPermissions = [];

        extractedIds.forEach(
            (fId, i) => {
                const validationToken = enrollmentPermissionTokenGenerator.generateToken(fId);

                if (extractedTokens[i] !== undefined
                    && validationToken === extractedTokens[i].replace(' ', '+')) {

                    const enrollmentPermission = new EnrollmentPermission(fId, validationToken);

                    validPermissions.push(enrollmentPermission);
                }
            });

        return validPermissions;
    }

    private filterIdsAndTokens(permissions: {}): { extractedIds: string[], extractedTokens: string[] } {
        let extractedIds = [];
        let extractedTokens = [];

        for (const queryKey of Object.keys(permissions)) {
            if (queryKey.startsWith('perm')) {
                extractedIds.push(permissions[queryKey]);
            } else if (queryKey.startsWith('token')) {
                extractedTokens.push(permissions[queryKey]);
            }
        }

        return {extractedIds, extractedTokens};
    }
}
