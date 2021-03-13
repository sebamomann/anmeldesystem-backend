import {Injectable, NotImplementedException} from '@nestjs/common';
import {User} from './user.model';

@Injectable()
export class UserService {

    constructor() {
    }

    public async __save(user: any) {
    }

    public async findById(id: string): Promise<User> {
        throw new NotImplementedException();
    }

    public async findByUsername(username: string): Promise<User> { // TODO REIMPLEMENT KEYCLOAK
        throw new NotImplementedException();
    }
}
