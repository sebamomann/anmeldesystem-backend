const winston = require('winston');

const fs = require('fs');

let logger;

logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: {service: 'user-service'},
    transports: [
        new winston.transports.Console()
    ]
});

module.exports = logger;
