import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';
import {Exclude} from 'class-transformer';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    username: string;

    @Column()
    @Exclude({toPlainOnly: true})
    password: string;

    @Column({
        unique: true
    })
    mail: string;

    @Column('smallint')
    activated: boolean;

    @Column({length: 16})
    chat_id: string;
}
