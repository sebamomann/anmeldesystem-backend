import {Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Exclude} from 'class-transformer';
import {Appointment} from '../appointment/appointment.entity';

@Entity()
export class PushSubscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable: false})
    endpoint: string;

    @Column({nullable: false})
    p256dh: string;

    @Column({nullable: true})
    expirationTime: Date;

    @Column({nullable: false})
    auth: string;

    @CreateDateColumn()
    @Exclude({toPlainOnly: true})
    iat: Date;

    @Column({type: 'uuid'})
    userId?: string;

    @ManyToMany(type => Appointment,
        appointment => appointment.subscriptions,
        {
            eager: true,
        })
    @JoinTable({name: 'appointment_push_subscriptions'})
    appointments: Appointment[];
}
