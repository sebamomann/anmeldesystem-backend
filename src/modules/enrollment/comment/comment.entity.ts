import {Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import {Enrollment} from "../enrollment.entity";
import {Exclude} from "class-transformer";

@Entity()
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable: false})
    name: string;

    @Column({nullable: false})
    comment: string;

    @ManyToMany(type => Enrollment,
        enrollment => enrollment.comments,
        {
            onDelete: "CASCADE"
        }
    )
    enrollment: Enrollment;

    @CreateDateColumn()
    @Exclude({toPlainOnly: true})
    iat: Date;

    @UpdateDateColumn({name: 'lud', nullable: true})
    @Exclude({toPlainOnly: true})
    lud: Date;
}
