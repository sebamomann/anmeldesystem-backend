import {Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Appointment} from "../appointment/appointment.entity";
import {Enrollment} from "../enrollment/enrollment.entity";

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
        appointment => appointment.creator,
    )
    appointments: Appointment[];

    @ManyToMany(type => Appointment,
        appointment => appointment.administrators,
        {
            eager: true
        })
    @JoinTable()
    administrations: Appointment[];

    @OneToMany(type => Enrollment,
        enrollment => enrollment.creator)
    enrollments: Enrollment[];
}
