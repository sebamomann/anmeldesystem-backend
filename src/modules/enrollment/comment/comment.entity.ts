import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Enrollment} from "../enrollment.entity";

@Entity()
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable: false})
    name: string;

    @Column({nullable: false})
    comment: string;

    @ManyToOne(type => Enrollment,
        enrollment => enrollment.comments,
    )
    enrollment: Enrollment;

}
