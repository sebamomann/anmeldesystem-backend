import {Test, TestingModule} from '@nestjs/testing';
import {AdditionController} from './addition.controller';

describe('Addition Controller', () => {
    let controller: AdditionController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdditionController],
        }).compile();

        controller = module.get<AdditionController>(AdditionController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
