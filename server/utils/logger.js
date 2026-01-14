const pino = require('pino');

const logger = pino({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    redact: {
        paths: [
            'req.headers.cookie',
            'req.headers.authorization',
            'req.headers["x-csrf-token"]',
            'req.headers["x-csrf-token".toLowerCase()]',
            'res.headers["set-cookie"]'
        ],
        remove: true
    }
});

function audit(event, details = {}) {
    logger.info({ audit: true, event, ...details }, `audit:${event}`);
}

module.exports = {
    logger,
    audit
};
