import {Test, TestingModule} from '@nestjs/testing';
import {ReleasenoteService} from './releasenote.service';
import {Repository} from 'typeorm';
import {Releasenote} from './releasenote.entity';
import {getRepositoryToken} from '@nestjs/typeorm';

describe('ReleasenoteService', () => {
    let releasenoteService: ReleasenoteService;

    let module: TestingModule;

    let releasenoteRepositoryMock: MockType<Repository<Releasenote>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ReleasenoteService,
                {provide: getRepositoryToken(Releasenote), useFactory: repositoryMockFactory},],
        }).compile();

        releasenoteService = module.get<ReleasenoteService>(ReleasenoteService);
        releasenoteRepositoryMock = module.get(getRepositoryToken(Releasenote));
    });

    it('should be defined', () => {
        expect(releasenoteService).toBeDefined();
    });

    describe('* get all', () => {
        describe('* should return array of entities if successful', () => {
            it('successful', async () => {
                const releasenote1 = new Releasenote();
                releasenote1.id = '1';
                const releasenote2 = new Releasenote();
                releasenote2.id = '2';

                releasenoteRepositoryMock.find.mockReturnValue([releasenote1, releasenote2]);

                const actual = await releasenoteService.find();
                expect(actual).toEqual([releasenote1, releasenote2]);
            });
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});

// @ts-ignore
export const repositoryMockFactory: () => MockType<Repository<any>> = jest.fn(() => ({
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockReturnThis(),
    }))
}));

export type MockType<T> = {
    [P in keyof T]: jest.Mock<{}>;
};
