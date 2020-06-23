export class AlreadyUsedException implements Error {
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
            this.code = 'USED';
        } else {
            this.code = code;
        }

        this.message = message;
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
