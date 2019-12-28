import {Body, ClassSerializerInterceptor, Controller, Get, Post, UseInterceptors} from '@nestjs/common';
import {UserService} from "./user.service";
import {User} from "./user.entity";

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {
    }

    @Get()
    @UseInterceptors(ClassSerializerInterceptor)
    findAll(): Promise<User[]> {
        return this.userService.findAll();
    }

    @Post('/register')
    register(@Body() user: User): Promise<User> {
        return this.userService.register(user);
    }
}
