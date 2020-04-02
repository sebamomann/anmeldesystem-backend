export class UnknownUserException implements Error {
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
            this.code = 'GONE';
        } else {
            this.code = code;
        }

        if (message === null
            || message === '') {
            this.message = 'User is not present anymore';
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
