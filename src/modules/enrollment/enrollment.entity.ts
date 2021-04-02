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
import {JWT_User} from '../user/user.model';
import {AppointmentPermissionChecker} from '../appointment/appointmentPermission.checker';

const crypto = require('crypto');

@Entity()
@Index('index_unique_name_appointment', ['name', 'appointment'], {unique: true}) // first style
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

    creator: any; // TODO MIN OBJECT

    /**
     * Check if {@link JWT_User} is allowed to manipulate this object.<br/>
     * <ol>
     *  <li> Allowed because {@link JWT_User} is authenticated and has permission</li>
     *  <li> Allowed because authorization token for {@link Enrollment} is provided</li>
     * </ol>
     *
     * @param user              {@link JWT_User} to check permission for (might be undefined -> token provided)
     * @param token             Authorization token (might be undefined -> authenticated {@link JWT_User})
     */
    public hasPermissionToManipulate(user: JWT_User, token: string) {
        let allowedByIdentity = this.hasPermissionToManipulateByIdentity(user);
        let allowedByToken = this.hasPermissionToManipulateByToken(token);

        return allowedByIdentity || allowedByToken;
    }

    /**
     * Check if passed authorization token grants permission to edit<br/>
     *
     * @param token             Authorization token to validate
     */
    public hasPermissionToManipulateByToken(token: string) {
        if (!token) {
            return false;
        }

        const validationToken = crypto.createHash('sha256')
            .update(this.id + process.env.SALT_ENROLLMENT)
            .digest('hex');

        return (token.replace(' ', '+') === validationToken);
    }

    /**
     * Check if passed {@link JWT_User} is allowed to manipulate this object<br/>
     * <ol>
     *  <li> Allowed because {@link JWT_User} is creator</li>
     *  <li> Allowed because {@link JWT_User} is creator of {@link Appointment}</li>
     *  <li> Allowed because {@link JWT_User} is admin of {@link Appointment}</li>
     * </ol>
     *
     * @param user          {@link JWT_User} to check permission for
     */
    public hasPermissionToManipulateByIdentity(user: JWT_User) {
        const appointmentPermissionChecker = new AppointmentPermissionChecker(this.appointment);
        let isAllowedByAppointmentPermission = appointmentPermissionChecker.userIsCreatorOrAdministrator(user);
        let isCreatorOfEnrollment = this.isCreator(user);

        return isAllowedByAppointmentPermission || isCreatorOfEnrollment;
    }

    /**
     * Check if provided {@link JWT_User} is the creator if the enrollment
     *
     * @param user          {@link JWT_User} to check for being creator
     */
    private isCreator(user: JWT_User) {
        if (!user) {
            return false;
        }

        return this.creatorId && this.creatorId === user.sub;
    }
}
