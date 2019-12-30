import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Appointment} from "../appointment/appointment.entity";
import {Exclude} from "class-transformer";

@Entity()
// @Index("index_unique_name_appointment", ["name", "appointment", "data"], {unique: true}) // first style
export class File {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Exclude()
    @ManyToOne(type => Appointment,
        appointment => appointment.files,
    )
    appointment: Appointment;

    @Column({nullable: false})
    name: string;

    @Column({type: "blob", nullable: false})
    data: string;
}
