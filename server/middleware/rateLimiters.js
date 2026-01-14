const rateLimit = require('express-rate-limit');
const { getRateLimitStore } = require('../utils/rateLimitStore');

function userOrIpKey(req) {
    return (req.user && req.user.id) ? `u:${req.user.id}` : `ip:${req.ip}`;
}

// Auth endpoints (already has an authLimiter in auth.js; we keep these as shared defaults if needed)
const authWriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    store: getRateLimitStore('rl:auth:'),
    message: { error: 'Muitas tentativas. Tente novamente mais tarde.' }
});

// State-changing actions for logged-in users
const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userOrIpKey,
    store: getRateLimitStore('rl:write:'),
    message: { error: 'Muitas ações em pouco tempo. Tente novamente.' }
});

// Expensive reads (search/filter)
const readHeavyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userOrIpKey,
    store: getRateLimitStore('rl:read:'),
    message: { error: 'Muitas consultas em pouco tempo. Tente novamente.' }
});

// Admin actions
const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userOrIpKey,
    store: getRateLimitStore('rl:admin:'),
    message: { error: 'Muitas ações admin em pouco tempo. Tente novamente.' }
});

module.exports = {
    authWriteLimiter,
    writeLimiter,
    readHeavyLimiter,
    adminLimiter
};
