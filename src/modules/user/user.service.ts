import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {User} from "./user.entity";
import {Repository} from 'typeorm';

var bcrypt = require('bcryptjs');

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
    }

    findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    register(user: User): Promise<User> {
        const userToDb = new User();
        userToDb.username = user.username;
        userToDb.mail = user.mail;
        try {
            userToDb.password = bcrypt.hashSync(user.password, 10);
        } catch (e) {
            console.log(e);
        }

        return this.userRepository.save(userToDb);
    }

    async findByEmail(email: string) {
        return this.userRepository.findOne({
            where: {mail: email}
        });
    }
}
