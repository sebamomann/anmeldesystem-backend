import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Enrollment} from "../enrollment/enrollment.entity";

@Entity()
export class Passenger {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: "smallint", nullable: false})
    requirement: number;

    @OneToOne(type => Enrollment, enrollment => enrollment.passenger)
    @JoinColumn()
    enrollment: Enrollment;
}
