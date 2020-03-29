import {Test, TestingModule} from '@nestjs/testing';
import {UserController} from './user.controller';
import {User} from "./user.entity";

import {UserService} from "./user.service";
import {AuthService} from "../../auth/auth.service";
import {HttpStatus, NotFoundException} from "@nestjs/common";

jest.mock("./user.service");
jest.mock("../../auth/auth.service");

describe('User Controller', () => {
    let authService: AuthService;
    let userService: UserService;

    let userController: UserController;

    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                UserService,
                AuthService
            ]
        }).compile();

        userService = module.get<UserService>(UserService);
        authService = module.get<AuthService>(AuthService);
        userController = module.get<UserController>(UserController);
    });

    describe("* find user by ID (ID would be retrieved from JWT)", () => {
        it("should return an entity of user with 200 status code if successful", async () => {
            const result = new User();

            jest.spyOn(userService, "get")
                .mockImplementation(async (): Promise<User> => Promise.resolve(result));

            const res = mockResponse();

            await userController.get(new User(), res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(result);
        });

        it("should return error with 410 status code if failed", async () => {
            const result = new NotFoundException();

            jest.spyOn(userService, "get")
                .mockImplementation(async (): Promise<User> => Promise.reject(result));

            const res = mockResponse();

            await userController.get(new User(), res);
            expect(res.status).toHaveBeenCalledWith(HttpStatus.GONE);
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
});
