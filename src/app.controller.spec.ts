import {Test, TestingModule} from '@nestjs/testing';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {JwtService} from '@nestjs/jwt';

jest.mock('./auth/auth.service');
jest.mock('@nestjs/jwt');

describe('AppController', () => {
    let jwtService: JwtService;

    let appController: AppController;

    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [AppController],
            providers: [
                AppService,
            ],
        }).compile();

        appController = module.get<AppController>(AppController);
    });

    it('should be defined', () => {
        expect(appController).toBeDefined();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });
});
