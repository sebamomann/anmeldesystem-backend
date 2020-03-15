import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {User} from "../user.entity";

@Entity({name: "user_password_change"})
export class PasswordChange {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({default: null})
    oldPassword: string;

    @ManyToOne(type => User,
        user => user.passwordReset)
    user: User;

    @CreateDateColumn()
    iat: Date;
}
