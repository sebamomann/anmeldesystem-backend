import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {cors: true});
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

    app.use(function(req, res, next) {
        var allowedOrigins = ['http://127.0.0.1:3000', 'http://localhost:3000', 'https://neu.eca.cg-hh.de', 'http://localhost:9000', 'http://localhost:4200'];
        var origin = req.headers.origin;
        if (allowedOrigins.indexOf(origin) > -1) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, PUT, DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, If-None-Match');
        res.header('Access-Control-Allow-Credentials', true);
        res.header('access-control-expose-headers', 'etag');
        return next();
    });

    await app.listen(3000);
}

bootstrap();
