import {Test, TestingModule} from '@nestjs/testing';
import {ReleasenoteController} from './releasenote.controller';
import {ReleasenoteService} from './releasenote.service';
import {HttpStatus} from '@nestjs/common';
import {Releasenote} from './releasenote.entity';

jest.mock('./releasenote.service');

describe('Releasenote Controller', () => {
    let releasenoteService: ReleasenoteService;

    let releasenoteController: ReleasenoteController;

    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [ReleasenoteController],
            providers: [
                ReleasenoteService
            ]
        }).compile();

        releasenoteService = module.get<ReleasenoteService>(ReleasenoteService);
        releasenoteController = module.get<ReleasenoteController>(ReleasenoteController);
    });

    it('should be defined', () => {
        expect(releasenoteController).toBeDefined();
    });

    describe('* find releasenotes', () => {
        describe('* successful should return array with entities of Releasenotes with 200 status code', () => {
            it('successful request', async () => {
                const releasenote1 = new Releasenote();
                releasenote1.id = '1';
                const releasenote2 = new Releasenote();
                releasenote2.id = '2';
                const result = [releasenote1, releasenote2];

                const res = mockResponse();

                jest.spyOn(releasenoteService, 'find')
                    .mockReturnValueOnce(Promise.resolve(result));

                await releasenoteController
                    .find(res);

                expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith(result);
            });
        });

        describe('* failure should return error', () => {
            it('undefined error occurred', async () => {
                const result = new Error();

                const res = mockResponse();

                jest.spyOn(releasenoteService, 'find')
                    .mockReturnValueOnce(Promise.reject(result));

                await releasenoteController
                    .find(res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin.');
                    }).catch((err) => {
                        expect(err).toBe(result);
                    });
            });
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });
});

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
