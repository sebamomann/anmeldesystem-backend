import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Enrollment} from '../enrollment.entity';

@Entity({name: 'enrollment_mail'})
export class Mail {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    mail: string;

    @OneToOne(type => Enrollment,
        enrollment => enrollment.mail,
        {onDelete: 'CASCADE'})
    @JoinColumn()
    enrollment: Enrollment;
}
