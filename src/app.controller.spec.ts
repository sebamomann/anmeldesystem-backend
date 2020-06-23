import {Test, TestingModule} from '@nestjs/testing';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {AuthService} from './auth/auth.service';
import {User} from './modules/user/user.entity';
import {HttpStatus} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {JWT_MODULE_OPTIONS} from '@nestjs/jwt/dist/jwt.constants';
import {ExtractJwt} from 'passport-jwt';
import {jwtConstants} from './auth/constants';

jest.mock('./auth/auth.service');
jest.mock('@nestjs/jwt');

describe('AppController', () => {
    let authService: AuthService;
    let jwtService: JwtService;

    let appController: AppController;

    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [AppController],
            providers: [
                AppService,
                AuthService,
                JwtService,
                {
                    name: JWT_MODULE_OPTIONS,
                    provide: JWT_MODULE_OPTIONS,
                    useValue: {

                        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                        ignoreExpiration: false,
                        secretOrKey: jwtConstants.secret,
                    }
                }
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);

        appController = module.get<AppController>(AppController);
    });

    it('should be defined', () => {
        expect(appController).toBeDefined();
    });

    describe('* login', () => {
        describe('* successful should return entity of user with valid jwt and 200 status cod', () => {
            it('successful request', async () => {
                const user = new User();
                user.id = '1';
                user.username = 'username';
                user.mail = 'mail@example.com';

                const req: any = {
                    user: user
                };
                const res = mockResponse();

                const result = user;
                result.token = 'token';

                jest.spyOn(authService, 'addJwtToObject').mockReturnValueOnce(result);

                await appController
                    .login(req, res);

                expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith(result);
            });
        });

        describe('* failure should return error and 401 status code', () => {
            it('invalid password - password change', async () => {
                const date = new Date();
                const req: any = {
                    user: date
                };
                const res = mockResponse();

                jest.spyOn(jwtService, 'sign').mockReturnValueOnce('token');

                await appController
                    .login(req, res);

                expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith({
                    code: 'OLD_PASSWORD',
                    message: 'This password has been changed at ' + date,
                    data: date
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

