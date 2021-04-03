import {File} from './file.entity';
import {IFileDTO} from './IFileDTO';

export class FileList {
    private list: File[];

    constructor(list: File[] = []) {
        if (list) {
            this.list = list;
        } else {
            this.list = [];
        }
    }

    public getArray(): File[] {
        return this.list;
    }

    public getDTOArray() {
        const output: IFileDTO[] = [];

        for (const fFile of this.list) {
            const fileURL = process.env.API_URL + 'file/' + fFile.id;

            output.push({
                name: fFile.name,
                url: fileURL,
                id: fFile.id
            });
        }

        return output;
    }
}
