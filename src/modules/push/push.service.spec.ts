// import {Test, TestingModule} from '@nestjs/testing';
// import {PushService} from './push.service';
// import {AppointmentService} from '../appointment/appointment.service';
// import {getRepositoryToken} from '@nestjs/typeorm';
// import {PushSubscription} from './pushSubscription.entity';
// import {repositoryMockFactory} from '../appointment/appointment.service.spec';
//
// describe('PushService', () => {
//     let service: PushService;
//
//     beforeEach(async () => {
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [PushService,
//                 AppointmentService,
//                 {provide: getRepositoryToken(PushSubscription), useFactory: repositoryMockFactory},],
//         }).compile();
//
//         service = module.get<PushService>(PushService);
//     });
//
//     it('should be defined', () => {
//         expect(service).toBeDefined();
//     });
// });
