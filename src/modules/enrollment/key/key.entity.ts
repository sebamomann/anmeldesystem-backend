import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Enrollment} from "../enrollment.entity";

@Entity({name: "enrollment_key"})
export class Key {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: "char", length: 100, nullable: false})
    key: string;

    @OneToOne(type => Enrollment,
        enrollment => enrollment.key)
    @JoinColumn()
    enrollment: Enrollment;
}
