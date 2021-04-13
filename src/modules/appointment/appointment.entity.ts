import {Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import {File} from '../file/file.entity';
import {Exclude} from 'class-transformer';
import {PushSubscription} from '../push/pushSubscription.entity';
import {IUserDTO} from '../user/IUserDTO';
import {Administrator} from '../adminsitrator/administrator.entity';
import {Pinner} from '../pinner/pinner.entity';
import {AppointmentService} from './appointment.service';
import {GeneratorUtil} from '../../util/generator.util';
import {AlreadyUsedException} from '../../exceptions/AlreadyUsedException';
import {AppointmentUtil} from './appointment.util';
import {UserService} from '../user/user.service';
import {AdministratorList} from '../adminsitrator/administratorList';
import {PinnerList} from '../pinner/pinnerList';
import {FileList} from '../file/fileList';
import {Addition} from '../addition/addition.entity';
import {AdditionList} from '../addition/addition.list';
import {Enrollment} from '../enrollment/enrollment.entity';
import {EnrollmentList} from '../enrollment/enrollmentList';

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

    /* --------------------------- */

    /* --------------------------- */

    @Column({
        default: false,
        name: 'driverAddition'
    })
    _driverAddition: boolean;

    get driverAddition() {
        return !!this._driverAddition;
    }

    set driverAddition(value: any) {
        this._driverAddition = !!(value);
    }

    /* --------------------------- */

    /* --------------------------- */

    @Column('int', {
        default: null,
        name: 'maxEnrollments'
    })
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

    /* --------------------------- */

    /* --------------------------- */

    @Column('timestamp', {
        nullable: false,
        default: () => 'CURRENT_TIMESTAMP',
        name: 'date'
    })
    _date: Date;

    get date() {
        return this._date;
    }

    set date(date: Date) {
        AppointmentUtil.handleDateValidation(date, this._deadline);

        this._date = date;
    }

    /* --------------------------- */

    /* --------------------------- */

    @Column('timestamp',
        {
            default: null,
            name: 'deadline'
        })
    _deadline: Date;

    get deadline() {
        return this._deadline;
    }

    set deadline(deadline: Date) {
        AppointmentUtil.handleDeadlineValidation(this._date, deadline);

        this._deadline = deadline;
    }

    /* --------------------------- */

    /* --------------------------- */

    @Column({
        nullable: false,
        unique: true,
        name: 'link'
    })
    _link: string;

    get link() {
        return this._link;
    }

    /**
     * @deprecated DO NOT USE DUE TO MISSING IN USE CHECK. ASYNC SETTER NOT POSSIBLE. SEE {@link Appointment.setLink}
     */
    set link(_link: string) {
        throw new Error('DO NOT USE');
    }

    /* --------------------------- */

    /* --------------------------- */

    @OneToMany(type => Addition,
        addition => addition.appointment,
        {
            eager: true, // is core information
        })
    _additions: Addition[];

    get additions(): AdditionList {
        return new AdditionList(this._additions);
    }

    set additions(list: AdditionList) {
        this._additions = list.getArray();
    }

    /* --------------------------- */

    /* --------------------------- */

    @OneToMany(type => Enrollment,
        enrollment => enrollment.appointment,
        {
            eager: false
        })
    _enrollments: Enrollment[];

    get enrollments() {
        return new EnrollmentList(this._enrollments);
    }

    set enrollments(list: EnrollmentList) {
        this._enrollments = list.getArray();
    }

    /* --------------------------- */

    /* --------------------------- */

    @OneToMany(type => Administrator,
        administrator => administrator.appointment, {
            eager: true, // like always needed for permission checks
        })
    _administrators: Administrator[];

    get administrators(): AdministratorList {
        return new AdministratorList(this._administrators, this, this.userService);
    }

    set administrators(list: AdministratorList) {
        this._administrators = list.getRawArray();
    }

    /* --------------------------- */

    /* --------------------------- */

    @OneToMany(type => File,
        file => file.appointment,
        {
            eager: false,
        })
    _files: File[];

    get files(): FileList {
        return new FileList(this._files, this);
    }

    set files(list: FileList) {
        this._files = list.getArray();
    }

    /* --------------------------- */

    /* --------------------------- */

    @OneToMany(type => Pinner,
        pinner => pinner.appointment, {
            eager: false,
            cascade: true
        })
    _pinners: Pinner[];

    get pinners(): PinnerList {
        return new PinnerList(this._pinners);
    }

    set pinners(list: PinnerList) {
        this._pinners = list.getArray();
    }

    /* --------------------------- */

    /* --------------------------- */

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

    public setAppointmentService(appointmentService: AppointmentService) {
        this.appointmentService = appointmentService;
    }
}
