export class InternalErrorException implements Error {
    readonly columnNumber: number;
    readonly fileName: string;
    readonly lineNumber: number;
    message: string;
    name: string;
    data: string;
    code: string;

    constructor(code: string = null, message: string = null, data: string = null) {
        if (code === null
            || code === '') {
            this.code = 'UNDEFINED';
        } else {
            this.code = code;
        }

        if (message === null
            || message === '') {
            this.message = 'Request could not be processed';
        } else {
            this.message = message;
        }

        this.data = data;
    }

    dumpStack() {
    }

    getStackTrace(): any[] {
        return [];
    }

    printStackTrace() {
    }
}
