import {Response} from 'express';
import {HttpStatus} from '@nestjs/common';
import {GeneratorUtil} from './generator.util';

export class Responses {
    public static undefinedErrorResponse = function(err, res: Response) {
        let error: any = {};

        let id = GeneratorUtil.makeid(10);
        console.log(`[${(new Date()).toDateString()} ${(new Date()).toTimeString()}] Code: ${id} - ${JSON.stringify(err)}`);

        error.code = 'UNDEFINED';
        error.message = 'Some error occurred. Please try again later or contact the support with the appended error Code';
        error.data = id;

        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
        return;
    };
}
