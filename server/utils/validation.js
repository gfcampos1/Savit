function normalizeHexColor(value, fallback = '#25D366') {
    const raw = String(value || '').trim();
    if (!raw) return fallback;

    const v = raw.toUpperCase();
    if (/^#[0-9A-F]{3}$/.test(v) || /^#[0-9A-F]{6}$/.test(v)) return v;

    return fallback;
}

module.exports = {
    normalizeHexColor
};
