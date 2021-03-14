export class KeycloakUser {
    public id: string;
    public createdTimestamp: number;
    public username: string;
    public enabled: boolean;
    public totp: boolean;
    public emailVerified: boolean;
    public firstName: string;
    public lastName: string;
    public email: string;
    public disableableCredentialTypes: any[];
    public requiredActions: any[];
    public notBefore: number;
    public access: {
        manageGroupMembership: boolean,
        view: boolean,
        mapRoles: boolean,
        impersonate: boolean,
        manage: boolean
    };
}
