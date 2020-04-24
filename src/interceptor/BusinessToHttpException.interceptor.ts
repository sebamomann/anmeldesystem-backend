import {
    BadRequestException,
    CallHandler,
    ExecutionContext,
    ForbiddenException,
    GoneException,
    Injectable,
    InternalServerErrorException,
    NestInterceptor,
    NotFoundException
} from '@nestjs/common';
import {Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {InvalidValuesException} from '../exceptions/InvalidValuesException';
import {DuplicateValueException} from '../exceptions/DuplicateValueException';
import {GeneratorUtil} from '../util/generator.util';
import {InsufficientPermissionsException} from '../exceptions/InsufficientPermissionsException';
import {EntityNotFoundException} from '../exceptions/EntityNotFoundException';
import {EmptyFieldsException} from '../exceptions/EmptyFieldsException';
import {EntityGoneException} from '../exceptions/EntityGoneException';
import {InvalidTokenException} from '../exceptions/InvalidTokenException';
import {ExpiredTokenException} from '../exceptions/ExpiredTokenException';
import {AlreadyUsedException} from '../exceptions/AlreadyUsedException';

@Injectable()
export class BusinessToHttpExceptionInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle()
            .pipe(
                catchError(
                    exception => {
                        if (exception instanceof EntityNotFoundException) {
                            throw new NotFoundException();
                        } else if (exception instanceof InvalidValuesException
                            || exception instanceof InvalidTokenException
                            || exception instanceof ExpiredTokenException
                            || exception instanceof AlreadyUsedException
                            || exception instanceof DuplicateValueException
                            || exception instanceof EmptyFieldsException) {
                            throw new BadRequestException(exception.parse());
                        } else if (exception instanceof InsufficientPermissionsException) {
                            throw new ForbiddenException(exception.parse());
                        } else if (exception instanceof EntityGoneException) {
                            throw new GoneException(exception.parse());
                        } else {
                            let error: any = {};

                            let id = GeneratorUtil.makeid(10);
                            console.log(`[${(new Date()).toDateString()} ${(new Date()).toTimeString()}] Code: ${id} - ${JSON.stringify(error)}`);

                            error.code = 'UNDEFINED';
                            error.message = 'Some error occurred. Please try again later or contact the support with the appended error Code';
                            error.data = id;

                            throw new InternalServerErrorException(error);
                        }
                    }
                )
            );
    }
}
