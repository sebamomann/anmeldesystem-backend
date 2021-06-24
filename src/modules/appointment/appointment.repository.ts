import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Appointment} from './appointment.entity';
import {getRepository, Repository} from 'typeorm';
import {EnrollmentPermissionList} from '../enrollment/enrollmentPermissionList';
import {JWT_User} from '../user/user.model';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

@Injectable()
export class AppointmentRepository {
    constructor(@InjectRepository(Appointment)
                private readonly appointmentRepository: Repository<Appointment>) {
    }

    async getIncludingPermissionAndSlimCheck(link: string, user: JWT_User, enrollmentPermissionList: EnrollmentPermissionList, slim: boolean) {
        let select = ['appointment', 'additions', 'files', 'administrators', 'pinners'];

        let builder = getRepository(Appointment).createQueryBuilder('appointment');

        builder = builder.leftJoinAndSelect('appointment.creator', 'creator')
            .leftJoinAndSelect('appointment.additions', 'additions');

        let hidden = false;

        if (!slim) {
            hidden = await this.appointmentIsHidden(link);

            builder = builder.leftJoinAndSelect('appointment.enrollments', 'enrollments')
                .leftJoinAndSelect('enrollments.passenger', 'enrollment_passenger')
                .leftJoinAndSelect('enrollments.driver', 'enrollment_driver')
                .leftJoinAndSelect('enrollments.additions', 'enrollment_additions');

            select = [...select, 'enrollments', 'enrollment_additions', 'enrollment_passenger', 'enrollment_driver'];

            // data is never selected, if not specified
            builder = builder.leftJoinAndSelect('appointment.files', 'files');
        }

        builder = builder.leftJoinAndSelect('appointment.pinners', 'pinners')
            .leftJoinAndSelect('appointment.administrators', 'administrators');

        builder = builder.where('appointment.link = :link', {link: link});

        if (!slim && hidden) {
            const permittedEnrollmentsIds = enrollmentPermissionList.getPermittedEnrollments();

            builder = builder.andWhere('CASE enrollment.id IN ' +
                'WHEN appointment.creatorId = :creatorId ' +
                'THEN (:...ids) ' +
                'ELSE (0) OR 1=1 ' +
                'END', {creatorId: user?.sub, ids: permittedEnrollmentsIds});
        }

        builder = builder.select(select);
        builder = builder.orderBy('appointment.date', 'DESC');

        const appointment = builder.getOne();

        if (!appointment) {
            throw new EntityNotFoundException(null, null, {
                'attribute': 'link',
                'value': link,
                'message': 'Specified appointment does not exist'
            });
        }

        return appointment;
    }

    private async appointmentIsHidden(link: string): Promise<boolean> {
        const appointment = await getRepository(Appointment)
            .createQueryBuilder('appointment')
            .select(['appointment.hidden'])
            .where('appointment.link = :link', {link})
            .getOne();

        if (!appointment) {
            throw new EntityNotFoundException(null, null, {
                'attribute': 'link',
                'value': link,
                'message': 'Specified appointment does not exist'
            });
        }

        return !!appointment.hidden;
    }

    private async getAppointmentForPermissionCheck(link: string): Promise<Appointment> {
        const appointment = await getRepository(Appointment)
            .createQueryBuilder('appointment')
            .select(['appointment.creatorId', 'administrators.userId'])
            .leftJoinAndSelect('appointment.administrators', 'administrators')
            .where('appointment.link = :link', {link})
            .getOne();

        if (!appointment) {
            throw new EntityNotFoundException(null, null, {
                'attribute': 'link',
                'value': link,
                'message': 'Specified appointment does not exist'
            });
        }

        return appointment;
    }
}
