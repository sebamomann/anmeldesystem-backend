import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {AppointmentService} from '../appointment/appointment.service';
import {Pinner} from './pinner.entity';
import {JWT_User} from '../user/user.model';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

@Injectable()
export class PinService {
    constructor(@InjectRepository(Pinner)
                private pinnerRepository: Repository<Pinner>,
                private readonly appointmentService: AppointmentService) {
    }

    public async hasPinnedAppointment(user: JWT_User, link: string): Promise<Pinner> {
        const pinner = await this.pinnerRepository.createQueryBuilder('pinner')
            .select(['pinner'])
            .leftJoinAndSelect('pinner.appointment', 'appointment')
            .where('pinner.userId = :userId', {userId: user.sub})
            .andWhere('appointment.link = :link', {link})
            .getOne();

        if (!pinner) {
            throw new EntityNotFoundException(null, null, 'pinner');
        }

        return pinner;
    }

    public async pinAppointment(user: JWT_User, link: string) {
        const appointment = await this.appointmentService.getAppointmentWithPinByUser(link, user);

        if (!appointment.pinners.containsPinByUser(user)) {
            const pinner = new Pinner();
            pinner.userId = user.sub;
            pinner.appointment = appointment;

            await this.pinnerRepository.save(pinner);
        }
    }

    public async unpinAppointment(user: JWT_User, link: string) {
        const appointment = await this.appointmentService.getAppointmentWithPinByUser(link, user);

        await this.pinnerRepository.delete({
            userId: user.sub,
            appointment: appointment
        });
    }
}
