import {Test, TestingModule} from '@nestjs/testing';
import {FileController} from './file.controller';
import {FileService} from './file.service';

jest.mock('./file.service');

describe('File Controller', () => {
    let fileController: FileController;
    let fileService: FileService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FileController],
            providers: [
                FileService,
            ]
        }).compile();

        fileService = module.get<FileService>(FileService);
        fileController = module.get<FileController>(FileController);
    });

    it('should be defined', () => {
        expect(fileController).toBeDefined();
    });

    // describe('* get file for download', () => {
    //     describe('* successful should start auto download', () => {
    //         it('successful request', async () => {
    //             const result = new File();
    //             result.name = 'file.pptx';
    //             result.data = 'header,data';
    //
    //             jest.spyOn(fileService, 'findById')
    //                 .mockImplementation(async (): Promise<File> => Promise.resolve(result));
    //
    //             const mockIdToSatisfyParameter = '1';
    //             const res = mockResponse();
    //
    //             await fileController.getFile(mockIdToSatisfyParameter, res);
    //         });
    //     });
    //
    //     describe('* failure should return error', () => {
    //         it('undefined error', async () => {
    //             const result = new Error();
    //
    //             jest.spyOn(fileService, 'findById')
    //                 .mockImplementation(async (): Promise<File> => Promise.reject(result));
    //
    //             const mockIdToSatisfyParameter = '1';
    //             const res = mockResponse();
    //
    //             await fileController.getFile(mockIdToSatisfyParameter, res)
    //                 .then(() => {
    //                     throw new Error('I have failed you, Anakin.');
    //                 }).catch(err => {
    //                     expect(err).toBeInstanceOf(Error);
    //                 });
    //         });
    //     });
    // });

    afterEach(() => {
        jest.resetAllMocks();
    });
});

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.header = jest.fn().mockReturnValue(res);
    return res;
};
