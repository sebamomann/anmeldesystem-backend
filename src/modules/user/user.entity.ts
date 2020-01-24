import {Column, Entity, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Appointment} from "../appointment/appointment.entity";
import {Enrollment} from "../enrollment/enrollment.entity";
import {TelegramUser} from "./telegram/telegram-user.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    username: string;

    @Column({select: false})
    password: string;

    @Column({
        unique: true
    })
    mail: string;

    @Column('smallint')
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
}
