import {Column, CreateDateColumn, Entity, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Appointment} from "../appointment/appointment.entity";
import {Enrollment} from "../enrollment/enrollment.entity";
import {TelegramUser} from "./telegram/telegram-user.entity";
import {PasswordReset} from "./password-reset/password-reset.entity";
import {Exclude} from "class-transformer";
import {EmailChange} from "./email-change/email-change.entity";

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
        {
            eager: false
        }
    )
    appointments: Appointment[];

    @ManyToMany(type => Appointment,
        appointment => appointment.administrators,
        {
            eager: false
        })
    administrations: Appointment[];

    @OneToOne(type => TelegramUser,
        telegramUser => telegramUser.user)
    telegramUser: TelegramUser;

    @OneToMany(type => Enrollment,
        enrollment => enrollment.creator)
    enrollments: Enrollment[];

    @OneToMany(type => PasswordReset,
        passwordReset => passwordReset.user,)
    passwordReset: PasswordReset[];

    @OneToMany(type => EmailChange,
        emailChange => emailChange.user,
        {
            eager: true
        })
    emailChange: EmailChange[];

    @CreateDateColumn()
    iat: Date;
}
