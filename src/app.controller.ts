import {Body, Controller, HttpStatus, Post, Request, Res, UnauthorizedException, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {AuthService} from './auth/auth.service';
import {EntityNotFoundException} from './exceptions/EntityNotFoundException';

@Controller()
export class AppController {
    constructor(private readonly authService: AuthService) {
    }

    @Post('auth/login')
    @UseGuards(AuthGuard('local'))
    async login(@Request() req,
                @Res() res) {

        if (req.user instanceof Date) {
            let error: any = {};
            error.code = 'OLD_PASSWORD';
            error.message = 'This password has been changed at ' + req.user;
            error.data = req.user;

            return res.status(HttpStatus.UNAUTHORIZED).json(error);
        }

        let _user = await this.authService.addJwtToObject(req.user);

        return res.status(HttpStatus.OK).json(_user);
    }

    @Post('auth/token')
    generateAccessToken(@Body() data: { user: { id: string }, refreshToken: string },
                        @Res() res,) {
        return this.authService
            .generateAccessToken(data)
            .then((result) => {
                res.status(HttpStatus.CREATED).json({
                    data: result,
                    date: new Date(Date.now())
                });
            })
            .catch((err) => {
                if (err instanceof EntityNotFoundException || err instanceof UnauthorizedException) {
                    res.status(HttpStatus.UNAUTHORIZED).json({
                        code: 'UNAUTHORIZED',
                        message: `Missing or invalid Authentication`,
                        date: new Date(Date.now())
                    });
                } else {
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                        code: 'UNDEFINED',
                        message: `An undefined error occurred. Please try again`,
                        date: new Date(Date.now())
                    });
                }
            });
    }
}
