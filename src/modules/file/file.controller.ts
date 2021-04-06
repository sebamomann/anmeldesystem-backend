import {Body, Controller, Delete, Get, HttpStatus, Param, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import {FileService} from './file.service';
import {Response} from 'express';
import {Readable} from 'stream';
import {AuthGuard} from '../../auth/auth.gurad';
import {FileFieldsInterceptor} from '@nestjs/platform-express';
import {Usr} from '../user/user.decorator';
import {JWT_User} from '../user/user.model';
import {IFileCreationDTO} from './IFileCreationDTO';
import {InsufficientPermissionsException} from '../../exceptions/InsufficientPermissionsException';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {BusinessToHttpExceptionInterceptor} from '../../interceptor/BusinessToHttpException.interceptor';

@Controller('files')
@UseInterceptors(BusinessToHttpExceptionInterceptor)
export class FileController {

    constructor(private fileService: FileService) {
    }

    /* istanbul ignore next */
    @Get(':id')
    getFile(@Param('id') id: string,
            @Res() res: Response) {
        return this.fileService
            .getById(id, true)
            .then(tFile => {
                if (tFile != null) {
                    var img = tFile.data;
                    var stream = new Readable();

                    stream.push(img);
                    stream.push(null);

                    res.header('Content-Type', 'application/octet-stream');
                    res.header('Content-Length', img.length + '');
                    res.header('Content-Disposition', 'filename=' + tFile.name);

                    stream.pipe(res);
                }
            })
            .catch((err) => {
                throw err;
            });
    }

    /**
     * TODO
     * Custom filename?
     */
    @Post()
    @UseGuards(AuthGuard)
    @UseInterceptors(FileFieldsInterceptor([{name: 'files', maxCount: 5}]))
    addFile(@Usr() user: JWT_User,
            @Body('appointment') link: string,
            @UploadedFile('files') files: { files: IFileCreationDTO[] } | IFileCreationDTO,
            @Res() res: Response) {
        let fileArray: IFileCreationDTO[];

        if (!Object.keys(files).includes('files')) {
            fileArray = [(files as IFileCreationDTO)];
        } else {
            fileArray = (files as { files: IFileCreationDTO[] }).files;
        }

        return this.fileService
            .addFiles(user, link, fileArray)
            .then(
                () => {
                    res.status(HttpStatus.NO_CONTENT).json();
                }
            )
            .catch(
                (e) => {
                    if (e instanceof InsufficientPermissionsException) {
                        throw new InsufficientPermissionsException(null, null, {
                            'attribute': 'link',
                            'in': 'path',
                            'value': link,
                            'message': 'Specified appointment is not in your ownership. You are not allowed to manage files as administrator.'
                        });
                    } else if (e instanceof EntityNotFoundException) {
                        throw new EntityNotFoundException(null, null, {
                            'attribute': 'link',
                            'in': 'path',
                            'value': link,
                            'message': 'Specified appointment does not exist'
                        });
                    }

                    throw e;
                }
            );
    }

    /**
     * TODO
     * appointment link not needed ... but how to check permission
     * Maybe in sql (CASE) but then cant differentiate between errors
     */
    @Delete(':id')
    @UseGuards(AuthGuard)
    removeFile(@Usr() user: JWT_User,
               @Query('appointment') link: string,
               @Param('id') id: string,
               @Res() res: Response) {
        return this.fileService
            .removeFile(user, link, id)
            .then(
                () => {
                    res.status(HttpStatus.NO_CONTENT).json();
                }
            )
            .catch(
                (e) => {
                    if (e instanceof InsufficientPermissionsException) {
                        throw new InsufficientPermissionsException(null, null, {
                            'attribute': 'appointment',
                            'in': 'query',
                            'value': link,
                            'message': 'Specified appointment is not in your ownership. You are not allowed to manage files as administrator.'
                        });
                    } else if (e instanceof EntityNotFoundException) {
                        if (e.data === 'appointment') {
                            throw new EntityNotFoundException(null, null, {
                                'attribute': 'appointment',
                                'in': 'query',
                                'value': link,
                                'message': 'Specified appointment does not exist'
                            });
                        } else if (e.data === 'file') {
                            throw new EntityNotFoundException(null, null, {
                                'attribute': 'id',
                                'in': 'path',
                                'value': id,
                                'message': 'Specified file does not exist'
                            });
                        }
                    }

                    throw e;
                }
            );
    }
}
