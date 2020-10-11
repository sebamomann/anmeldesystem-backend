import {forwardRef, Inject, Injectable} from '@nestjs/common';
import {User} from '../user/user.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {getRepository, Repository} from 'typeorm';
import {PushSubscription} from './pushSubscription.entity';
import {AppointmentService} from '../appointment/appointment.service';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {Appointment} from '../appointment/appointment.entity';

require('dotenv').config();

const webpush = require('web-push');

const vapidKeys = {
    'publicKey': process.env.VAPID_PUBLIC_KEY || 'BMqkFS2ITWunnQCLC8nmJVdhSeJDmw1paOe7XK99dHsSxsCqPp-s1AnQm8ByltY1JFEtW2eZqac6PaXB103Ov2k',
    'privateKey': process.env.VAPID_PRIVATE_KEY || 'zSxHCfCXWtd-6N8ugsDccv8pCQj_j3I4cPuT1XsjBYA'
};

@Injectable()
export class PushService {
    constructor(
        @InjectRepository(PushSubscription)
        private readonly pushSubscriptionRepository: Repository<PushSubscription>,
        @Inject(forwardRef(() => AppointmentService))
        private appointmentService: AppointmentService
    ) {
        webpush.setVapidDetails(
            'mailto:info@go-join.me',
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
    }

    async create(obj: any, user: User) {
        const pushSubscription = new PushSubscription();

        let existing_sub: PushSubscription = await this.pushSubscriptionRepository.findOne({
            where: {
                p256dhp256dh: obj.keys.p256dh,
                endpoint: obj.endpoint
            }
        });

        if (!existing_sub) {
            pushSubscription.endpoint = obj.endpoint;
            pushSubscription.expirationTime = obj.expirationTime;
            pushSubscription.p256dh = obj.keys.p256dh;
            pushSubscription.auth = obj.keys.auth;

            if (user) {
                pushSubscription.user = user;
            }

            existing_sub = await this.pushSubscriptionRepository.save(pushSubscription);
        }

        return existing_sub;
    }

    async subscribeToAppointment(obj: any, user: User) {
        let appointment;

        try {
            appointment = await this.appointmentService.findByLink(obj.appointment.link);
        } catch {
            throw new EntityNotFoundException(null, null, 'appointment');
        }

        const subscription = await this.create(obj.subscription, user);

        if (!subscription.appointments) {
            subscription.appointments = [];
        }

        subscription.appointments.push(appointment);

        if (user) {
            const subscriptions = await this.pushSubscriptionRepository.find({where: {user: {id: user.id}}});
            subscriptions.forEach((fSubscription) => {
                if (!fSubscription.appointments) {
                    fSubscription.appointments = [];
                }
                fSubscription.appointments.push(appointment);
            });

            await this.pushSubscriptionRepository.save(subscriptions);
        }

        return await this.pushSubscriptionRepository.save(subscription);
    }

    async sendToAll() {
        const subscriptions = await this.pushSubscriptionRepository.find();

        const notificationPayload = {
            'notification': {
                'title': 'Test',
                'body': 'Message',
                'vibrate': [100, 50, 100],
                'data': {
                    'testData': '123',
                    'primaryKey': 1
                },
                'actions': [{
                    'action': 'explore',
                    'title': 'Go to the site'
                }]
            }
        };

        return Promise.all(subscriptions.map(sub => {
            let subbb: any = {...sub};
            subbb.keys = {p256dh: sub.p256dh, auth: sub.auth};

            delete sub.p256dh;
            delete sub.auth;

            webpush.sendNotification(
                subbb, JSON.stringify(notificationPayload));
        }));
    }

    async appointmentChanged(appointment: Appointment) {
        const subscriptions = await this.pushSubscriptionRepository.find({
            where: {
                appointment
            }
        });

        const notificationPayload = {
            'notification': {
                'title': appointment.title,
                'body': 'Es gibt Änderungen zu diesem Termin!',
                'vibrate': [50, 50, 50, 100, 200, 200],
                'data': {
                    'link': appointment.link,
                    'primaryKey': 1
                },
                'actions': [{
                    'action': 'openAppointment',
                    'title': 'Ansehen'
                }]
            }
        };

        return Promise.all(subscriptions.map(sub => {
            let subbb: any = {...sub};
            subbb.keys = {p256dh: sub.p256dh, auth: sub.auth};

            delete sub.p256dh;
            delete sub.auth;

            try {
                webpush.sendNotification(
                    subbb, JSON.stringify(notificationPayload));
            } catch (e) {
                console.log(e);
            }
        }));
    }

    async isSubscribed(endpoint: string, link: string, user: User) {
        let appointment;

        try {
            appointment = await this.appointmentService.findByLink(link);
        } catch (e) {
            throw e;
        }

        const directSubscription = await getRepository(PushSubscription)
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.appointments', 'appointments')
            .select(['subscription', 'appointments'])
            .where('subscription.endpoint = :endpoint', {endpoint: endpoint})
            .andWhere('appointments.id = :appointmentId', {appointmentId: appointment.id})
            .getOne();

        let subscriptionAsUser;

        if (user) {
            subscriptionAsUser = await getRepository(PushSubscription)
                .createQueryBuilder('subscription')
                .leftJoinAndSelect('subscription.appointments', 'appointments')
                .leftJoinAndSelect('subscription.user', 'user')
                .select(['subscription', 'appointments', 'user'])
                .where('user.id = :userId', {userId: user.id})
                .andWhere('appointments.id = :appointmentId', {appointmentId: appointment.id})
                .getOne();
        }

        if (!directSubscription && !subscriptionAsUser) {
            throw new EntityNotFoundException();
        }

        return true;
    }

    async unsubscribeFromAppointment(obj: any, user: User) {
        let appointment;

        try {
            appointment = await this.appointmentService.findByLink(obj.appointment.link);
        } catch {
            throw new EntityNotFoundException(null, null, 'appointment');
        }

        const sub = await this.pushSubscriptionRepository.findOne({
            where: {
                endpoint: obj.subscription.endpoint
            }
        });

        if (sub) {
            const index = sub.appointments.findIndex((app) => app.id = appointment.id);
            sub.appointments.splice(index, 1);
            await this.pushSubscriptionRepository.save(sub);
        }

        if (user) {
            await this.appointmentService.removeSubscriptionsByUser(appointment, user);
        }

        return Promise.resolve();
    }
}
