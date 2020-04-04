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
            .pipe(catchError(error => {
                if (error instanceof EntityNotFoundException) {
                    throw new NotFoundException();
                } else if (error instanceof InvalidValuesException
                    || error instanceof InvalidTokenException
                    || error instanceof ExpiredTokenException
                    || error instanceof AlreadyUsedException
                    || error instanceof DuplicateValueException
                    || error instanceof EmptyFieldsException) {
                    throw new BadRequestException(error.parse());
                } else if (error instanceof InsufficientPermissionsException) {
                    throw new ForbiddenException(error.parse());
                } else if (error instanceof EntityGoneException) {
                    throw new GoneException(error.parse());
                } else {
                    let error: any = {};

                    let id = GeneratorUtil.makeid(10);
                    console.log(`[${(new Date()).toDateString()} ${(new Date()).toTimeString()}] Code: ${id} - ${JSON.stringify(error)}`);

                    error.code = 'UNDEFINED';
                    error.message = 'Some error occurred. Please try again later or contact the support with the appended error Code';
                    error.data = id;

                    throw new InternalServerErrorException(error);
                }
            }));
    }
}
