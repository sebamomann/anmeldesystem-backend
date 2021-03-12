import {Entity, ManyToMany, OneToMany} from 'typeorm';
import {Appointment} from '../appointment/appointment.entity';
import {Enrollment} from '../enrollment/enrollment.entity';

@Entity()
export class User {
    @OneToMany(type => Appointment,
        appointment => appointment.creator,
        {
            eager: false
        }
    )
    appointments: Appointment[];

    @ManyToMany(type => Appointment,
        appointment => appointment.administrators)
    administrations: Appointment[];

    @ManyToMany(type => Appointment,
        appointment => appointment.pinners,
    )
    pinned: Appointment[];

    @OneToMany(type => Enrollment,
        enrollment => enrollment.creator)
    enrollments: Enrollment[];

    id: string;
    name: string;
    username: string;
}
