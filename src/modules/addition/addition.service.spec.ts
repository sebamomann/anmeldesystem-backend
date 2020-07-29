import {Test, TestingModule} from '@nestjs/testing';
import {AdditionService} from './addition.service';
import {Appointment} from '../appointment/appointment.entity';
import {Repository} from 'typeorm';
import {MockType, repositoryMockFactory} from '../appointment/appointment.service.spec';
import {getRepositoryToken} from '@nestjs/typeorm';
import {Addition} from './addition.entity';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

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

    describe('* get by id', () => {
        it('* successful should return entity', async () => {
            const __given_id = '5faccdfa-62b8-4cc5-81bd-c001e5804dd7';

            const __existing_addition = new Addition();
            __existing_addition.id = __given_id;
            __existing_addition.name = 'addition';

            additionRepositoryMock.findOne.mockReturnValueOnce(__existing_addition);

            const __expected = __existing_addition;

            const __actual = await additionService.findById(__given_id);
            expect(__actual).toEqual(__expected);
        });

        describe('* failure should return error', () => {
            it('* addition not found', async (done) => {
                const __given_id = '5faccdfa-62b8-4cc5-81bd-c001e5804dd7';

                additionRepositoryMock.findOne.mockReturnValueOnce(undefined);

                try {
                    await additionService.findById(__given_id);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    expect(e.data).toEqual('addition');
                    done();
                }
            });
        });
    });

    describe('* get by name and appointment', () => {
        it('* successful should return entity', async () => {
            const __given_name = 'addition1';

            const __existing_appointment = new Appointment();
            __existing_appointment.id = '1';

            const __existing_addition = new Addition();
            __existing_addition.id = '5faccdfa-62b8-4cc5-81bd-c001e5804dd7';
            __existing_addition.name = __given_name;
            __existing_addition.appointment = __existing_appointment;

            additionRepositoryMock.findOne.mockReturnValueOnce(__existing_addition);

            const __expected = __existing_addition;

            const __actual = await additionService.findByNameAndAppointment(__given_name, __existing_appointment);
            expect(__actual).toEqual(__expected);
        });

        describe('* failure should return error', () => {
            it('* addition not found', async (done) => {
                const __given_name = 'addition1';

                const __existing_appointment = new Appointment();

                additionRepositoryMock.findOne.mockReturnValueOnce(undefined);

                try {
                    await additionService.findByNameAndAppointment(__given_name, __existing_appointment);
                    done.fail(new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException'));
                } catch (e) {
                    expect(e).toBeInstanceOf(EntityNotFoundException);
                    expect(e.data).toEqual('addition');
                    done();
                }
            });
        });
    });
});
