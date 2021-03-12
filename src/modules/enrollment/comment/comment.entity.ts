import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import {Enrollment} from '../enrollment.entity';
import {Exclude} from 'class-transformer';

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
        {
            onDelete: 'CASCADE'
        }
    )
    enrollment: Enrollment;

    @CreateDateColumn()
    iat: Date;

    @UpdateDateColumn({name: 'lud', nullable: true})
    @Exclude({toPlainOnly: true})
    lud: Date;
}
