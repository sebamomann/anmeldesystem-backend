import {Administrator} from './administrator.entity';
import {UserService} from '../user/user.service';
import {KeycloakUser} from '../user/KeycloakUser';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {Appointment} from '../appointment/appointment.entity';
import {UserMapper} from '../user/user.mapper';
import {IUserDTO} from '../user/IUserDTO';
import {JWT_User} from '../user/user.model';

export class AdministratorList {
    private userService: UserService;

    private readonly list: Administrator[];
    private appointment: Appointment;

    constructor(list: Administrator[], appointment: Appointment, userService: UserService) {
        if (list) {
            this.list = list;
        } else {
            this.list = [];
        }

        this.userService = userService;
        this.appointment = appointment;
    }

    public setUserService(userService: UserService) {
        this.userService = userService;
    }

    public async addAdministrator(username: string): Promise<void> {
        let adminToAdd: KeycloakUser;

        try {
            adminToAdd = await this.userService.findByUsername(username);
        } catch (e) {
            throw new EntityNotFoundException(null, null, {
                'attribute': 'username',
                'in': 'body',
                'value': username
            });
        }

        const admin = new Administrator();
        admin.userId = adminToAdd.id;

        if (this.appointment._administrators.some((iAdmin) => iAdmin.userId === admin.userId)) {
            throw new DuplicateValueException('DUPLICATE_ENTRY',
                'Following values are duplicates and can not be used',
                [{
                    'attribute': 'username',
                    'in': 'body',
                    'value': username,
                    'message': 'The specified user is already an administrator of this appointment'
                }]);
        }

        this.appointment._administrators.push(admin);
    }

    public getArray(): Administrator[] {
        return this.list;
    }

    public async getMinifiedArray(): Promise<IUserDTO[]> {
        const output: IUserDTO[] = [];

        const userMapper = new UserMapper(this.userService);

        for (const fAdmin of this.getArray()) {
            const user: KeycloakUser = await this.userService.findById(fAdmin.userId);
            const minifiedUser = await userMapper.minifyUser(user);

            output.push(minifiedUser);
        }

        return output;
    }

    public userIsAdministrator(user: JWT_User) {
        return this.list
            .some(
                (sAdministrator: Administrator) => {
                    return sAdministrator.userId === user.sub;
                }
            );
    }
}
