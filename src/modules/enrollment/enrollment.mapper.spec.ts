// import {Enrollment} from './enrollment.entity';
// import {Appointment} from '../appointment/appointment.entity';
// import {AppointmentMapper} from '../appointment/appointment.mapper';
// import {JWT_User} from '../user/user.model';
//
describe('* enrolled by user', () => {
    it('* enrollment !created by any user should have attribute "userIsCreator: false"', async () => {
//         const __existing_enrollment = new Enrollment();
//         __existing_enrollment.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
//         __existing_enrollment.name = 'owning user';
//
//         const __given_appointment = new Appointment();
//         __given_appointment.enrollments = [__existing_enrollment];
//
//         const __expected_enrollment = {...__existing_enrollment};
//         __expected_enrollment.createdByUser = false;
//
//         const __expected = [__expected_enrollment];
//
//         const __actual = (AppointmentMapper as any).enrolledByUser(__given_appointment.enrollments);
//         expect(__actual).toEqual(__expected);
    });
//
//     it('* enrollment created by user should have attribute "userIsCreator: true" and containing user information', async () => {
//         const __existing_enrollment_creator = new JWT_User();
//         __existing_enrollment_creator.sub = '96511a3c-cace-4a67-ad0c-436a37038c38';
//         __existing_enrollment_creator.preferred_username = 'enrollment_creator';
//         __existing_enrollment_creator.name = 'enrollment_creator_name';
//
//         const __existing_enrollment = new Enrollment();
//         __existing_enrollment.id = '2ee12ca8-3839-4c83-bd92-ee86d420edee';
//         __existing_enrollment.creator = __existing_enrollment_creator;
//
//         const __given_appointment = new Appointment();
//         __given_appointment.enrollments = [__existing_enrollment];
//
//         const __expected_enrollment = {...__existing_enrollment};
//         __expected_enrollment.creator = ({
//             preferred_username: __existing_enrollment_creator.preferred_username,
//             name: __existing_enrollment_creator.name,
//         } as any);
//         __expected_enrollment.createdByUser = true;
//
//         const __expected = [__expected_enrollment];
//
//         const __actual = (AppointmentMapper as any).enrolledByUser(__given_appointment.enrollments);
//         expect(__actual).toEqual(__expected);
//     });
//
});
