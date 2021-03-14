import {
    BadRequestException,
    CallHandler,
    ConflictException,
    ExecutionContext,
    ForbiddenException,
    GoneException,
    Injectable,
    InternalServerErrorException,
    NestInterceptor,
    NotFoundException,
    UnprocessableEntityException
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
import {InvalidAttributesException} from '../exceptions/InvalidAttributesException';
import {UnknownUserException} from '../exceptions/UnknownUserException';

@Injectable()
export class BusinessToHttpExceptionInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle()
            .pipe(
                catchError(
                    exception => {
                        if (exception instanceof EntityNotFoundException
                            || exception instanceof UnknownUserException) {
                            throw new NotFoundException(exception.parse());
                        } else if (exception instanceof InvalidTokenException
                            || exception instanceof ExpiredTokenException
                            || exception instanceof DuplicateValueException
                            || exception instanceof EmptyFieldsException) {
                            throw new BadRequestException(exception.parse());
                        } else if (exception instanceof InsufficientPermissionsException) {
                            throw new ForbiddenException(exception.parse());
                        } else if (exception instanceof AlreadyUsedException) {
                            throw new ConflictException(exception.parse());
                        } else if (exception instanceof InvalidValuesException) {
                            throw new UnprocessableEntityException(exception.parse());
                        } else if (exception instanceof EntityGoneException) {
                            throw new GoneException(exception.parse());
                        } else if (exception instanceof InvalidAttributesException) {
                            throw new UnprocessableEntityException(exception.parse());
                        } else {
                            let id = GeneratorUtil.makeid(10);
                            console.log(`[${(new Date()).toDateString()} ${(new Date()).toTimeString()}] Code: ${id} - ${JSON.stringify(exception)}`);

                            let error: any = {};

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
