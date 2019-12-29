import { Test, TestingModule } from '@nestjs/testing';
import { AdditionService } from './addition.service';

describe('AdditionService', () => {
  let service: AdditionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdditionService],
    }).compile();

    service = module.get<AdditionService>(AdditionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
