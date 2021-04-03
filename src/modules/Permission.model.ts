export class EnrollmentPermission {
    public enrollmentId: string;
    private enrollmentToken: string;

    constructor(enrollmentId: string, enrollmentToken: string) {
        this.enrollmentId = enrollmentId;
        this.enrollmentToken = enrollmentToken;
    }
}
