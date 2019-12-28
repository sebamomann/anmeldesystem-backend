import {Column, Entity, Index, PrimaryGeneratedColumn} from 'typeorm';

@Entity()
@Index("index_unique_name_appointment", ["name", "appointment"], {unique: true}) // first style
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
