import {Controller, HttpStatus, Post, Request, Res, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {AuthService} from './auth/auth.service';

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
}
