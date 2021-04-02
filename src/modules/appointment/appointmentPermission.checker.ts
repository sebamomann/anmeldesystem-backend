import {Appointment} from './appointment.entity';
import {JWT_User} from '../user/user.model';

export class AppointmentPermissionChecker {
    private appointment;

    constructor(appointment: Appointment) {
        this.appointment = appointment;
    }

    /**
     * Check if {@link JWT_User} is the creator or an {@link Administrator} of the {@link Appointment}
     *
     * @param user          {@link JWT_User} to check ownership for
     */
    public userIsCreatorOrAdministrator(user: JWT_User) {
        const isAppointmentCreator = this.userIsCreator(user);
        const isAdministrator = this.userIsAdministrator(user);

        return isAppointmentCreator || isAdministrator;
    }

    /**
     * Check if {@link JWT_User} is the creator of of the {@link Appointment}
     *
     * @param user          {@link JWT_User} to check ownership for
     */
    public userIsCreator(user: JWT_User) {
        if (!user) {
            return false;
        }

        return this.appointment.creatorId === user.sub;
    }

    /**
     * Check if {@link JWT_User} is administrator of the {@link Appointment}
     *
     * @param user          {@link JWT_User} to check ownership for
     */
    public userIsAdministrator(user: JWT_User) {
        if (!this.appointment._administrators) {
            return false;
        }

        if (!user) {
            return false;
        }

        return this.appointment._administrators?.some(
            sAdministrator => sAdministrator.userId === user.sub
        );
    }
}
