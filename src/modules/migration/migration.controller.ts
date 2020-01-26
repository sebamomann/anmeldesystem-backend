import {Body, Controller, HttpStatus, Param, Post, Request, Res} from '@nestjs/common';
import {Response} from "express";
import {AppointmentService} from "../appointment/appointment.service";
import {MigrationService} from "./migration.service";

@Controller('migrate')
export class MigrationController {
    private conn;

    constructor(private appointmentService: AppointmentService,
                private migrationService: MigrationService) {

    }


    @Post(':id/:hash')
    async findByLink(@Param('id') userId: string,
                     @Param('hash') hash: string,
                     @Body() body: any,
                     @Request() req: Request, @Res() res: Response) {

        if (await this.migrationService.migrate(userId, body)) {
            res.status(HttpStatus.OK).json();
        }
        res.status(HttpStatus.BAD_REQUEST).json();
    }
}
