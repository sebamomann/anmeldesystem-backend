import {Controller, Get, HttpStatus, Request, Res} from '@nestjs/common';

@Controller()
export class AppController {
    constructor() {
    }

    @Get('healthcheck')
    async health(@Request() req,
                 @Res() res) {
        return res.status(HttpStatus.OK).json();
    }
}
