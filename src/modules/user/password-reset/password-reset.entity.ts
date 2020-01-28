import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {User} from "../user.entity";

@Entity({name: "user_password_reset"})
export class PasswordReset {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    token: string;

    @Column({
        nullable: true,
        default: null
    })
    used: Date;

    @CreateDateColumn()
    iat: Date;

    @ManyToOne(type => User,
        user => user.telegramUser,
        {onDelete: "CASCADE"})
    @JoinColumn()
    user: User;

    @Column({default: null})
    oldPassword: string;

    @Column({default: true})
    valid: boolean
}
