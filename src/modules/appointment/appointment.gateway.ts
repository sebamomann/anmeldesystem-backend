import {
    ConnectedSocket,
    GatewayMetadata,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse
} from '@nestjs/websockets';
import {Logger, UseGuards} from '@nestjs/common';
import {Server, Socket} from 'socket.io';
import {Appointment} from './appointment.entity';
import {WsJwtGuard} from '../../auth/jwt-ws-strategy';

export interface GatewayMetadataExtended extends GatewayMetadata {
    handlePreflightRequest: (req, res) => void;
}

const options = {
    handlePreflightRequest: (req, res) => {
        const headers = {
            'Access-Control-Allow-Headers': 'Content-Type, authorization, x-token',
            'Access-Control-Allow-Origin': req.headers.origin,
            'Access-Control-Allow-Credentials': true,
            'Access-Control-Max-Age': '1728000',
            'Content-Length': '0',
        };
        res.writeHead(200, headers);
        res.end();
    },
    namespace: 'appointment',
} as GatewayMetadataExtended;

@WebSocketGateway(options)
export class AppointmentGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() wss: Server;

    private logger: Logger = new Logger('Appointment-Gateway');

    afterInit(server: any): any {
        this.logger.log('Initialized');
    }

    @UseGuards(WsJwtGuard)
    handleConnection(@ConnectedSocket() client: Socket, ...args: any[]): any {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: any): any {
        this.logger.log('Client disconnected: %s', client.id);
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('subscribe-appointment')
    handleSubscription(client: Socket, data: any): WsResponse<string> {
        client.leaveAll();

        client.join(data.appointment.link);

        return {event: 'subscribe-appointment', data: 'success'};
    }

    public appointmentUpdated(appointment: Appointment) {
        this.wss.to(appointment.link).emit('update', appointment.link);
    }
}
