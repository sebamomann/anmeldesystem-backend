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
    private clientData = new Map();

    afterInit(server: any): any {
        this.logger.log('Initialized');
    }

    handleConnection(@ConnectedSocket() client: Socket, ...args: any[]): any {
        // const _user = new User();
        // _user.id = user.id;
        // _user.username = user.username;

        // this.clientData.set(client.id, _user);
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: any): any {
        this.logger.log('Client disconnected: %s', client.id);
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('subscribe-appointment')
    handleSubscription(client: Socket, data: any): WsResponse<string> {
        client.join(data.appointment.link);

        if (data.user !== undefined) {
            console.log(`Set user ${data.user.sub} for ${client.id}`);
            data.user.id = data.user.sub;
            delete data.user.sub;

            this.clientData.set(client.id, data.user);
        }

        return {event: 'subscribe-appointment', data: 'success'};
    }

    public appointmentUpdated(appointment: Appointment) {
        // this.wss.to(appointment.link).emit('update', appointment);

        // console.log(this.wss.sockets.adapter.rooms[appointment.link]);

        // const clients = this.wss.sockets.adapter.rooms[appointment.link].sockets;

        // var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

        // for (const clientId in clients) {
        //     const clientSocket = this.wss.sockets.connected[clientId];
        //
        //     clientSocket.emit('update', AppointmentService
        //         .userBasedAppointmentPreparation(appointment, this.clientData.get(clientSocket.id), {}, false));
        // }
    }

}
