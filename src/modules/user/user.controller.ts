import {Body, Controller, HttpStatus, Post, Res, UseGuards} from '@nestjs/common';
import {UserService} from "./user.service";
import {User} from "./user.entity";
import {TelegramUser} from "./telegram/telegram-user.entity";
import {Usr} from "./user.decorator";
import {AuthGuard} from "@nestjs/passport";
import {Response} from "express";

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService,) {
    }

    // @Get()
    // @UseInterceptors(ClassSerializerInterceptor)
    // findAll(): Promise<User[]> {
    //     return this.userService.findAll();
    // }

    @Post('/register')
    register(@Body() user: User): Promise<User> {
        return this.userService.register(user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('/telegram')
    addTelegramUser(@Body() telegramUser: TelegramUser, @Usr() user: User, @Res() res: Response) {
        this.userService
            .addTelegramUser(telegramUser, user)
            .then(result => {
                return res.status(HttpStatus.CREATED).json();
            })
            .catch((err) => {
                let id = this.makeid(10);
                console.log(`[${(new Date()).toDateString()} ${(new Date()).toTimeString()}] Code: ${id} - ${JSON.stringify(err)}`);

                err.code = "UNDEFINED";
                err.error = {
                    message: "Some error occurred. Please try again later or contact the support",
                    id: id
                };
                return res.status(HttpStatus.BAD_REQUEST).json();
            });
    }

    makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
