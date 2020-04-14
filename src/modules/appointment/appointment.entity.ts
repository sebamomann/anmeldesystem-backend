import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import {Enrollment} from '../enrollment/enrollment.entity';
import {Addition} from '../addition/addition.entity';
import {File} from '../file/file.entity';
import {User} from '../user/user.entity';
import {Exclude} from 'class-transformer';

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

    @Column('timestamp', {nullable: false, default: () => 'CURRENT_TIMESTAMP'})
    date: Date;

    @Column('timestamp', {default: null})
    deadline: Date;

    @Column('int', {default: null})
    maxEnrollments: number;

    @Column('boolean', {default: false})
    hidden: boolean;

    @OneToMany(type => Enrollment,
        enrollment => enrollment.appointment,
        {
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

    @ManyToMany(type => User,
        user => user.administrations)
    @JoinTable()
    administrators: User[];

    @ManyToMany(type => User,
        user => user.pinned)
    @JoinTable()
    pinners: User[];

    @OneToMany(type => File,
        file => file.appointment,
        {
            eager: true,
        })
    files: File[];

    @ManyToOne(type => User,
        user => user.appointments)
    @JoinColumn()
    creator: User;

    @CreateDateColumn()
    @Exclude({toPlainOnly: true})
    iat: Date;

    @UpdateDateColumn({name: 'lud', nullable: true})
    @Exclude({toPlainOnly: true})
    lud: Date;

    reference?: string[] = [];
    numberOfEnrollments?: number;
}
