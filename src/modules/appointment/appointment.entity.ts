import {Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import {Enrollment} from '../enrollment/enrollment.entity';
import {Addition} from '../addition/addition.entity';
import {File} from '../file/file.entity';
import {Exclude} from 'class-transformer';
import {PushSubscription} from '../push/pushSubscription.entity';
import {IUserMinified} from '../user/IUserMinified';
import {User} from '../user/user.model';

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

    @Column({default: false})
    driverAddition: boolean;

    @ManyToMany(type => String)
    @Column({name: 'administrators'})
    _administrators: string[];

    @ManyToMany(type => String)
    pinners: string[];

    @OneToMany(type => File,
        file => file.appointment,
        {
            eager: true,
        })
    files: File[] = [];

    @Column({nullable: true, type: 'uuid'})
    creatorId: string;

    @CreateDateColumn()
    @Exclude({toPlainOnly: true})
    iat: Date;

    @UpdateDateColumn({name: 'lud', nullable: true})
    @Exclude({toPlainOnly: true})
    lud: Date;

    @ManyToMany(type => PushSubscription,
        pushSubscription => pushSubscription.appointments)
    subscriptions: PushSubscription[];

    creator?: IUserMinified;
    reference?: string[] = [];
    administrators: IUserMinified[] = [];
    numberOfEnrollments?: number;

    /**
     * Check if {@link User} is the creator or administrator of this object
     *
     * @param user          {@link User} to check ownership for
     */
    public isCreatorOrAdministrator(user: User) {
        const isAppointmentCreator = this.isCreator(user);
        const isAdministrator = this.isAdministrator(user);

        return isAppointmentCreator || isAdministrator;
    }

    /**
     * Check if {@link User} is the creator of this object
     *
     * @param user          {@link User} to check ownership for
     */
    public isCreator(user: User) {
        if (!user) {
            return false;
        }

        return this.creatorId === user.sub;
    }

    /**
     * Check if {@link User} is administrator of this object
     *
     * @param user          {@link User} to check ownership for
     */
    public isAdministrator(user: User) {
        if (!this._administrators) {
            return false;
        }

        if (!user) {
            return false;
        }

        return this._administrators?.some(
            sAdministrator => sAdministrator === user.sub
        );
    }
}
