import {IAppointmentCreationAdditionDTO} from './IAppointmentCreationAdditionDTO';
import {IUserDTO} from '../user/IUserDTO';
import {IFileDTO} from '../file/IFileDTO';
import {IEnrollmentDTO} from '../enrollment/IEnrollmentDTO';

export interface IAppointmentDTO {
    relations: string[];
    id: string;
    title: string;

    description: string;
    location: string;
    link: string;
    driverAddition: boolean;
    hidden: boolean;
    date: Date;
    deadline: Date;
    creator: IUserDTO;
    maxEnrollments?: number;

    additions?: IAppointmentCreationAdditionDTO[]
    enrollments?: IEnrollmentDTO[];
    files?: IFileDTO[];
    administrators?: IUserDTO[];

    // creator only
    iat?: Date;
    lud?: Date;
}
