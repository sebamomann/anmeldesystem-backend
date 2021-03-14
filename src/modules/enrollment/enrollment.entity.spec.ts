import {JWT_User} from '../user/user.model';
import {Appointment} from '../appointment/appointment.entity';
import {Enrollment} from './enrollment.entity';
import {instance, mock, verify, when} from 'ts-mockito';

const crypto = require('crypto');

describe('* Enrollment entity', () => {
    describe('* check permissions', () => {
        describe('* hasPermissionToManipulate', () => {
            describe('* valid permission should return true', () => {
                it('* is permitted by identity', () => {
                    const token = 'INVALID_TOKEN';
                    const mockedUser = mock(JWT_User);

                    const mockedEnrollment = mock(Enrollment);
                    const mockedEnrollmentInstance = instance(mockedEnrollment);
                    when(mockedEnrollment.hasPermissionToManipulate).thenReturn(() => true);
                    when(mockedEnrollment.hasPermissionToManipulateByToken).thenReturn(() => false);

                    const actual = mockedEnrollmentInstance.hasPermissionToManipulate(mockedUser, token);

                    expect(actual).toBeTruthy();
                });

                it('* is permitted by token', () => {
                    const token = 'VALID_TOKEN';
                    const mockedUser = mock(JWT_User);

                    const mockedEnrollment = mock(Enrollment);
                    const mockedEnrollmentInstance = instance(mockedEnrollment);
                    when(mockedEnrollment.hasPermissionToManipulate).thenReturn(() => true);
                    when(mockedEnrollment.hasPermissionToManipulateByToken).thenReturn(() => false);

                    const actual = mockedEnrollmentInstance.hasPermissionToManipulate(mockedUser, token);

                    expect(actual).toBeTruthy();
                });

            });

            it('* failure should return false', async () => {
                const token = 'VALID_TOKEN';
                const mockedUser = mock(JWT_User);

                const mockedEnrollment = mock(Enrollment);
                const mockedEnrollmentInstance = instance(mockedEnrollment);
                when(mockedEnrollment.hasPermissionToManipulate).thenReturn(() => false);
                when(mockedEnrollment.hasPermissionToManipulateByToken).thenReturn(() => false);

                const actual = mockedEnrollmentInstance.hasPermissionToManipulate(mockedUser, token);

                expect(actual).toBeFalsy();
            });
        });

        describe('* permission by identity', () => {
            describe('* valid permission should return true', () => {
                it('* permission via appointment', () => {
                    const mockedUser = mock(JWT_User);
                    const mockedUserInstance = instance(mockedUser);
                    mockedUserInstance.sub = '7efff1cc-a623-459f-b665-90d22446cc49';

                    const mockedUser_enrollment_creator = mock(JWT_User);
                    const mockedUserInstance_enrollment_creator = instance(mockedUser_enrollment_creator);
                    mockedUserInstance_enrollment_creator.sub = '0a93e84c-d0a8-4b6d-ae29-8ea820c992de';

                    const mockedAppointment = mock(Appointment);
                    const mockedAppointmentInstance = instance(mockedAppointment);

                    const enrollment = new Enrollment();
                    enrollment.creatorId = mockedUserInstance_enrollment_creator.sub;
                    enrollment.appointment = mockedAppointmentInstance;

                    when(mockedAppointment.isCreatorOrAdministrator(mockedUserInstance)).thenReturn(true);

                    const actual = enrollment.hasPermissionToManipulateByIdentity(mockedUserInstance);

                    expect(actual).toBeTruthy();
                    verify(mockedAppointment.isCreatorOrAdministrator(mockedUserInstance)).once();
                });

                it('* is enrollment creator', async () => {
                    const mockedUser = mock(JWT_User);
                    const mockedUserInstance = instance(mockedUser);
                    mockedUserInstance.sub = '7efff1cc-a623-459f-b665-90d22446cc49';

                    const mockedAppointment = mock(Appointment);
                    const mockedAppointmentInstance = instance(mockedAppointment);

                    const enrollment = new Enrollment();
                    enrollment.creatorId = mockedUserInstance.sub;
                    enrollment.appointment = mockedAppointmentInstance;

                    when(mockedAppointment.isCreatorOrAdministrator(mockedUserInstance)).thenReturn(false);

                    const actual = enrollment.hasPermissionToManipulateByIdentity(mockedUserInstance);

                    expect(actual).toBeTruthy();
                    verify(mockedAppointment.isCreatorOrAdministrator(mockedUserInstance)).once();
                });
            });

            it('* failure should return false', () => {
                const mockedUser = mock(JWT_User);
                const mockedUserInstance = instance(mockedUser);
                mockedUserInstance.sub = '7efff1cc-a623-459f-b665-90d22446cc49';

                const mockedUser_enrollment_creator = mock(JWT_User);
                const mockedUserInstance_enrollment_creator = instance(mockedUser_enrollment_creator);
                mockedUserInstance_enrollment_creator.sub = '0a93e84c-d0a8-4b6d-ae29-8ea820c992de';

                const mockedAppointment = mock(Appointment);
                const mockedAppointmentInstance = instance(mockedAppointment);

                const enrollment = new Enrollment();
                enrollment.creatorId = mockedUserInstance_enrollment_creator.sub;
                enrollment.appointment = mockedAppointmentInstance;

                when(mockedAppointment.isCreatorOrAdministrator(mockedUserInstance)).thenReturn(false);

                const actual = enrollment.hasPermissionToManipulateByIdentity(mockedUserInstance);

                expect(actual).toBeFalsy();
                verify(mockedAppointment.isCreatorOrAdministrator(mockedUserInstance)).once();
            });
        });

        describe('* permission via token', () => {
            it('* successful should return true', async () => {
                const mockedAppointment = mock(Appointment);
                const mockedAppointmentInstance = instance(mockedAppointment);

                const enrollment = new Enrollment();
                enrollment.id = '171211d6-1146-4c6b-b736-4e3dac52ee30';
                enrollment.appointment = mockedAppointmentInstance;

                const token = crypto.createHash('sha256')
                    .update(enrollment.id + process.env.SALT_ENROLLMENT)
                    .digest('hex');

                const actual = enrollment.hasPermissionToManipulateByToken(token);

                expect(actual).toBeTruthy();
            });

            describe('* failure should return false', () => {
                it('* invalid token', async () => {
                    const mockedAppointment = mock(Appointment);
                    const mockedAppointmentInstance = instance(mockedAppointment);

                    const enrollment = new Enrollment();
                    enrollment.id = '171211d6-1146-4c6b-b736-4e3dac52ee30';
                    enrollment.appointment = mockedAppointmentInstance;

                    const token = 'INVALID_TOKEN';

                    const actual = enrollment.hasPermissionToManipulateByToken(token);

                    expect(actual).toBeFalsy();
                });

                it('* valid token but wrong id', async () => {
                    const mockedAppointment = mock(Appointment);
                    const mockedAppointmentInstance = instance(mockedAppointment);

                    const otherId = 'dd4d3218-3dee-4407-9b51-d3f878c2b427';

                    const enrollment = new Enrollment();
                    enrollment.id = '171211d6-1146-4c6b-b736-4e3dac52ee30';
                    enrollment.appointment = mockedAppointmentInstance;

                    const token = crypto.createHash('sha256')
                        .update(otherId + process.env.SALT_ENROLLMENT)
                        .digest('hex');

                    const actual = enrollment.hasPermissionToManipulateByToken(token);

                    expect(actual).toBeFalsy();
                });
            });
        });
    });
});
