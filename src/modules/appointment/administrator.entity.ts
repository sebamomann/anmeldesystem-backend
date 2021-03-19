import {Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Appointment} from './appointment.entity';

@Entity()
@Index('index_unique_userId_appointment', ['appointment', 'userId'], {unique: true}) // first style
export class Administrator {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(type => Appointment,
        appointment => appointment._administrators)
    appointment: Appointment;

    @Column('uuid')
    userId: string;
}
