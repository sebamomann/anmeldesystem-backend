import {Addition} from '../addition/addition.entity';
import {IUserDTO} from '../user/IUserDTO';

export interface IEnrollmentDTO {
    id: string;
    name: string;
    comment: string;
    // "driver":  ##REPLACE_SCHEMA(schema_driver)##,
    // "passenger": ##REPLACE_SCHEMA(schema_passenger)##,
    additions: Addition[];
    creator: IUserDTO,
    iat: Date
}
