const speakeasy = require('speakeasy');
const { encryptString, decryptString } = require('./crypto');

function generateTotpSecret(label = 'Savit') {
    const secret = speakeasy.generateSecret({
        name: label,
        length: 20
    });
    return {
        base32: secret.base32,
        otpauthUrl: secret.otpauth_url
    };
}

function encryptTotpSecret(base32) {
    return encryptString(base32);
}

function decryptTotpSecret(value) {
    const plain = decryptString(value);
    return typeof plain === 'string' ? plain : null;
}

function verifyTotpCode(base32, token) {
    return speakeasy.totp.verify({
        secret: base32,
        encoding: 'base32',
        token: String(token || '').replace(/\s+/g, ''),
        window: 1
    });
}

module.exports = {
    generateTotpSecret,
    encryptTotpSecret,
    decryptTotpSecret,
    verifyTotpCode
};
