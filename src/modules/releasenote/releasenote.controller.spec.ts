import {Test, TestingModule} from '@nestjs/testing';
import {ReleasenoteController} from './releasenote.controller';

describe('Releasenote Controller', () => {
  let controller: ReleasenoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReleasenoteController],
    }).compile();

    controller = module.get<ReleasenoteController>(ReleasenoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
