import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
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

    @Column({default: null})
    oldPassword: string;

    @ManyToOne(type => User,
        user => user.passwordReset)
    user: User;

    @CreateDateColumn()
    iat: Date;
}
