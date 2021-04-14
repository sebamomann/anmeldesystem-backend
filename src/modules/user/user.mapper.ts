import {IUserDTO} from './IUserDTO';
import {KeycloakUser} from './KeycloakUser';
import {UserService} from './user.service';

export class UserMapper {
    constructor(private readonly userService: UserService) {
    }

    public async getMinifiedUserById(id: string): Promise<IUserDTO> {
        const creator: KeycloakUser = await this.userService.findById(id);

        return this.minifyUser(creator);
    }

    public minifyUser({firstName, lastName, username}: KeycloakUser): IUserDTO {
        return {
            name: firstName + ' ' + lastName,
            username: username
        };
    }
}
