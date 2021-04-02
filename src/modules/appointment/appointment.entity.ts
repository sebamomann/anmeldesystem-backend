import {Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import {Enrollment} from '../enrollment/enrollment.entity';
import {Addition} from '../addition/addition.entity';
import {File} from '../file/file.entity';
import {Exclude} from 'class-transformer';
import {PushSubscription} from '../push/pushSubscription.entity';
import {IUserMinified} from '../user/IUserMinified';
import {JWT_User} from '../user/user.model';
import {Administrator} from './administrator.entity';
import {Pinner} from './pinner.entity';
import {AdditionList} from '../addition/additionList';

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
    @Column({default: false})
    driverAddition: boolean;
    @OneToMany(type => Administrator,
        administrator => administrator.appointment, {
            eager: true,
            cascade: true
        })
    _administrators: Administrator[];
    @OneToMany(type => Pinner,
        pinner => pinner.appointment, {
            eager: true
        })
    pinners: Administrator[];
    @OneToMany(type => File,
        file => file.appointment,
        {
            eager: true,
        })
    files: File[];
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
    relations?: string[] = [];
    administrators: IUserMinified[] = [];
    numberOfEnrollments?: number;

    @OneToMany(type => Addition,
        addition => addition.appointment,
        {
            eager: true,
            cascade: true,
        })
    _additions: Addition[];

    get additions(): AdditionList {
        return new AdditionList(this._additions);
    }

    set additions(list: AdditionList) {
        this._additions = list.getArray();
    }

    /**
     * Check if {@link JWT_User} is the creator or administrator of this object
     *
     * @param user          {@link JWT_User} to check ownership for
     * @deprecated          Use {@link AppointmentPermissionChecker}
     */
    public isCreatorOrAdministrator(user: JWT_User) {
        const isAppointmentCreator = this.isCreator(user);
        const isAdministrator = this.isAdministrator(user);

        return isAppointmentCreator || isAdministrator;
    }

    /**
     * Check if {@link JWT_User} is the creator of this object
     *
     * @param user          {@link JWT_User} to check ownership for
     * @deprecated          Use {@link AppointmentPermissionChecker}
     */
    public isCreator(user: JWT_User) {
        if (!user) {
            return false;
        }

        return this.creatorId === user.sub;
    }

    /**
     * Check if {@link JWT_User} is administrator of this object
     *
     * @param user          {@link JWT_User} to check ownership for
     * @deprecated          Use {@link AppointmentPermissionChecker}
     */
    public isAdministrator(user: JWT_User) {
        if (!this._administrators) {
            return false;
        }

        if (!user) {
            return false;
        }

        return this._administrators?.some(
            sAdministrator => sAdministrator.userId === user.sub
        );
    }
}
