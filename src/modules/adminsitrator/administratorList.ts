import {Administrator} from './administrator.entity';
import {UserService} from '../user/user.service';
import {KeycloakUser} from '../user/KeycloakUser';
import {Appointment} from '../appointment/appointment.entity';
import {UserMapper} from '../user/user.mapper';
import {IUserDTO} from '../user/IUserDTO';
import {JWT_User} from '../user/user.model';
import {AdministratorService} from './administrator.service';

export class AdministratorList {
    private userService: UserService;
    private administratorService: AdministratorService;

    private readonly list: Administrator[];
    private readonly appointment: Appointment;

    constructor(list: Administrator[], appointment: Appointment, userService: UserService) {
        if (list) {
            this.list = list;
        } else {
            this.list = [];
        }

        this.userService = userService;
        this.appointment = appointment;
    }

    /**
     * Get the base data structure of this object.
     * Structure is a simple array containing all {@link Administrator} Objects of the {@link Appointment}
     *
     * @return Array of {@link Administrator}
     */
    public getRawArray(): Administrator[] {
        return this.list;
    }

    public setUserService(userService: UserService) {
        this.userService = userService;
    }

    public setAdministratorService(administratorService: AdministratorService) {
        this.administratorService = administratorService;
    }

    /**
     * Add specified user as {@link Administrator} to the {@link Appointment}.
     * {@link Administrator} is unique to this appointment
     *
     * @param username      Username of user to add as {@link Administrator}
     *
     * @throws See {@link UserService.findByUsername}
     *
     */
    public async addAdministrator(username: string): Promise<void> {
        let adminToAdd: KeycloakUser;

        adminToAdd = await this.userService.findByUsername(username);

        const admin = new Administrator();
        admin.userId = adminToAdd.id;
        admin.appointment = this.appointment;

        if (!this.userIsAdministratorKeycloakUser(adminToAdd)) {
            await this.administratorService.save(admin);
        }
    }

    /**
     * TODO
     * If user is deleted in keycloak, he might still be an {@link Administrator}, but can not be removed.
     *
     * Remove {@link Administrator}. Automatically gets removed as {@link Administrator} of the specified {@link Appointment}.<br/>
     * If user was no {@link Administrator} of the {@link Appointment}, just move forward.
     *
     * @param username          Username of {@link Administrator} to remove
     *
     * @throws See {@link UserService.findByUsername}
     */
    public async removeAdministrator(username) {
        let adminUserDataFromKeycloak: KeycloakUser;

        adminUserDataFromKeycloak = await this.userService.findByUsername(username);

        if (this.userIsAdministratorKeycloakUser(adminUserDataFromKeycloak)) {
            await this.administratorService.removeAdministratorByUserIdAndAppointment(adminUserDataFromKeycloak.id, this.appointment);
        }
    }

    /**
     * TODO
     * Single keykloack request possible?
     *
     * Get an array containing all objects of this list in a minified version (as {@link IUserDTO})
     *
     * @return Array of {@link IUserDTO} objects
     */
    public async getMinifiedArray(): Promise<IUserDTO[]> {
        const output: IUserDTO[] = [];

        const userMapper = new UserMapper(this.userService);

        for (const fAdmin of this.getRawArray()) {
            const user: KeycloakUser = await this.userService.findById(fAdmin.userId);
            const minifiedUser = await userMapper.minifyUser(user);

            output.push(minifiedUser);
        }

        return output;
    }

    /**
     * Check if user is an {@link Administrator} of the {@link Appointment}.
     * Check is based on userId
     *
     * @param user      {@link JWT_User} to check
     *
     * @return boolean value representing if user is {@link Administrator} or not
     */
    public userIsAdministrator(user: JWT_User) {
        return this.list
            .some(
                (sAdministrator: Administrator) => {
                    return sAdministrator.userId === user.sub;
                }
            );
    }

    /**
     * Check if user is an {@link Administrator} of the {@link Appointment}.
     * Check is based on userId
     *
     * @param user      {@link KeycloakUser} to check
     *
     * @return boolean value representing if user is {@link Administrator} or not
     */
    public userIsAdministratorKeycloakUser(user: KeycloakUser) {
        return this.list
            .some(
                (sAdministrator: Administrator) => {
                    return sAdministrator.userId === user.id;
                }
            );
    }
}
