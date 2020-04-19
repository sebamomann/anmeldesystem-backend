import {Test, TestingModule} from '@nestjs/testing';
import {DriverService} from './driver.service';
import {Repository} from 'typeorm';
import {MockType, repositoryMockFactory} from '../../user/user.service.spec';
import {Driver} from './driver.entity';
import {getRepositoryToken} from '@nestjs/typeorm';

describe('DriverService', () => {
    let driverService: DriverService;

    let driverRepositoryMock: MockType<Repository<Driver>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DriverService,
                {provide: getRepositoryToken(Driver), useFactory: repositoryMockFactory},],
        }).compile();

        driverService = module.get<DriverService>(DriverService);

        driverRepositoryMock = module.get(getRepositoryToken(Driver));
    });

    it('should be defined', () => {
        expect(driverService).toBeDefined();
    });
});
