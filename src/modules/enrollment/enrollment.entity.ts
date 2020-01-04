import {
    Column,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import {Appointment} from "../appointment/appointment.entity";
import {Addition} from "../addition/addition.entity";
import {Driver} from "./driver/driver.entity";
import {Passenger} from "./passenger/passenger.entity";
import {Comment} from "./comment/comment.entity";
import {User} from "../user/user.entity";
import {Key} from "./key/key.entity";

@Entity()
@Index("index_unique_name_appointment", ["name", "appointment"], {unique: true}) // first style
export class Enrollment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable: false, unique: true})
    name: string;

    @Column({nullable: true})
    comment: string;

    @OneToOne(type => Driver, driver => driver.enrollment,
        {
            eager: true,
        })
    driver: Driver;

    @OneToOne(type => Passenger,
        passenger => passenger.enrollment,
        {
            eager: true,
            onUpdate: "CASCADE"
        })
    passenger: Passenger;

    @ManyToMany(type => Addition, {eager: true})
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

    @Column({type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
    iat: Date;

    @ManyToMany(type => User)
    @JoinTable({name: 'enrollment_creator'})
    creator: User;

    @OneToOne(type => Key,
        key => key.enrollment)
    key: Key;

    editKey: string;
}
