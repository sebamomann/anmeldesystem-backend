import {Controller, Get, Param, Res} from '@nestjs/common';
import {FileService} from "./file.service";
import {Response} from "express";
import {Readable} from 'stream';

@Controller('file')
export class FileController {

    constructor(private fileService: FileService) {
    }

    @Get(":id")
    async getFile(@Param("id") id: string, @Res() res: Response) {
        this.fileService
            .findById(id)
            .then(tFile => {
                if (tFile != null) {
                    var img = Buffer.from(tFile.data, 'base64');
                    var stream = new Readable();

                    stream.push(img);
                    stream.push(null);

                    res.header("Content-Type", 'application/png');
                    res.header("Content-Length", img.length + "");
                    res.header("Content-Disposition", 'attatchment; filename=' + tFile.name);

                    stream.pipe(res);
                }
            });
    }
}
