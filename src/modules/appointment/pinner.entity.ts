import {Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm';
import {Appointment} from './appointment.entity';

@Entity()
export class Pinner {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(type => Appointment,
        appointment => appointment.pinners)
    appointment: Appointment;

    @Column('uuid')
    userId: string;
}
