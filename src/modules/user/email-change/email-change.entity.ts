import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "../user.entity";

@Entity({name: "user_mail_change"})
export class EmailChange {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    token: string;

    @Column({default: null})
    oldMail: string;

    @Column({default: null})
    newMail: string;

    @Column({
        nullable: true,
        default: null
    })
    used: Date;

    @ManyToOne(type => User,
        user => user.emailChange)
    user: User;

    @CreateDateColumn()
    iat: Date;
}
