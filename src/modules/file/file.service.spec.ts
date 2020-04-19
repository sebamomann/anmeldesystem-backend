import {Test, TestingModule} from '@nestjs/testing';
import {FileService} from './File.service';
import {Repository} from 'typeorm';
import {getRepositoryToken} from '@nestjs/typeorm';
import {File} from './file.entity';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

describe('FileService', () => {
    let fileService: FileService;

    let module: TestingModule;

    let fileRepositoryMock: MockType<Repository<File>>;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [FileService,
                {provide: getRepositoryToken(File), useFactory: repositoryMockFactory},
            ],
        }).compile();

        fileService = module.get<FileService>(FileService);

        fileRepositoryMock = module.get(getRepositoryToken(File));
    });

    it('should be defined', () => {
        expect(fileService).toBeDefined();
    });

    describe('* find file by id', () => {
        describe('* should return entity if successful', () => {
            it('successful', async () => {
                const id = '1';

                const file = new File();
                file.id = id;
                file.data = 'header,data';
                file.name = 'file.pttx';

                fileRepositoryMock.findOne.mockReturnValue(file);

                const actual = await fileService.findById(id);
                expect(actual).toBe(file);
            });
        });

        describe('* failure should return error', () => {
            it('successful', async () => {
                const id = '1';
                fileRepositoryMock.findOne.mockReturnValue(undefined);

                fileService
                    .findById(id)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have gotten an EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(EntityNotFoundException);
                        expect(err.data).toEqual('file');
                    });
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
