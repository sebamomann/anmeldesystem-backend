import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {User} from './user.entity';

@Entity()
export class Session {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    refreshToken: string;

    @ManyToOne(() => User, user => user.sessions,
        {
            onUpdate: 'NO ACTION'
        })
    user: User;

    @Column({default: 0})
    times_used: number;

    @Column()
    last_used: Date;

    @CreateDateColumn()
    iat: Date;
}
