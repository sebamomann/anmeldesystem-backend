import {Column, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Appointment} from "../appointment/appointment.entity";
import {Addition} from "../addition/addition.entity";
import {Driver} from "../driver/driver.entity";
import {Passenger} from "../passenger/passenger.entity";

@Entity()
@Index("index_unique_name_appointment", ["name", "appointment"], {unique: true}) // first style
export class Enrollment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable: false, unique: true})
    name: string;

    @Column({nullable: true})
    comment: string;

    // @Column()
    // comments: Comment[];

    @OneToOne(type => Driver, driver => driver.enrollment)
    @JoinTable()
    driver: Driver;

    @OneToOne(type => Passenger, passenger => passenger.enrollment)
    @JoinTable()
    passenger: Passenger;

    @ManyToMany(type => Addition)
    @JoinTable({name: 'enrollment_addition'})
    additions: Addition[];

    @ManyToOne(type => Appointment,
        appointment => appointment.enrollments)
    appointment: Appointment;

    @Column({type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
    iat: Date;
}
