const winston = require('winston');

const fs = require('fs');

fs.mkdirSync('/logs');

let logger;

if (process.env.NODE_ENV === 'production') {
    logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: {service: 'user-service'},
        transports: [
            new winston.transports.File({filename: '/logs/error.log', level: 'error'}),
            new winston.transports.File({filename: '/logs/combined.log'})
        ]
    });
} else {
    logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: {service: 'user-service'},
        transports: [
            new winston.transports.Console()
        ]
    });
}

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;
