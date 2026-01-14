const crypto = require('crypto');

function randomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('base64url');
}

function sha256Hex(value) {
    return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function requireSessionSecret() {
    const raw = String(process.env.SESSION_SECRET || '').trim();
    if (raw) return raw;
    // fallback for dev/backwards compatibility
    const fallback = String(process.env.JWT_SECRET || '').trim();
    if (!fallback) {
        throw new Error('SESSION_SECRET não configurado (e JWT_SECRET ausente).');
    }
    return fallback;
}

function sessionTokenHash(token) {
    // Keyed hash: avoids storing raw refresh tokens.
    const key = requireSessionSecret();
    return crypto.createHmac('sha256', key).update(String(token), 'utf8').digest('hex');
}

module.exports = {
    randomToken,
    sha256Hex,
    sessionTokenHash
};
