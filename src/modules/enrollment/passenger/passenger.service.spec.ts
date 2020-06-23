import {Test, TestingModule} from '@nestjs/testing';
import {PassengerService} from './passenger.service';
import {MockType, repositoryMockFactory} from '../../user/user.service.spec';
import {Repository} from 'typeorm';
import {getRepositoryToken} from '@nestjs/typeorm';
import {Passenger} from './passenger.entity';

describe('PassengerService', () => {
    let passengerService: PassengerService;

    let passengerRepositoryMock: MockType<Repository<Passenger>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PassengerService,
                {provide: getRepositoryToken(Passenger), useFactory: repositoryMockFactory},],
        }).compile();

        passengerService = module.get<PassengerService>(PassengerService);

        passengerRepositoryMock = module.get(getRepositoryToken(Passenger));
    });

    it('should be defined', () => {
        expect(passengerService).toBeDefined();
    });
});
