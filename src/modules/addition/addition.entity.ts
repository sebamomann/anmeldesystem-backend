import {Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Appointment} from '../appointment/appointment.entity';
import {Exclude} from 'class-transformer';

@Entity()
@Index('index_unique_name_appointment', ['name', 'appointment'], {unique: true}) // first style
export class Addition {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Exclude()
    @ManyToOne(type => Appointment,
        appointment => appointment.additions,
    )
    appointment: Appointment;

    @Column({nullable: false})
    name: string;
}
