export class InvalidAttributesException implements Error {
    readonly columnNumber: number;
    readonly fileName: string;
    readonly lineNumber: number;
    message: string;
    name: string;
    data: string[];
    code: string;

    constructor(code: string = null, message: string = null, data: string[] = null) {
        if (code === null
            || code === '') {
            this.code = 'INVALID_ATTRIBUTE';
        } else {
            this.code = code;
        }

        if (message === null
            || message === '') {
            this.message = 'Following attributes are not processable';
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
