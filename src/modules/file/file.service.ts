import {Injectable} from '@nestjs/common';
import {DeleteResult, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {File} from './file.entity';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {JWT_User} from '../user/user.model';
import {IFileCreationDTO} from './IFileCreationDTO';
import {AppointmentService} from '../appointment/appointment.service';
import {AppointmentGateway} from '../appointment/appointment.gateway';

@Injectable()
export class FileService {
    constructor(@InjectRepository(File)
                private fileRepository: Repository<File>,
                private readonly appointmentService: AppointmentService,
                private readonly appointmentGateway: AppointmentGateway) {
    }

    public async save(file: File) {
        return await this.fileRepository.save(file);
    }

    public async delete(id: string): Promise<DeleteResult> {
        return await this.fileRepository.delete({id});
    }

    /**
     * Add {@link File} to {@link Appointment}. <br />
     * Operation can only be executed by the owner of the {@link Appointment}.
     *
     * @param user          {@link JWT_User} Requester (should be owner of {@link Appointment})
     * @param link          Link of {@link Appointment}
     * @param files         Array with objects containing information about the name of the file and its data {@ink as IFileCreationDTO}
     *
     * @throws See {@link checkForAppointmentExistenceAndOwnershipAndReturnForRelation}
     */
    public async addFiles(user: JWT_User, link: string, files: IFileCreationDTO[]) {
        const appointment = await this.appointmentService.checkForAppointmentExistenceAndOwnershipAndReturnForRelation(link, user);

        const list = appointment.files;
        list.setFileService(this);

        for (const fFiles of files) {
            await list.addNew(fFiles);
        }

        this.appointmentGateway.appointmentUpdated(appointment);
    }

    /**
     * Remove {@link File} by its unique ID.
     * Operation can only be executed by the owner of the {@link Appointment}.
     *
     * @param user          {@link JWT_User} Requester (should be owner of {@link Appointment})
     * @param link          Link of {@link Appointment}
     * @param fileId        Unique {@link File} identifier
     *
     * @throws See {@link checkForAppointmentExistenceAndOwnershipAndReturnForRelation}
     */
    public async removeFile(user: JWT_User, link: string, fileId: string) {
        const appointment = await this.appointmentService.checkForAppointmentExistenceAndOwnershipAndReturnForRelation(link, user);

        console.log(appointment);

        const list = appointment.files;
        list.setFileService(this);

        await list.removeFileById(fileId);

        this.appointmentGateway.appointmentUpdated(appointment);
    }

    /**
     * Fetch {@link File} from database by its unique ID.<br/>
     * Data does not get returned by default. Can be controlled with parameter
     *
     * @param id                Unique identifier of {@link File} to fetch
     * @param includeData       Boolean to fecth actual {@link File} data. False by default
     */
    public async getById(id: string, includeData: boolean = false) {
        let obj: any = {
            where: {
                id: id
            }
        };

        if (includeData) {
            obj.select = ['data', 'id', 'name'];
        }

        const file = await this.fileRepository.findOne(obj);

        if (file === undefined) {
            throw new EntityNotFoundException(null, null, 'file');
        }

        return file;
    }
}
