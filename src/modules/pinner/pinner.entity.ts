import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Appointment} from '../appointment/appointment.entity';

@Entity()
export class Pinner {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(type => Appointment,
        appointment => appointment.pinners)
    appointment: Appointment;

    @Column('uuid')
    userId: string;
}
