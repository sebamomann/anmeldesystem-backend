import {Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Appointment} from "../appointment/appointment.entity";

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

    @Column({length: 16})
    chat_id: string;

    @OneToMany(type => Appointment,
        appointment => appointment.creator)
    appointments: Appointment[];

    @ManyToMany(type => Appointment,
        appointment => appointment.administrators)
    @JoinTable()
    administrations: Appointment[];
}
