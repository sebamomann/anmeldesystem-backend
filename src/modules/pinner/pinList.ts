export class PinList {
    private list: string[];

    constructor(pins: any = {}) {
        this.parsePins(pins);
    }

    public getArray() {
        return this.list;
    }

    public includesLink(link: string) {
        return this.list.includes(link);
    }

    private parsePins(pins: any) {
        let output = [];

        for (const queryKey of Object.keys(pins)) {
            if (queryKey.startsWith('pin')) {
                output.push(pins[queryKey]);
            }
        }

        this.list = output;
    }
}
