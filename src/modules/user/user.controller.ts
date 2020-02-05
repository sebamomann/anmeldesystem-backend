import {Body, Controller, Get, HttpStatus, Param, Post, Put, Res, UseGuards} from '@nestjs/common';
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

    private static passwordresetErrorHandler(err: any, res: Response) {
        let error: any = {};
        if (err.code === 'INVALID' || err.code === 'EXPIRED' || err.code === 'USED' || err.code === 'OUTDATED') {
            error.code = err.code;
            error.message = err.message;
            error.error = err.data;
        }

        return res.status(HttpStatus.BAD_REQUEST).json(error);
    }

    @Post()
    register(@Body('user') user: User,
             @Body('domain') domain: string,
             @Res() res: Response) {
        return this.userService
            .register(user, domain)
            .then(result => {
                return res.status(HttpStatus.CREATED).json(result);
            })
            .catch(err => {
                return this.defaultErrorResponseHandler(err, res);
            });
    }

    @Get('/verify/:mail/:token')
    verifyAccountByEmail(@Param('mail') mail: string,
                         @Param('token') token: string,
                         @Res() res: Response) {
        this.userService
            .verifyAccountByEmail(mail, token)
            .then(result => {
                return res.status(HttpStatus.OK).json();
            })
            .catch(err => {
                console.log(err);
                return UserController.passwordresetErrorHandler(err, res);
            });
    }

    @Post('/passwordreset')
    resetPasswordInit(@Body('mail') mail: string,
                      @Body('domain') domain: string,
                      @Res() res: Response) {
        this.userService
            .resetPasswordInit(mail, domain)
            .then(result => {
                return res.status(HttpStatus.NO_CONTENT).json();
            });
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('/telegram')
    addTelegramUser(@Body() telegramUser: TelegramUser,
                    @Usr() user: User,
                    @Res() res: Response) {
        this.userService
            .addTelegramUser(telegramUser, user)
            .then(result => {
                return res.status(HttpStatus.CREATED).json();
            })
            .catch((err) => {
                return this.defaultErrorResponseHandler(err, res);
            });
    }

    @Put('/passwordreset/:mail/:token')
    setNewPassword(@Param('mail') mail: string,
                   @Param('token') token: string,
                   @Body('password') pass: string,
                   @Res() res: Response) {
        this.userService
            .updatePassword(mail, token, pass)
            .then(result => {
                return res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch(err => {
                return UserController.passwordresetErrorHandler(err, res);
            });
    }

    @Get('/passwordreset/validate/:mail/:token')
    validatePasswordresetToken(@Param('mail') mail: string,
                               @Param('token') token: string,
                               @Res() res: Response) {
        this.userService
            .validatePasswordresetToken(mail, token)
            .then(result => {
                return res.status(HttpStatus.OK).json();
            })
            .catch(err => {
                console.log(err);
                return UserController.passwordresetErrorHandler(err, res);
            });
    }

    private defaultErrorResponseHandler(err, res: Response) {
        let error: any = {};

        if (err.code === 'DUPLICATE_ENTRY'
            || err.code === 'EMPTY_FIELDS') {
            error.code = err.code;
            error.error = err.data
        } else {
            let id = this.makeid(10);
            console.log(`[${(new Date()).toDateString()} ${(new Date()).toTimeString()}] Code: ${id} - ${JSON.stringify(err)}`);

            error.code = "UNDEFINED";
            error.error = {
                message: "Some error occurred. Please try again later or contact the support",
                id: id
            };
        }
        return res.status(HttpStatus.BAD_REQUEST).json(error);
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
