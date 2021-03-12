import {Test, TestingModule} from '@nestjs/testing';
import {AppointmentGateway} from './appointment.gateway';

describe('AppointmentGateway', () => {
    let gateway: AppointmentGateway;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AppointmentGateway],
        }).compile();

        gateway = module.get<AppointmentGateway>(AppointmentGateway);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
