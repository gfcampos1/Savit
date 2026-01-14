const { createClient } = require('redis');
const { RedisStore } = require('rate-limit-redis');

let client;
let connectPromise;
let warnedNoRedis = false;

function getRedisUrl() {
    const url = String(process.env.REDIS_URL || '').trim();
    return url || null;
}

async function ensureConnected() {
    if (!client) {
        const url = getRedisUrl();
        if (!url) return;
        client = createClient({ url });
        client.on('error', (err) => {
            // Avoid crashing on transient redis errors; rate limiting will behave best-effort.
            console.error('Redis client error:', err);
        });
    }

    if (!connectPromise) {
        connectPromise = client.connect().catch((err) => {
            connectPromise = null;
            throw err;
        });
    }

    await connectPromise;
}

function getRateLimitStore(prefix = 'rl:') {
    const url = getRedisUrl();
    if (!url) {
        if (!warnedNoRedis && process.env.NODE_ENV === 'production') {
            warnedNoRedis = true;
            console.warn('⚠️  REDIS_URL não configurado. Rate limit ficará em memória (menos efetivo em múltiplas instâncias).');
        }
        return undefined;
    }

    return new RedisStore({
        prefix,
        // rate-limit-redis expects a sendCommand function
        sendCommand: async (...args) => {
            await ensureConnected();
            // node-redis expects an array of args
            return client.sendCommand(args);
        }
    });
}

module.exports = {
    getRateLimitStore
};
