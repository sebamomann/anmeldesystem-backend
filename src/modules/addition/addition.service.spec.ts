import {Test, TestingModule} from '@nestjs/testing';
import {AdditionService} from './addition.service';
import {Appointment} from '../appointment/appointment.entity';
import {Repository} from 'typeorm';
import {MockType, repositoryMockFactory} from '../appointment/appointment.service.spec';
import {getRepositoryToken} from '@nestjs/typeorm';
import {Addition} from './addition.entity';

describe('AdditionService', () => {
    let additionService: AdditionService;

    let module: TestingModule;

    let additionRepositoryMock: MockType<Repository<Addition>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AdditionService,
                {provide: getRepositoryToken(Addition), useFactory: repositoryMockFactory},
            ],
        }).compile();

        additionService = module.get<AdditionService>(AdditionService);

        additionRepositoryMock = module.get(getRepositoryToken(Addition));
    });

    it('should be defined', () => {
        expect(additionService).toBeDefined();
    });

    describe('get by name and appointment', () => {
        it('should return entity if successful', async () => {
            const name = 'addition1';

            const appointment = new Appointment();
            appointment.id = '1';

            const addition = new Addition();
            addition.name = name;
            addition.appointment = appointment;

            additionRepositoryMock.findOne.mockReturnValueOnce(addition);

            const actual = await additionService.findByNameAndAppointment(name, appointment);
            expect(actual).toEqual(addition);
        });
    });
});
