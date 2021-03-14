import {Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm';
import {Appointment} from './appointment.entity';

@Entity()
export class Administrator {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(type => Appointment,
        appointment => appointment._administrators)
    appointment: Appointment;

    @Column('uuid')
    userId: string;
}
