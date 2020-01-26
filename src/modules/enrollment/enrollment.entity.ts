import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import {Appointment} from "../appointment/appointment.entity";
import {Addition} from "../addition/addition.entity";
import {Driver} from "./driver/driver.entity";
import {Passenger} from "./passenger/passenger.entity";
import {Comment} from "./comment/comment.entity";
import {User} from "../user/user.entity";
import {Key} from "./key/key.entity";
import {Exclude} from "class-transformer";

@Entity()
@Index("index_unique_name_appointment", ["name", "appointment"], {unique: true}) // first style
export class Enrollment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable: false})
    name: string;

    @Column({nullable: true})
    comment: string;

    @OneToOne(type => Driver, driver => driver.enrollment,
        {
            eager: true,
            onUpdate: "CASCADE",
        })
    driver: Driver;

    @OneToOne(type => Passenger,
        passenger => passenger.enrollment,
        {
            eager: true,
            onUpdate: "CASCADE",
        })
    passenger: Passenger;

    @ManyToMany(type => Addition, {eager: true})
    @JoinTable({name: 'enrollment_addition'})
    additions: Addition[];

    @ManyToOne(type => Appointment,
        appointment => appointment.enrollments)
    appointment: Appointment;

    @ManyToMany(type => Comment,
        comment => comment.enrollment,
        {
            eager: true
        })
    comments: Comment[];

    @CreateDateColumn()
    iat: Date;

    @ManyToOne(type => User,
        {onDelete: "CASCADE"})
    @JoinTable({name: 'enrollment_creator'})
    creator: User;

    @OneToOne(type => Key,
        key => key.enrollment,
        {onDelete: "CASCADE"})
    key: Key;

    @UpdateDateColumn({name: 'lud', nullable: true})
    @Exclude({toPlainOnly: true})
    lud: Date;

    editKey: string;
}
