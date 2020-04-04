import {Body, Controller, Get, HttpStatus, Param, Post, Put, Res, UnauthorizedException, UseGuards} from '@nestjs/common';

import {User} from './user.entity';
import {Usr} from './user.decorator';

import {UserService} from './user.service';
import {AuthService} from '../../auth/auth.service';

import {AuthGuard} from '@nestjs/passport';

import {Response} from 'express';
import {Responses} from '../../util/responses.util';

import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {EmptyFieldsException} from '../../exceptions/EmptyFieldsException';
import {InvalidTokenException} from '../../exceptions/InvalidTokenException';
import {AlreadyUsedException} from '../../exceptions/AlreadyUsedException';
import {UnknownUserException} from '../../exceptions/UnknownUserException';
import {ExpiredTokenException} from '../../exceptions/ExpiredTokenException';
import {InvalidRequestException} from '../../exceptions/InvalidRequestException';

@Controller('user')
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
                const allowedExceptions: any = [DuplicateValueException];
                handleExceptions(allowedExceptions, err, res);
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
                const allowedExceptions: any = [EmptyFieldsException, DuplicateValueException];
                handleExceptions(allowedExceptions, err, res);
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
                if (err instanceof UnknownUserException) {
                    res.status(HttpStatus.GONE).json();
                    return;
                } else {
                    const allowedExceptions: any = [InvalidTokenException, AlreadyUsedException];
                    handleExceptions(allowedExceptions, err, res);
                }
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
                Responses.undefinedErrorResponse(err, res);
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
                const allowedExceptions: any = [InvalidTokenException, ExpiredTokenException, AlreadyUsedException];
                handleExceptions(allowedExceptions, err, res);
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
                if (err instanceof UnauthorizedException) {
                    throw err;
                } else {
                    Responses.undefinedErrorResponse(err, res);
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
                if (err instanceof UnauthorizedException) {
                    throw new UnauthorizedException();
                } else {
                    Responses.undefinedErrorResponse(err, res);
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
                const allowedExceptions: any = [InvalidRequestException];
                handleExceptions(allowedExceptions, err, res);
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
                Responses.undefinedErrorResponse(err, res);
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

function handleExceptions(allowedExceptions: any[], err: any, res: Response) {
    let valid = false;
    let error: any = {};

    allowedExceptions.forEach(FAllowedException => {
        if (err instanceof FAllowedException) {
            error.code = err.code;
            error.message = err.message;
            error.data = err.data;

            res.status(HttpStatus.BAD_REQUEST).json(error);

            valid = true;
            return;
        }
    });

    if (!valid) {
        Responses.undefinedErrorResponse(err, res);
    }
}
