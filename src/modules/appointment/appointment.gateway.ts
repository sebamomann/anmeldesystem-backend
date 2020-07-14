import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse
} from '@nestjs/websockets';
import {Logger} from '@nestjs/common';
import {Server, Socket} from 'socket.io';
import {Appointment} from './appointment.entity';

@WebSocketGateway({namespace: 'appointment'})
export class AppointmentGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() wss: Server;

    private logger: Logger = new Logger('Appointment-Gateway');

    afterInit(server: any): any {
        this.logger.log('Initialized');
    }

    handleConnection(client: any, ...args: any[]): any {
        this.logger.log('Client connected: %s', client.id);
    }

    handleDisconnect(client: any): any {
        this.logger.log('Client disconnected: %s', client.id);
    }

    @SubscribeMessage('subscribe-appointment')
    handleSubscription(client: Socket, data: string): WsResponse<string> {
        client.join(data);

        return {event: 'subscribe-appointment', data: 'success'};
    }

    public appointmentUpdated(appointment: Appointment) {
        this.wss.to(appointment.link).emit('update', appointment);
    }

}
