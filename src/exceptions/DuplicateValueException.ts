export class DuplicateValueException implements Error {
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
            this.code = 'DUPLICATE_ENTRY';
        } else {
            this.code = code;
        }

        if (message === null
            || message === '') {
            this.message = 'Following values are already in use';
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
