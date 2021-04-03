import {Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import {Enrollment} from '../enrollment/enrollment.entity';
import {Addition} from '../addition/addition.entity';
import {File} from '../file/file.entity';
import {Exclude} from 'class-transformer';
import {PushSubscription} from '../push/pushSubscription.entity';
import {IUserDTO} from '../user/IUserDTO';
import {JWT_User} from '../user/user.model';
import {Administrator} from '../adminsitrator/administrator.entity';
import {Pinner} from '../pinner/pinner.entity';
import {AdditionList} from '../addition/additionList';
import {AppointmentService} from './appointment.service';
import {GeneratorUtil} from '../../util/generator.util';
import {AlreadyUsedException} from '../../exceptions/AlreadyUsedException';
import {AppointmentUtil} from './appointment.util';
import {UserService} from '../user/user.service';
import {AdministratorList} from '../adminsitrator/administratorList';
import {EnrollmentList} from '../enrollment/enrollmentList';
import {PinnerList} from '../pinner/pinnerList';
import {FileList} from '../file/fileList';

@Entity()
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @Column({nullable: false})
    title: string;
    @Column({nullable: false})
    description: string;
    @Column({nullable: false})
    location: string;
    @Column('boolean', {default: false})
    hidden: boolean;
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
    creator?: IUserDTO;
    relations?: string[] = [];
    // administrators: IUserMinified[] = [];
    numberOfEnrollments?: number;

    constructor(private appointmentService: AppointmentService, private userService: UserService) {
    }

    @OneToMany(type => File,
        file => file.appointment,
        {
            eager: true,
        })
    _files: File[];

    get files(): FileList {
        return new FileList(this._files);
    }

    set files(list: FileList) {
        this._files = list.getArray();
    }

    @OneToMany(type => Pinner,
        pinner => pinner.appointment, {
            eager: true
        })
    _pinners: Administrator[];

    get pinners(): PinnerList {
        return new PinnerList(this._pinners);
    }

    set pinners(list: PinnerList) {
        this._pinners = list.getArray();
    }

    @OneToMany(type => Enrollment,
        enrollment => enrollment.appointment,
        {
            eager: true
        })
    _enrollments: Enrollment[];

    get enrollments() {
        return new EnrollmentList(this._enrollments);
    }

    set enrollments(list: EnrollmentList) {
        this._enrollments = list.getArray();
    }

    @OneToMany(type => Administrator,
        administrator => administrator.appointment, {
            eager: true,
            cascade: true
        })
    _administrators: Administrator[];

    get administrators() {
        return new AdministratorList(this._administrators, this, this.userService);
    }

    set administrators(list: AdministratorList) {
        this._administrators = list.getArray();
    }

    @Column({default: false, name: 'driverAddition'})
    _driverAddition: boolean;

    get driverAddition() {
        return !!this._driverAddition;
    }

    set driverAddition(value: any) {
        this._driverAddition = !!(value);
    }

    @Column('int', {default: null, name: 'maxEnrollments'})
    _maxEnrollments: number;

    get maxEnrollments() {
        return this._maxEnrollments;
    }

    set maxEnrollments(maxEnrollments: number) {
        if (maxEnrollments > 0) {
            this._maxEnrollments = maxEnrollments;
        } else {
            this._maxEnrollments = null;
        }
    }

    @Column('timestamp', {nullable: false, default: () => 'CURRENT_TIMESTAMP', name: 'date'})
    _date: Date;

    get date() {
        return this._date;
    }

    set date(date: Date) {
        AppointmentUtil.handleDateValidation(date, this._deadline);

        this._date = date;
    }

    @Column('timestamp', {default: null, name: 'deadline'})
    _deadline: Date;

    get deadline() {
        return this._deadline;
    }

    set deadline(deadline: Date) {
        AppointmentUtil.handleDeadlineValidation(this._date, deadline);

        this._deadline = deadline;
    }

    @Column({nullable: false, unique: true, name: 'link'})
    _link: string;

    get link() {
        return this._link;
    }

    /**
     * @deprecated DO NOT USE DUE TO MISSING IN USE CHECK. ASYNC SETTER NOT POSSIBLE
     */
    set link(_link: string) {
        throw new Error('DO NOT USE');
    }

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

    public setAppointmentService(appointmentService: AppointmentService) {
        this.appointmentService = appointmentService;
    }

    public async setLink(_link: string): Promise<void> {
        let link = '';

        if (!_link) {
            do {
                link = GeneratorUtil.makeid(5);
            } while (await this.appointmentService.linkInUse(link));
        } else {
            if (await this.appointmentService.linkInUse(_link)) {
                throw new AlreadyUsedException('DUPLICATE_VALUES',
                    'Provided values are already in use', [{
                        'attribute': 'link',
                        'value': _link,
                        'message': 'Value is already in use by other appointment. Specify a different link'
                    }]);
            }

            link = _link;
        }

        this._link = link;

        return Promise.resolve();
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
