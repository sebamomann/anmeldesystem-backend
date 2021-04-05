import {File} from './file.entity';
import {IFileDTO} from './IFileDTO';
import {FileService} from './file.service';
import {Appointment} from '../appointment/appointment.entity';
import {IFileCreationDTO} from './IFileCreationDTO';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';

export class FileList {
    private list: File[];
    private readonly appointment: Appointment;

    private fileService: FileService;

    constructor(list: File[] = [], appointment: Appointment) {
        if (list) {
            this.list = list;
        } else {
            this.list = [];
        }

        this.appointment = appointment;
    }

    public getArray(): File[] {
        return this.list;
    }

    public setFileService(fileService: FileService) {
        this.fileService = fileService;
    }

    public add(file: File) {
        this.list.push(file);
    }

    /**
     * Create a new {@link File} including the correct {@link Appointment} relation.
     *
     * @param data      {@link IFileCreationDTO} containing data for creation
     */
    public async addNew(data: IFileCreationDTO): Promise<void> {
        const file = new File();
        file.name = data.originalname;
        file.data = data.buffer;
        file.appointment = this.appointment;

        const savedFile = await this.fileService.save(file);

        this.add(savedFile);
    }

    /**
     * Remove {@link File} from list.
     *
     * @param id      Unique {@link} file identifier
     */
    public async removeFileById(id: string): Promise<void> {
        const affected = (await this.fileService.delete(id)).affected;

        if (affected > 0) {
                this.list = this.list
                .filter((fFile: File) => fFile.id !== id);
        } else {
            throw new EntityNotFoundException(null, null, 'file');
        }
    }

    public getDTOArray() {
        const output: IFileDTO[] = [];

        this.sortByName();

        for (const fFile of this.list) {
            const fileURL = process.env.API_URL + 'files/' + fFile.id;

            output.push({
                name: fFile.name,
                url: fileURL,
                id: fFile.id
            });
        }

        return output;
    }

    /**
     * Sort list by "name" attribute
     */
    public sortByName() {
        this.list
            .sort(
                (a, b) => {
                    return a.name < b.name ? -1 : 1;
                }
            );
    }
}
