import {JWT_User} from '../user/user.model';
import {Appointment} from './appointment.entity';
import {instance, mock, spy, verify, when} from 'ts-mockito';
import {Administrator} from '../adminsitrator/administrator.entity';

describe('* Appointment entity', () => {
    describe('* check permission', () => {
        describe('* is creator or administrator', () => {
            describe('* valid permission should return true', () => {
                it('* appointment creator', () => {
                    const mockedUser = mock(JWT_User);

                    const appointment = new Appointment();
                    const mockedAppointmentSpy = spy(appointment);

                    when(mockedAppointmentSpy.isCreator(mockedUser)).thenReturn(true);
                    when(mockedAppointmentSpy.isAdministrator(mockedUser)).thenReturn(false);

                    const actual = appointment.isCreatorOrAdministrator(mockedUser);

                    expect(actual).toBeTruthy();
                    verify(mockedAppointmentSpy.isCreator(mockedUser)).once();
                    verify(mockedAppointmentSpy.isAdministrator(mockedUser)).once();
                });

                it('* appointment administrator', async () => {
                    const mockedUser = mock(JWT_User);

                    const appointment = new Appointment();
                    const mockedAppointmentSpy = spy(appointment);

                    when(mockedAppointmentSpy.isCreator(mockedUser)).thenReturn(false);
                    when(mockedAppointmentSpy.isAdministrator(mockedUser)).thenReturn(true);

                    const actual = appointment.isCreatorOrAdministrator(mockedUser);

                    expect(actual).toBe(true);
                    verify(mockedAppointmentSpy.isCreator(mockedUser)).once();
                    verify(mockedAppointmentSpy.isAdministrator(mockedUser)).once();
                });
            });

            it('* invalid permission should return false', () => {
                const mockedUser = mock(JWT_User);

                const appointment = new Appointment();
                const mockedAppointmentSpy = spy(appointment);

                when(mockedAppointmentSpy.isCreator(mockedUser)).thenReturn(false);
                when(mockedAppointmentSpy.isAdministrator(mockedUser)).thenReturn(false);

                const actual = appointment.isCreatorOrAdministrator(mockedUser);

                expect(actual).toBe(false);
                verify(mockedAppointmentSpy.isCreator(mockedUser)).once();
                verify(mockedAppointmentSpy.isAdministrator(mockedUser)).once();
            });
        });

        describe('* is creator', () => {
            it('* valid should return true', () => {
                const mockedUser = mock(JWT_User);
                const mockedUserInstance = instance(mockedUser);
                mockedUserInstance.sub = 'ab875c28-d229-44f9-ae1c-c35144132d2f';

                const appointment = new Appointment();
                appointment.creatorId = mockedUserInstance.sub;

                const actual = appointment.isCreator(mockedUser);

                expect(actual).toBe(false);
            });

            describe('* invalid should return false', () => {
                it('* different creator', () => {
                    const mockedUser = mock(JWT_User);
                    const mockedUserInstance = instance(mockedUser);
                    mockedUserInstance.sub = 'ab875c28-d229-44f9-ae1c-c35144132d2f';

                    const mockedUser_appointment_creator = mock(JWT_User);
                    const mockedUserInstance_appointment_creator = instance(mockedUser_appointment_creator);
                    mockedUserInstance_appointment_creator.sub = 'e31d3c8d-306b-4fad-850b-3d7b409bebc7';

                    const appointment = new Appointment();
                    appointment.creatorId = mockedUserInstance_appointment_creator.sub;

                    const actual = appointment.isCreator(mockedUser);

                    expect(actual).toBe(false);
                });

                it('* undefined', () => {
                    const mockedUser_appointment_creator = mock(JWT_User);
                    const mockedUserInstance_appointment_creator = instance(mockedUser_appointment_creator);
                    mockedUserInstance_appointment_creator.sub = 'e31d3c8d-306b-4fad-850b-3d7b409bebc7';

                    const appointment = new Appointment();
                    appointment.creatorId = mockedUserInstance_appointment_creator.sub;

                    const actual = appointment.isCreator(undefined);

                    expect(actual).toBe(false);
                });
            });
        });

        describe('* is administrator', () => {
            it('* valid should return true', () => {
                const mockedUser = mock(JWT_User);
                const mockedUserInstance = instance(mockedUser);
                mockedUserInstance.sub = 'ab875c28-d229-44f9-ae1c-c35144132d2f';

                const appointment = new Appointment();

                const mockedAdministrator = mock(Administrator);
                const mockedAdministratorInstance = instance(mockedAdministrator);
                mockedAdministratorInstance.userId = mockedUserInstance.sub;
                mockedAdministratorInstance.appointment = appointment;

                const mockedAdministrator_2 = mock(Administrator);
                const mockedAdministratorInstance_2 = instance(mockedAdministrator_2);
                mockedAdministratorInstance_2.userId = 'any-other-id';
                mockedAdministratorInstance_2.appointment = appointment;

                appointment._administrators = [mockedAdministratorInstance, mockedAdministratorInstance_2];

                const actual = appointment.isAdministrator(mockedUserInstance);

                expect(actual).toBe(true);
            });

            describe('* invalid should return false', () => {
                it('* not in admin list', () => {
                    const mockedUser = mock(JWT_User);
                    const mockedUserInstance = instance(mockedUser);
                    mockedUserInstance.sub = 'ab875c28-d229-44f9-ae1c-c35144132d2f';

                    const mockedUser_admin = mock(JWT_User);
                    const mockedUserInstance_admin = instance(mockedUser_admin);
                    mockedUserInstance_admin.sub = 'a776c0f4-89e4-436f-84c3-8e1f44306c31';

                    const appointment = new Appointment();

                    const mockedAdministrator = mock(Administrator);
                    const mockedAdministratorInstance = instance(mockedAdministrator);
                    mockedAdministratorInstance.userId = "any-other-id";
                    mockedAdministratorInstance.appointment = appointment;

                    appointment._administrators = [mockedAdministratorInstance];

                    const actual = appointment.isAdministrator(mockedUserInstance);

                    expect(actual).toBe(false);
                });

                it('* undefined', () => {
                    const mockedUser_admin = mock(JWT_User);
                    const mockedUserInstance_admin = instance(mockedUser_admin);
                    mockedUserInstance_admin.sub = 'ab875c28-d229-44f9-ae1c-c35144132d2f';

                    const appointment = new Appointment();

                    const mockedAdministrator = mock(Administrator);
                    const mockedAdministratorInstance = instance(mockedAdministrator);
                    mockedAdministratorInstance.userId = mockedUserInstance_admin.sub;
                    mockedAdministratorInstance.appointment = appointment;

                    const mockedAdministrator_2 = mock(Administrator);
                    const mockedAdministratorInstance_2 = instance(mockedAdministrator_2);
                    mockedAdministratorInstance_2.userId = 'any-other-id';
                    mockedAdministratorInstance_2.appointment = appointment;

                    appointment._administrators = [mockedAdministratorInstance, mockedAdministratorInstance_2];

                    const actual = appointment.isAdministrator(undefined);

                    expect(actual).toBe(false);
                });
            });
        });
    });
});
