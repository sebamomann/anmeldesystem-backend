import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Enrollment} from "../enrollment/enrollment.entity";

@Entity()
export class Driver {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: "smallint", nullable: false})
    service: number;

    @Column({type: "smallint", nullable: false})
    seats: number;

    @OneToOne(type => Enrollment, enrollment => enrollment.driver)
    @JoinColumn()
    enrollment: Enrollment;
}
