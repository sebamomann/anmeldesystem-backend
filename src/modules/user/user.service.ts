import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {User} from "./user.entity";
import {Repository} from 'typeorm';
import {TelegramUser} from "./telegram/telegram-user.entity";

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

    async findByEmail(email: string): Promise<User | undefined> {
        return this.userRepository.findOne({
            where: {mail: email},
            select: ["id", "username", "mail", "password"]
        });
    }

    async addTelegramUser(telegramUser: TelegramUser, user: User) {
        let userFromDb = await this.find(user.id);
        userFromDb.telegramUser = telegramUser;
        return this.userRepository.save(userFromDb);
    }

    private async find(id: number) {
        return await this.userRepository.findOne({where: {id: id}});
    }
}
