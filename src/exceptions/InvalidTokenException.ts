export class InvalidTokenException implements Error {
    readonly columnNumber: number;
    readonly fileName: string;
    readonly lineNumber: number;
    message: string;
    name: string;
    data: string[];
    code: string;

    constructor(code: string = null, message: string = null, data: any = null) {
        if (code === null
            || code === '') {
            this.code = 'INVALID';
        } else {
            this.code = code;
        }

        if (message === null
            || message === '') {
            this.message = 'Provided token is not valid';
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

    parse() {
        return {
            code: this.code,
            message: this.message,
            data: this.data
        };
    }
}
