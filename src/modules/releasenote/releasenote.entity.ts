import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export class Releasenote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    version: string;

    @Column({type: 'text'})
    data: string;

    @Column({comment: '1=frontend;2=backend'})
    project: number;

    @CreateDateColumn()
    iat: Date;
}
