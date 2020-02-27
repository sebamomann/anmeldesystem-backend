import {Controller, HttpStatus, Post, Request, Res, UseGuards} from '@nestjs/common';
import {AuthGuard} from "@nestjs/passport";
import {AuthService} from "./auth/auth.service";

@Controller()
export class AppController {
    constructor(private readonly authService: AuthService) {
    }

    @UseGuards(AuthGuard('local'))
    @Post('auth/login')
    async login(@Request() req,
                @Res() res) {
        if (req.user instanceof Date) {
            let error: any = {};
            error.code = "OLDPASSWORD";
            error.message = "This password has been changed at " + req.user;
            error.error = req.user;
            return res.status(HttpStatus.UNAUTHORIZED).json(error);
        }

        return res.status(200).json(await this.authService.login(req.user));
    }
}
