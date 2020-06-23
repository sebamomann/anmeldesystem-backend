export class UnknownUsersException implements Error {
    readonly columnNumber: number;
    readonly fileName: string;
    readonly lineNumber: number;
    message: string;
    name: string;
    data: string[];
    code: string;

    constructor(code: string = null, message: string = null, data: string[] = null) {
        this.code = code;
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
}
