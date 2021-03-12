import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import {Appointment} from '../appointment/appointment.entity';
import {Addition} from '../addition/addition.entity';
import {Driver} from './driver/driver.entity';
import {Passenger} from './passenger/passenger.entity';
import {Comment} from './comment/comment.entity';
import {Exclude} from 'class-transformer';
import {Mail} from './mail/mail.entity';

@Entity()
@Index('index_unique_name_appointment', ['name', 'appointment', 'creator'], {unique: true}) // first style
export class Enrollment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable: true})
    name: string;

    @Column({nullable: true})
    comment: string;

    @OneToOne(type => Driver, driver => driver.enrollment,
        {
            eager: true,
            onUpdate: 'CASCADE',
        })
    driver: Driver;

    @OneToOne(type => Passenger,
        passenger => passenger.enrollment,
        {
            eager: true,
            onUpdate: 'CASCADE',
        })
    passenger: Passenger;

    @ManyToMany(type => Addition, {
        eager: true,
        onDelete: 'CASCADE'
    })
    @JoinTable({name: 'enrollment_addition'})
    additions: Addition[];

    @ManyToOne(type => Appointment,
        appointment => appointment.enrollments)
    appointment: Appointment;

    @OneToMany(type => Comment,
        comment => comment.enrollment,
        {
            eager: true
        })
    comments: Comment[];

    @Column({nullable: true, type: 'uuid'})
    creatorId: string;

    @OneToOne(type => Mail,
        mail => mail.enrollment,
        {onDelete: 'CASCADE'})
    mail: Mail;

    @CreateDateColumn()
    iat: Date;

    @UpdateDateColumn({name: 'lud', nullable: true})
    @Exclude({toPlainOnly: true})
    lud: Date;

    editKey: string;
    editMail?: string;
    token?: string;
    createdByUser: boolean;
}
