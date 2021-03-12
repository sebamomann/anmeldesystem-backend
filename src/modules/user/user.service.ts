import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {User} from './user.entity';
import {Repository} from 'typeorm';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
    }

    public async __save(user: any) {
        return await this.userRepository.save(user);
    }

    public async findById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({where: {id: id}, relations: ['pinned']});

        if (user === undefined) {
            throw new EntityNotFoundException(null, null, 'user');
        }

        return user;
    }

    public async findByUsername(username: string): Promise<User> { // TODO REIMPLEMENT KEYCLOAK
        const user = await this.userRepository.findOne({where: [{username: username}]});

        if (user === undefined) {
            throw new EntityNotFoundException(null, null, 'user');
        }

        return user;
    }
}
