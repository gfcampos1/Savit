const COMMON_PASSWORDS = new Set([
    'password',
    '123456',
    '123456789',
    'qwerty',
    '111111',
    '123123',
    'admin',
    'letmein',
    'senha',
    'senha123',
    'savit',
    'savit123'
]);

function isCommonPassword(value) {
    const v = String(value || '').trim().toLowerCase();
    if (!v) return true;
    if (COMMON_PASSWORDS.has(v)) return true;
    // very repetitive/simple patterns
    if (/^(\d)\1{5,}$/.test(v)) return true;
    if (/^(?:012345|123456|234567|345678|456789|987654|876543|765432|654321)/.test(v)) return true;
    return false;
}

module.exports = {
    isCommonPassword
};
