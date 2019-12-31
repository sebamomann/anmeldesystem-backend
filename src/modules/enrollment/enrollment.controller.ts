import {Body, Controller, Get, HttpStatus, Post, Query, Res} from '@nestjs/common';
import {Response} from 'express';
import {EnrollmentService} from "./enrollment.service";
import {Enrollment} from "./enrollment.entity";

@Controller('enrollment')
export class EnrollmentController {

    constructor(private enrollmentService: EnrollmentService) {

    }

    @Get()
    find(@Query() id: string): Promise<Enrollment> {
        return this.enrollmentService.find(id);
    }

    @Post()
    async create(@Query() link: string, @Body() enrollment: Enrollment, @Res() res: Response) {
        this.enrollmentService.create(enrollment, link).then(tEntrollment => {
            delete tEntrollment.appointment;
            res.status(HttpStatus.CREATED).json(tEntrollment);
        }).catch((err) => {
            let error = {error: {}};
            if (err.code === 'ER_DUP_ENTRY') {
                error.error = {
                    columns: [
                        {
                            name: "name",
                            error: "duplicate"
                        }
                    ]
                };
            } else {
                error.error = {undefined: {message: "Some error occurred. Please try again later or contact the support"}};
            }

            res.status(HttpStatus.BAD_REQUEST).json(error);
        });
    }
}
