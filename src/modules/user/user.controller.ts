import {Body, Controller, Get, HttpStatus, Param, Post, Put, Res, UnauthorizedException, UseGuards} from '@nestjs/common';
import {UserService} from './user.service';
import {User} from './user.entity';
import {Usr} from './user.decorator';
import {AuthGuard} from '@nestjs/passport';
import {AuthService} from '../../auth/auth.service';
import {Response} from 'express';
import {Responses} from '../../util/responses.util';

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
                let error: any = {};

                if (err.code === 'DUPLICATE_ENTRY') {
                    error.code = err.code;
                    error.message = 'Following values are already in use';
                    error.data = err.data;
                } else {
                    Responses.undefinedErrorResponse(err, error, res);
                    return;
                }

                res.status(HttpStatus.BAD_REQUEST).json(error);
            });
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
                    Responses.undefinedErrorResponse(err, error, res);
                    return;
                }

                res.status(HttpStatus.BAD_REQUEST).json(error);
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
                    Responses.undefinedErrorResponse(err, error, res);
                    return;
                }

                res.status(HttpStatus.BAD_REQUEST).json(error);
            });
    }

    @Post('/passwordreset')
    resetPasswordInitialization(@Body('mail') mail: string,
                                @Body('domain') domain: string,
                                @Res() res: Response) {
        return this.userService
            .resetPasswordInitialization(mail, domain)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch((err) => {
                let error: any = {};

                Responses.undefinedErrorResponse(err, error, res);
                return;
            });
    }

    @Get('/passwordreset/validate/:mail/:token')
    resetPasswordTokenVerification(@Param('mail') mail: string,
                                   @Param('token') token: string,
                                   @Res() res: Response) {
        return this.userService
            .resetPasswordTokenVerification(mail, token)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch(err => {
                let error: any = {};

                if (err.code === 'INVALID') {
                    error.code = err.code;
                    error.message = 'Provided token is not valid';
                    error.data = err.data;
                } else if (err.code === 'EXPIRED') {
                    error.code = err.code;
                    error.message = 'Provided token expired';
                    error.data = err.data;
                } else if (err.code === 'USED') {
                    error.code = err.code;
                    error.message = 'User is already verified';
                    error.data = err.data;
                } else if (err.code === 'OUTDATED') {
                    error.code = err.code;
                    error.message = 'Provided token was already replaced by a new one';
                    error.data = err.data;
                } else {
                    Responses.undefinedErrorResponse(err, error, res);
                    return;
                }

                res.status(HttpStatus.BAD_REQUEST).json(error);
            });
    }

    @Put('/passwordreset/:mail/:token')
    resetPassword(@Param('mail') mail: string,
                  @Param('token') token: string,
                  @Body('password') pass: string,
                  @Res() res: Response) {
        return this.userService
            .updatePassword(mail, token, pass)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch(err => {
                let error: any = {};

                if (err instanceof UnauthorizedException) {
                    throw new UnauthorizedException();
                } else {
                    Responses.undefinedErrorResponse(err, error, res);
                    return;
                }
            });
    }

    @Get('/mail/verify/:mail/:token')
    mailChangeVerifyTokenAndExecuteChange(@Param('mail') mail: string,
                                          @Param('token') token: string,
                                          @Res() res: Response) {
        return this.userService
            .mailChangeVerifyTokenAndExecuteChange(mail, token)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch(err => {
                let error: any = {};

                if (err instanceof UnauthorizedException) {
                    throw new UnauthorizedException();
                } else {
                    Responses.undefinedErrorResponse(err, error, res);
                    return;
                }
            });
    }

    @Post('/mail/change/resend')
    @UseGuards(AuthGuard('jwt'))
    mailChangeResendMail(@Usr() user: User,
                         @Body('domain') domain: string,
                         @Res() res: Response) {
        return this.userService
            .mailChangeResendMail(user, domain)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch(err => {
                let error: any = {};

                if (err.code === 'INVALID') {
                    error.code = err.code;
                    error.message = 'There is no active mail change going on. Email resend is not possible';
                    error.data = err.data;
                } else {
                    Responses.undefinedErrorResponse(err, error, res);
                    return;
                }

                res.status(HttpStatus.BAD_REQUEST).json(error);
            });
    }

    @Get('/mail/change/cancel')
    @UseGuards(AuthGuard('jwt'))
    mailChangeDeactivateToken(@Usr() user: User,
                              @Res() res: Response) {
        return this.userService
            .mailChangeDeactivateToken(user)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch(err => {
                let error: any = {};

                Responses.undefinedErrorResponse(err, error, res);
                return;
            });
    }

    // @Post('/telegram')
    // @UseGuards(AuthGuard('jwt'))
    // addTelegramUser(@Body() telegramUser: TelegramUser,
    //                 @Usr() user: User,
    //                 @Res() res: Response) {
    //     this.userService
    //         .addTelegramUser(telegramUser, user)
    //         .then(result => {
    //             return res.status(HttpStatus.CREATED).json();
    //         })
    //         .catch((err) => {
    //             return this.defaultErrorResponseHandler(err, res);
    //         });
    // }

}
