import {Body, Controller, Get, HttpStatus, NotFoundException, Param, Post, Put, Res, UseGuards} from '@nestjs/common';
import {UserService} from './user.service';
import {User} from './user.entity';
import {TelegramUser} from './telegram/telegram-user.entity';
import {Usr} from './user.decorator';
import {AuthGuard} from '@nestjs/passport';
import {AuthService} from '../../auth/auth.service';
import {Response} from 'express';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService, private authService: AuthService) {
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    get(@Usr() user: User,
        @Res() res: Response,) {
        return this.userService
            .get(user)
            .then(result => {
                res.status(HttpStatus.OK).json(result);
            })
            .catch(() => {
                res.status(HttpStatus.GONE).json();
            });
    }

    @Post()
    register(@Body('user') user: User,
             @Body('domain') domain: string,
             @Res() res: Response,) {
        return this.userService
            .register(user, domain)
            .then(result => {
                res.status(HttpStatus.CREATED).json(result);
            })
            .catch(err => {
                this.defaultErrorResponseHandler(err, res);
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

    @Put()
    @UseGuards(AuthGuard('jwt'))
    update(@Usr() user: User,
           @Body() toChange: any,
           @Res() res: Response,) {
        return this.userService
            .update(toChange, user)
            .then(async tUser => {
                tUser = this.authService.addJwtToObject(tUser);
                res.status(HttpStatus.OK).json(tUser);
            })
            .catch(err => {
                let error: any = {};

                if (err.code === 'EMPTY_FIELDS') {
                    error.code = err.code;
                    error.message = 'Due to the mail change you need to provide a domain for the activation call';
                    error.data = err.data;
                } else if (err.code === 'DUPLICATE_ENTRY') {
                    error.code = err.code;
                    error.message = 'Following values are already in use';
                    error.data = err.data;
                } else {
                    let id = this.makeid(10);
                    console.log(`[${(new Date()).toDateString()} ${(new Date()).toTimeString()}] Code: ${id} - ${JSON.stringify(err)}`);

                    error.code = 'UNDEFINED';
                    error.message = 'Some error occurred. Please try again later or contact the support with the appended error Code';
                    error.data = id;
                }

                if (error.code !== 'UNDEFINED') {
                    res.status(HttpStatus.BAD_REQUEST).json(error);
                    return;
                }

                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
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

    @Get('/verify/:mail/:token')
    activate(@Param('mail') mail: string,
             @Param('token') token: string,
             @Res() res: Response) {
        return this.userService
            .activate(mail, token)
            .then(() => {
                res.status(HttpStatus.OK).json();
            })
            .catch(err => {
                let error: any = {};

                if (err.code === 'GONE') {
                    res.status(HttpStatus.GONE).json();
                    return;
                } else if (err.code === 'INVALID') {
                    error.code = err.code;
                    error.message = 'Provided token is not valid';
                    error.data = err.data;

                } else if (err.code === 'USED') {
                    error.code = err.code;
                    error.message = 'User is already verified';
                    error.data = err.data;
                } else {
                    let id = this.makeid(10);
                    console.log(`[${(new Date()).toDateString()} ${(new Date()).toTimeString()}] Code: ${id} - ${JSON.stringify(err)}`);

                    error.code = 'UNDEFINED';
                    error.message = 'Some error occurred. Please try again later or contact the support with the appended error Code';
                    error.data = id;

                    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
                    return;
                }

                res.status(HttpStatus.BAD_REQUEST).json(error);
            });
    }

    private defaultErrorResponseHandler(err, res: Response) {
        let error: any = {};

        if (err.code === 'EMPTY_FIELDS') {
            error.code = err.code;
            error.message = 'Following values need to be provided';
            error.data = err.data;
        } else if (err.code === 'DUPLICATE_ENTRY') {
            error.code = err.code;
            error.message = 'Following values are already in use';
            error.data = err.data;
        } else {
            let id = this.makeid(10);
            console.log(`[${(new Date()).toDateString()} ${(new Date()).toTimeString()}] Code: ${id} - ${JSON.stringify(err)}`);

            error.code = 'UNDEFINED';
            error.message = 'Some error occurred. Please try again later or contact the support with the appended error Code';
            error.data = id;
        }

        if (error.code !== 'UNDEFINED') {
            return res.status(HttpStatus.BAD_REQUEST).json(error);
        }

        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
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
