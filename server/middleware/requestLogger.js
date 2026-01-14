const crypto = require('crypto');
const pinoHttp = require('pino-http');
const { logger } = require('../utils/logger');

function genReqId(req, res) {
    const existing = req.headers['x-request-id'];
    const id = (typeof existing === 'string' && existing.trim()) ? existing.trim() : crypto.randomUUID();
    res.setHeader('x-request-id', id);
    return id;
}

const requestLogger = pinoHttp({
    logger,
    genReqId,
    customSuccessMessage: function (req, res) {
        return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage: function (req, res, err) {
        return `${req.method} ${req.url} ${res.statusCode} ${err && err.message ? err.message : ''}`;
    }
});

module.exports = {
    requestLogger
};
