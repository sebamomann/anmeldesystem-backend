import {Column, CreateDateColumn, Entity, JoinColumn, OneToOne} from 'typeorm';
import {Enrollment} from "../../enrollment/enrollment.entity";
import {User} from "../user.entity";

@Entity({name: "telegram_user"})
export class TelegramUser {
    @Column()
    id: string;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column()
    username: string;

    @Column()
    photo_url: string;

    @CreateDateColumn()
    iat: Date;

    @OneToOne(type => User,
        user => user.telegramUser,
        {onDelete: "CASCADE"})
    @JoinColumn()
    enrollment: Enrollment;
}
