import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Appointment} from '../appointment/appointment.entity';

@Entity()
export class File {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(type => Appointment,
        appointment => appointment._files
    )
    appointment: Appointment;

    @Column({nullable: false})
    name: string;

    @Column({type: 'longblob', nullable: false, select: false})
    data: string;
}
