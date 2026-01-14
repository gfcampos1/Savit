const crypto = require('crypto');

const ENCRYPTION_PREFIX_V1 = 'enc:v1:';
const ENCRYPTION_PREFIX_V2 = 'enc:v2:';

function getEncryptionKeyring() {
    const keysRaw = String(process.env.ENCRYPTION_KEYS || '').trim();
    if (keysRaw) {
        const list = keysRaw.split(',').map(s => s.trim()).filter(Boolean);
        if (list.length > 0) return list;
    }

    const single = String(process.env.ENCRYPTION_KEY || '').trim();
    if (single) return [single];
    return [];
}

function requireEncryptionKey() {
    const keys = getEncryptionKeyring();
    const key = keys[0];
    if (!key || String(key).trim().length < 16) {
        throw new Error('Missing/weak ENCRYPTION_KEY(S). Set a strong secret (>= 16 chars, ideally 32+).');
    }
    return String(key);
}

function deriveKey(rawKey) {
    const raw = rawKey || requireEncryptionKey();
    // Derive a fixed 32-byte key from arbitrary input.
    return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

function isEncryptedString(value) {
    return (
        typeof value === 'string' &&
        (value.startsWith(ENCRYPTION_PREFIX_V1) || value.startsWith(ENCRYPTION_PREFIX_V2))
    );
}

function encryptString(plainText) {
    if (plainText === null || plainText === undefined) return plainText;
    if (typeof plainText !== 'string') plainText = String(plainText);
    if (isEncryptedString(plainText)) return plainText;

    const keyring = getEncryptionKeyring();
    const activeKeyRaw = keyring[0] || requireEncryptionKey();
    const key = deriveKey(activeKeyRaw);
    const kid = 0;
    const iv = crypto.randomBytes(12); // GCM standard
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return (
        ENCRYPTION_PREFIX_V2 +
        `${kid}:` +
        Buffer.concat([iv, tag, ciphertext]).toString('base64')
    );
}

function decryptString(value) {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'string') return value;
    if (!isEncryptedString(value)) return value;

    try {
        let b64;
        let keyCandidates = [];

        if (value.startsWith(ENCRYPTION_PREFIX_V2)) {
            const rest = value.slice(ENCRYPTION_PREFIX_V2.length);
            const sep = rest.indexOf(':');
            if (sep <= 0) return value;
            const kidStr = rest.slice(0, sep);
            const kid = Number.parseInt(kidStr, 10);
            if (!Number.isFinite(kid) || kid < 0) return value;
            b64 = rest.slice(sep + 1);

            const keyring = getEncryptionKeyring();
            if (keyring[kid]) {
                keyCandidates.push(deriveKey(keyring[kid]));
            }
            // fallback: try all keys
            keyCandidates = keyCandidates.concat(keyring.map(k => deriveKey(k)));
        } else {
            // v1 legacy format
            b64 = value.slice(ENCRYPTION_PREFIX_V1.length);
            const keyring = getEncryptionKeyring();
            keyCandidates = keyring.map(k => deriveKey(k));
        }

        const raw = Buffer.from(b64, 'base64');
        if (raw.length < 12 + 16) {
            return value;
        }

        const iv = raw.subarray(0, 12);
        const tag = raw.subarray(12, 28);
        const ciphertext = raw.subarray(28);

        for (const key of keyCandidates) {
            try {
                const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
                decipher.setAuthTag(tag);
                const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
                return plain.toString('utf8');
            } catch {
                // try next key
            }
        }

        return value;
    } catch {
        return value;
    }
}

function hmacNormalized(value) {
    // Deterministic keyed hash for lookups/uniqueness without revealing plaintext.
    const key = String(process.env.HMAC_KEY || '').trim() || requireEncryptionKey();
    const normalized = String(value ?? '')
        .trim()
        .toLowerCase();
    return crypto
        .createHmac('sha256', key)
        .update(normalized, 'utf8')
        .digest('hex');
}

module.exports = {
    encryptString,
    decryptString,
    isEncryptedString,
    hmacNormalized,
    ENCRYPTION_PREFIX: ENCRYPTION_PREFIX_V2,
    ENCRYPTION_PREFIX_V1,
    ENCRYPTION_PREFIX_V2
};
