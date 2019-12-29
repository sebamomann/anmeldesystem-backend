import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Enrollment} from "../enrollment/enrollment.entity";
import {Addition} from "../addition/addition.entity";

@Entity()
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable: false})
    title: string;

    @Column({nullable: false})
    description: string;

    @Column({nullable: false, unique: true})
    link: string;

    @Column({nullable: false})
    location: string;

    @Column('timestamp', {nullable: false})
    date: Date;

    @Column('timestamp', {default: null})
    deadline: Date;

    @Column('int')
    maxEnrollments: number;

    @OneToMany(type => Enrollment,
        enrollment => enrollment.appointment, {
            eager: true
        })
    enrollments: Enrollment[];

    @OneToMany(type => Addition,
        addition => addition.appointment,
        {
            eager: true,
        })
    additions: Addition[];

    @Column('smallint', {default: false})
    driverAddition: boolean;

    // @Column()
    // administrations: User[]

    // @Column()
    // files: File[]

    // @Column()
    // creator: User

}
