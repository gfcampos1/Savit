const crypto = require('crypto');

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

function csrfCookieOptions() {
    return {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
}

function issueCsrfToken(res) {
    const token = crypto.randomBytes(32).toString('base64url');
    res.cookie(CSRF_COOKIE, token, csrfCookieOptions());
    return token;
}

function csrfMiddleware(options = {}) {
    const {
        exemptPaths = new Set([
            '/api/health',
            '/api/auth/csrf'
        ])
    } = options;

    return (req, res, next) => {
        const method = (req.method || 'GET').toUpperCase();
        const path = req.path || '';

        if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
        if (exemptPaths.has(path)) return next();

        const cookieToken = req.cookies?.[CSRF_COOKIE];
        const headerToken = req.headers?.[CSRF_HEADER];

        if (!cookieToken || !headerToken || cookieToken !== headerToken) {
            return res.status(403).json({ error: 'CSRF token inválido ou ausente.' });
        }

        return next();
    };
}

module.exports = {
    csrfMiddleware,
    issueCsrfToken,
    CSRF_COOKIE,
    CSRF_HEADER
};
