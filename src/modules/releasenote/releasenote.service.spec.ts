import {Test, TestingModule} from '@nestjs/testing';
import {ReleasenoteService} from './releasenote.service';

describe('ReleasenoteService', () => {
  let service: ReleasenoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReleasenoteService],
    }).compile();

    service = module.get<ReleasenoteService>(ReleasenoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
