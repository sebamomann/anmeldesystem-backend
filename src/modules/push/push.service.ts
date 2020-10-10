import {Injectable} from '@nestjs/common';
import {User} from '../user/user.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {PushSubscription} from './pushSubscription.entity';
import {AppointmentService} from '../appointment/appointment.service';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

const webpush = require('web-push');

const vapidKeys = {
    'publicKey': 'BOKAo9wpa_19qQdQVAUp-6OdrEKyYbQPxrFs2laArGq40LWd3louhtiMplbBsSRjzEDITUHrBdPlt9iVfbViUfE',
    'privateKey': 't9aBVe0bWR-Uk_NI0umvBkEoFBCjPxGPJQQ2b6LAnYs'
};

@Injectable()
export class PushService {
    constructor(
        @InjectRepository(PushSubscription)
        private readonly pusSubscriptionRepository: Repository<PushSubscription>,
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

        let existing_sub: PushSubscription = await this.pusSubscriptionRepository.findOne({
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

            existing_sub = await this.pusSubscriptionRepository.save(pushSubscription);
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

        subscription.appointments.push(appointment);

        return this.pusSubscriptionRepository.save(subscription);
    }

    async sendToAll() {
        const subscriptions = await this.pusSubscriptionRepository.find();

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
}
