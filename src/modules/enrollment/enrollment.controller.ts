import {Body, ClassSerializerInterceptor, Controller, Get, Post, Query, UseInterceptors} from '@nestjs/common';
import {EnrollmentService} from "./enrollment.service";
import {Enrollment} from "./enrollment.entity";

@Controller('enrollment')
export class EnrollmentController {

    constructor(private enrollmentService: EnrollmentService) {

    }

    @Get()
    @UseInterceptors(ClassSerializerInterceptor)
    find(@Query() link: string): Promise<Enrollment[]> {
        return this.enrollmentService.find(link);
    }

    @Post()
    create(@Query() link: string, @Body() enrollment: Enrollment): Promise<Enrollment> {
        return this.enrollmentService.create(enrollment, link);
    }
}
