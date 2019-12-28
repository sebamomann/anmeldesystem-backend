import {Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
export class Enrollment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable: false, unique: true})
    name: string;

    @Column({nullable: true})
    comment: string;

    // @Column()
    // comments: Comment[];

    // @Column({nullable: true})
    // driver: Driver;

    // @Column({nullable: true})
    // passenger: Passenger;

    // @Column()
    // additions: Addition[];

    @Column()
    appointment: string;

    @Column({type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
    iat: Date;
}
