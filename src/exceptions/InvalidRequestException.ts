export class InvalidRequestException implements Error {
    readonly columnNumber: number;
    readonly fileName: string;
    readonly lineNumber: number;
    message: string;
    name: string;
    data: string;
    code: string;

    constructor(code: string, message: string, data: string = null) {
        this.code = code;
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
