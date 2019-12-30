import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Exclude} from 'class-transformer';
import {Appointment} from "../appointment/appointment.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    username: string;

    @Column()
    @Exclude({toPlainOnly: true})
    password: string;

    @Column({
        unique: true
    })
    mail: string;

    @Column('smallint')
    activated: boolean;

    @Column({length: 16})
    chat_id: string;

    @OneToMany(type => Appointment,
        appointment => appointment.creator)
    appointments: Appointment[];
}
