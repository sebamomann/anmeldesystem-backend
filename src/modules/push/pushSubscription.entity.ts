import {Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Exclude} from 'class-transformer';
import {User} from '../user/user.entity';
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

    @ManyToOne(type => User, user => user.id)
    @JoinTable({name: 'userId'})
    user?: User;

    @ManyToMany(type => Appointment,
        appointment => appointment.subscriptions,
        {
            eager: true,
        })
    @JoinTable({name: 'appointment_push_subscriptions'})
    appointments: Appointment[];
}
