const { PrismaClient } = require('@prisma/client');
const { randomToken, sessionTokenHash } = require('./tokens');

const prisma = new PrismaClient();

const REFRESH_COOKIE = 'refresh_token';

function refreshCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    };
}

function clearCookieOptions() {
    return {
        path: '/api/auth'
    };
}

async function createSession(userId) {
    const token = randomToken(32);
    const tokenHash = sessionTokenHash(token);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const session = await prisma.session.create({
        data: {
            userId,
            tokenHash,
            expiresAt
        }
    });

    return { session, token };
}

async function rotateSessionByToken(refreshToken) {
    const tokenHash = sessionTokenHash(refreshToken);

    const session = await prisma.session.findFirst({
        where: {
            tokenHash,
            revokedAt: null,
            expiresAt: { gt: new Date() }
        }
    });

    if (!session) return null;

    const nextToken = randomToken(32);
    const nextHash = sessionTokenHash(nextToken);
    const nextExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const updated = await prisma.session.update({
        where: { id: session.id },
        data: {
            tokenHash: nextHash,
            lastUsedAt: new Date(),
            expiresAt: nextExpiresAt
        }
    });

    return { session: updated, token: nextToken };
}

async function revokeSessionByToken(refreshToken) {
    if (!refreshToken) return;
    const tokenHash = sessionTokenHash(refreshToken);
    await prisma.session.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() }
    });
}

async function revokeAllSessionsForUser(userId) {
    await prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
    });
}

function setRefreshCookie(res, token) {
    res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
}

function clearRefreshCookie(res) {
    res.clearCookie(REFRESH_COOKIE, clearCookieOptions());
}

module.exports = {
    REFRESH_COOKIE,
    createSession,
    rotateSessionByToken,
    revokeSessionByToken,
    revokeAllSessionsForUser,
    setRefreshCookie,
    clearRefreshCookie
};
