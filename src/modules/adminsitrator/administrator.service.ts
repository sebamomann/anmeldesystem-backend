import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Administrator} from './administrator.entity';
import {Appointment} from '../appointment/appointment.entity';
import {JWT_User} from '../user/user.model';
import {UserService} from '../user/user.service';
import {AppointmentService} from '../appointment/appointment.service';

@Injectable()
export class AdministratorService {
    constructor(@InjectRepository(Administrator)
                private readonly administratorRepository: Repository<Administrator>,
                private readonly userService: UserService,
                private readonly appointmentService: AppointmentService) {
    }

    public async save(administrator: Administrator) {
        return await this.administratorRepository.save(administrator);
    }

    /**
     * Add an {@link Administrator} to a specific {@link Appointment}. <br />
     * Operation can only be executed by the owner of the {@link Appointment}.
     *
     * @param user          {@link JWT_User} Requester (should be owner of {@link Appointment})
     * @param link          Link of {@link Appointment}
     * @param username      Username of user to add as {@link Administrator}
     *
     * @throws See {@link checkForAppointmentExistenceAndOwnershipAndReturnForRelation}
     * @throws See {@link AdministratorList.addAdministrator}
     */
    public async addAdministrator(user: JWT_User, link: string, username: string): Promise<void> {
        const appointment = await this.appointmentService.checkForAppointmentExistenceAndOwnershipAndReturnForRelation(link, user);

        const list = appointment.administrators;
        list.setUserService(this.userService);
        list.setAdministratorService(this);

        await list.addAdministrator(username);
    }

    /**
     * Remove {@link Administrator} from the {@link Appointment}. <br />
     * Operation can only be executed by the owner of the Appointment.
     *
     * @param user          {@link JWT_User} Requester (should be owner of {@link Appointment})
     * @param link          Link of {@link Appointment}
     * @param username      Username of user to add as {@link Administrator}
     *
     * @throws See {@link checkForAppointmentExistenceAndOwnershipAndReturnForRelation}
     * @throws See {@link AdministratorList.removeAdministrator}
     */
    public async removeAdministrator(user: JWT_User, link: string, username: string): Promise<void> {
        const appointment = await this.appointmentService.checkForAppointmentExistenceAndOwnershipAndReturnForRelation(link, user);

        const list = appointment.administrators;
        list.setUserService(this.userService);
        list.setAdministratorService(this);

        await list.removeAdministrator(username);
    }

    public async removeAdministratorByUserIdAndAppointment(userId: string, appointment: Appointment) {
        return await this.administratorRepository
            .delete(
                {
                    userId: userId,
                    appointment: appointment
                }
            );
    }
}
