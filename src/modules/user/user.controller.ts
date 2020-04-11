import {Body, Controller, Get, GoneException, HttpStatus, Param, Post, Put, Res, UseGuards, UseInterceptors} from '@nestjs/common';

import {User} from './user.entity';
import {Usr} from './user.decorator';

import {UserService} from './user.service';
import {AuthService} from '../../auth/auth.service';

import {AuthGuard} from '@nestjs/passport';

import {Response} from 'express';
import {BusinessToHttpExceptionInterceptor} from '../../interceptor/BusinessToHttpException.interceptor';

@Controller('user')
@UseInterceptors(BusinessToHttpExceptionInterceptor)
export class UserController {
    constructor(private readonly userService: UserService,
                private authService: AuthService) {
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
                throw new GoneException();
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
                throw err;
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
                throw err;
            });
    }

    @Get('/verify/:mail/:token')
    activate(@Param('mail') mail: string,
             @Param('token') token: string,
             @Res() res: Response) {
        return this.userService
            .activate(mail, token)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch(err => {
                throw err;
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
                throw err;
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
                throw err;
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
                throw err;
            });
    }

    @Get('/mail/verify/:mail/:token')
    mailChangeVerifyTokenAndExecuteChange(@Param('mail') mail: string,
                                          @Param('token') token: string,
                                          @Res() res: Response) {
        return this.userService
            .mailChange(mail, token)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
            })
            .catch(err => {
                throw err;
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
                throw err;
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
                throw err;
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
