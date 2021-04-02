import {IAppointmentCreationAdditionDTO} from './IAppointmentCreationAdditionDTO';

export interface IAppointmentCreationDTO {
    title: string;
    description: string;
    location: string;
    link?: string;
    driverAddition: boolean;
    date: Date;
    deadline: Date;
    maxEnrollments?: number;
    additions?: IAppointmentCreationAdditionDTO[]
}
