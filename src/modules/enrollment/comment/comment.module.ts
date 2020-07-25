import {forwardRef, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Comment} from './comment.entity';
import {CommentController} from './comment.controller';
import {CommentService} from './comment.service';
import {EnrollmentModule} from '../enrollment.module';

@Module({
    imports: [TypeOrmModule.forFeature([Comment]), forwardRef(() => EnrollmentModule)],
    providers: [CommentService],
    exports: [CommentService],
    controllers: [CommentController],
})
export class CommentModule {
}
