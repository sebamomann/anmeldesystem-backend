import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    Put,
    Res,
    UseGuards
} from '@nestjs/common';
import {UserService} from "./user.service";
import {User} from "./user.entity";
import {TelegramUser} from "./telegram/telegram-user.entity";
import {Usr} from "./user.decorator";
import {AuthGuard} from "@nestjs/passport";
import {Response} from "express";
import {AuthService} from "../../auth/auth.service";

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService, private authService: AuthService) {
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    findAll(@Usr() user: User,
            @Res() res: Response) {
        return this.userService
            .get(user)
            .then(result => {
                res.status(200).json(result);
            })
            .catch(err => {

            });
    }

    static passwordresetErrorHandler(err: any, res: Response) {
        if (err instanceof NotFoundException) {
            return err;
        }

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

    @Put()
    @UseGuards(AuthGuard('jwt'))
    update(@Body() toChange: any,
           @Res() res: Response,
           @Usr() user: User) {
        return this.userService
            .update(toChange, user)
            .then(async tUser => {
                tUser = await this.authService.login(tUser);
                res.status(HttpStatus.OK).json(tUser);
            })
            .catch((err) => {
                console.log(err);

                let error = {code: '', error: {}};
                if (err.code === 'DUPLICATE_ENTRY') {
                    error.code = 'ER_DUP_ENTRY';
                    error.error = {
                        columns: err.data
                    };
                } else if (err instanceof NotFoundException
                    || err instanceof ForbiddenException) {
                    throw err
                } else {
                    error.error = {
                        undefined: {
                            message: "Some error occurred. Please try again later or contact the support",
                            error: err
                        }
                    };
                }

                res.status(HttpStatus.BAD_REQUEST).json(error);
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

    @Get('/mail/verify/:mail/:token')
    verifyMailChange(@Param('mail') mail: string,
                     @Param('token') token: string,
                     @Res() res: Response) {
        this.userService
            .verifyMailChange(mail, token)
            .then(result => {
                return res.status(HttpStatus.OK).json();
            })
            .catch(err => {
                return UserController.passwordresetErrorHandler(err, res);
            });
    }

    @Post('/mail/change/resend')
    @UseGuards(AuthGuard('jwt'))
    resendMailChange(@Body('domain') domain: string,
                     @Usr() user: User,
                     @Res() res: Response) {
        this.userService
            .resendMailChange(user, domain)
            .then(result => {
                return res.status(HttpStatus.OK).json();
            })
            .catch(err => {
                console.log(err);
            });
    }

    @Get('/mail/change/cancel')
    @UseGuards(AuthGuard('jwt'))
    cancelMailChange(@Usr() user: User,
                     @Res() res: Response) {
        this.userService
            .cancelMailChange(user)
            .then(result => {
                return res.status(HttpStatus.OK).json();
            })
            .catch(err => {
                console.log(err);
            });
    }


    private defaultErrorResponseHandler(err, res: Response) {
        let error: any = {};

        if (err.code === 'EMPTY_FIELDS') {
            error.code = err.code;
            error.error = err.data
        } else if (err.code === 'DUPLICATE_ENTRY') {
            error.code = 'ER_DUP_ENTRY';
            error.error = {
                columns: err.data
            };
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
