import {Appointment} from './appointment.entity';
import {JWT_User} from '../user/user.model';
import {AdministratorList} from '../adminsitrator/administratorList';

export class AppointmentPermissionChecker {
    private appointment: Appointment;

    constructor(appointment: Appointment) {
        this.appointment = appointment;
    }

    /**
     * Check if {@link JWT_User} is the creator or an {@link Administrator} of the {@link Appointment}
     *
     * @param user          {@link JWT_User} to check ownership for
     *
     * @return Boolean stating condition
     */
    public userIsCreatorOrAdministrator(user: JWT_User): boolean {
        const isAppointmentCreator = this.userIsCreator(user);
        const isAdministrator = this.userIsAdministrator(user);

        return isAppointmentCreator || isAdministrator;
    }

    /**
     * Check if {@link JWT_User} is the creator of of the {@link Appointment}
     *
     * @param user          {@link JWT_User} to check ownership for
     *
     * @return boolean stating condition
     */
    public userIsCreator(user: JWT_User): boolean {
        if (!user) {
            return false;
        }

        return this.appointment.creatorId === user.sub;
    }

    /**
     * Check if {@link JWT_User} is {@link Administrator} of the {@link Appointment}
     *
     * @param user          {@link JWT_User} to check ownership for
     *
     * @return boolean stating condition
     */
    public userIsAdministrator(user: JWT_User) {
        if (!this.appointment._administrators) {
            return false;
        }

        if (!user) {
            return false;
        }

        const administratorList: AdministratorList = this.appointment.administrators;

        return administratorList.userIsAdministrator(user);
    }
}
