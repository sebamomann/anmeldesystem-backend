import {Column, CreateDateColumn, Entity, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Appointment} from "../appointment/appointment.entity";
import {Enrollment} from "../enrollment/enrollment.entity";
import {TelegramUser} from "./telegram/telegram-user.entity";
import {PasswordReset} from "./password-reset/password-reset.entity";
import {Exclude} from "class-transformer";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    name: string;

    @Column({
        unique: true
    })
    username: string;

    @Column({select: true})
    @Exclude({toPlainOnly: true})
    password: string;

    @Column({
        unique: true
    })
    mail: string;

    @Column('smallint', {default: false})
    activated: boolean;

    @OneToMany(type => Appointment,
        appointment => appointment.creator,
    )
    appointments: Appointment[];

    @ManyToMany(type => Appointment,
        appointment => appointment.administrators,
        {
            eager: true
        })
    administrations: Appointment[];

    @OneToMany(type => Enrollment,
        enrollment => enrollment.creator)
    enrollments: Enrollment[];


    @OneToOne(type => TelegramUser,
        telegramUser => telegramUser.user,
        {onDelete: "CASCADE"})
    telegramUser: TelegramUser;

    @OneToMany(type => PasswordReset,
        passwordReset => passwordReset.user,
        {onDelete: "CASCADE"})
    passwordReset: PasswordReset;

    @CreateDateColumn()
    iat: Date;
}
