const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const path = require('path');
const { execFile } = require('child_process');

const { validateBody, validateParams } = require('../middleware/validate');
const { authWriteLimiter, adminLimiter, writeLimiter } = require('../middleware/rateLimiters');

const { issueCsrfToken, CSRF_COOKIE } = require('../middleware/csrf');
const { encryptString, decryptString, hmacNormalized } = require('../utils/crypto');
const { normalizeHexColor } = require('../utils/validation');
const {
    AuthLoginBody,
    AuthRegisterBody,
    AuthChangePasswordBody,
    AuthProfileUpdateBody,
    MfaCodeBody,
    AdminResetUserPasswordBody,
    IdParam,
    UserIdParam
} = require('../utils/schemas');
const { isCommonPassword } = require('../utils/password');
const { audit } = require('../utils/logger');
const {
    REFRESH_COOKIE,
    createSession,
    rotateSessionByToken,
    revokeSessionByToken,
    revokeAllSessionsForUser,
    setRefreshCookie,
    clearRefreshCookie
} = require('../utils/sessions');
const { generateTotpSecret, encryptTotpSecret, decryptTotpSecret, verifyTotpCode } = require('../utils/totp');

const router = express.Router();
const prisma = new PrismaClient();

let migrationsRunning = false;

// Generate JWT token
const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não configurado');
    }
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
};

// Set cookie options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000 // 15 minutes (access token)
};

const clearCookieOptions = {
    path: '/'
};

// Issue CSRF token cookie
router.get('/csrf', (req, res) => {
    const token = issueCsrfToken(res);
    res.json({ csrfToken: token });
});

// Register
router.post('/register', authWriteLimiter, validateBody(AuthRegisterBody), async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (isCommonPassword(password)) {
            return res.status(400).json({ error: 'Escolha uma senha mais forte (senha muito comum).' });
        }

        const emailNormalized = String(email).toLowerCase();
        const emailHash = hmacNormalized(emailNormalized);

        // Check if user exists (by hash)
        const existingUser = await prisma.user.findFirst({
            where: { emailHash }
        });

        if (existingUser) {
            audit('auth.register.duplicate', { emailHash });
            return res.status(400).json({ error: 'Este email já está cadastrado.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Check if this is the first user (make them admin and approved)
        const userCount = await prisma.user.count();
        const isFirstUser = userCount === 0;

        // Create user
        const user = await prisma.user.create({
            data: {
                email: encryptString(emailNormalized),
                emailHash,
                password: hashedPassword,
                name: encryptString(name),
                role: isFirstUser ? 'admin' : 'user',
                approved: isFirstUser, // First user is auto-approved
                // Create default categories
                categories: {
                    create: [
                        { name: encryptString('Pessoal'), nameHash: hmacNormalized('Pessoal'), color: normalizeHexColor('#25D366') },
                        { name: encryptString('Trabalho'), nameHash: hmacNormalized('Trabalho'), color: normalizeHexColor('#34B7F1') },
                        { name: encryptString('Ideias'), nameHash: hmacNormalized('Ideias'), color: normalizeHexColor('#9C27B0') }
                    ]
                }
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                approved: true,
                createdAt: true
            }
        });

        // If user needs approval, don't generate token
        if (!user.approved) {
            audit('auth.register.pending', { userId: user.id });
            return res.status(201).json({
                message: 'Conta criada! Aguarde a aprovação do administrador.',
                pendingApproval: true
            });
        }

        // Generate token
        const token = generateToken(user.id);

        // Set cookie
        res.cookie('token', token, cookieOptions);

        // Refresh session cookie
        const { token: refreshToken } = await createSession(user.id);
        setRefreshCookie(res, refreshToken);

        // CSRF token for subsequent state-changing requests
        issueCsrfToken(res);

        const safeUser = {
            ...user,
            name: decryptString(user.name),
            avatar: decryptString(user.avatar),
            email: decryptString(user.email)
        };

        res.status(201).json({
            message: 'Conta criada com sucesso!',
            user: safeUser
        });

        audit('auth.register.success', { userId: user.id, role: user.role });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro ao criar conta.' });
    }
});

// Login
router.post('/login', authWriteLimiter, validateBody(AuthLoginBody), async (req, res) => {
    try {
        const { email, password, mfaCode } = req.body;

        const emailNormalized = String(email).toLowerCase();
        const emailHash = hmacNormalized(emailNormalized);

        // Find user (by hash)
        const user = await prisma.user.findFirst({
            where: { emailHash }
        });

        if (!user) {
            audit('auth.login.fail', { emailHash });
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            audit('auth.login.fail', { userId: user.id });
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        // Check if user is approved
        if (!user.approved) {
            audit('auth.login.pending', { userId: user.id });
            return res.status(403).json({ 
                error: 'Sua conta ainda não foi aprovada pelo administrador.',
                pendingApproval: true
            });
        }

        // If MFA enabled, require a valid TOTP code
        if (user.mfaEnabled) {
            if (!mfaCode) {
                return res.status(401).json({ error: 'Código MFA obrigatório.' });
            }
            const secretBase32 = decryptTotpSecret(user.mfaSecret);
            if (!secretBase32 || !verifyTotpCode(secretBase32, mfaCode)) {
                audit('auth.login.mfa.fail', { userId: user.id });
                return res.status(401).json({ error: 'Código MFA inválido.' });
            }
        }

        // Generate token
        const token = generateToken(user.id);

        // Set cookie
        res.cookie('token', token, cookieOptions);

        // Create refresh session
        const { token: refreshToken } = await createSession(user.id);
        setRefreshCookie(res, refreshToken);

        // Rotate CSRF token on login
        issueCsrfToken(res);

        res.json({
            message: 'Login realizado com sucesso!',
            user: {
                id: user.id,
                email: decryptString(user.email),
                name: decryptString(user.name),
                avatar: decryptString(user.avatar),
                role: user.role,
                createdAt: user.createdAt
            }
        });

        audit('auth.login.success', { userId: user.id, role: user.role });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
});

// Refresh access token using refresh cookie
router.post('/refresh', authWriteLimiter, async (req, res) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE];
        if (!refreshToken) {
            return res.status(401).json({ error: 'Sessão expirada. Faça login.' });
        }

        const rotated = await rotateSessionByToken(refreshToken);
        if (!rotated) {
            clearRefreshCookie(res);
            res.clearCookie('token', clearCookieOptions);
            return res.status(401).json({ error: 'Sessão expirada. Faça login.' });
        }

        setRefreshCookie(res, rotated.token);

        const token = generateToken(rotated.session.userId);
        res.cookie('token', token, cookieOptions);

        // Rotate CSRF token too
        issueCsrfToken(res);

        const user = await prisma.user.findUnique({
            where: { id: rotated.session.userId },
            select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true }
        });

        audit('auth.refresh', { userId: rotated.session.userId });
        res.json({
            message: 'Sessão renovada.',
            user: {
                id: user.id,
                email: decryptString(user.email),
                name: decryptString(user.name),
                avatar: decryptString(user.avatar),
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Erro ao renovar sessão.' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    revokeSessionByToken(refreshToken).catch(() => {});

    res.clearCookie('token', clearCookieOptions);
    res.clearCookie(CSRF_COOKIE, clearCookieOptions);
    clearRefreshCookie(res);
    res.json({ message: 'Logout realizado com sucesso!' });

    audit('auth.logout', { hasRefresh: Boolean(refreshToken) });
});

// Logout all sessions
router.post('/logout-all', auth, writeLimiter, async (req, res) => {
    await revokeAllSessionsForUser(req.user.id);
    res.clearCookie('token', clearCookieOptions);
    res.clearCookie(CSRF_COOKIE, clearCookieOptions);
    clearRefreshCookie(res);
    audit('auth.logoutAll', { userId: req.user.id });
    res.json({ message: 'Sessões encerradas. Faça login novamente.' });
});

// List sessions (devices)
router.get('/sessions', auth, async (req, res) => {
    try {
        const sessions = await prisma.session.findMany({
            where: { userId: req.user.id },
            select: {
                id: true,
                createdAt: true,
                lastUsedAt: true,
                expiresAt: true,
                revokedAt: true
            },
            orderBy: { lastUsedAt: 'desc' }
        });
        res.json({ sessions });
    } catch (error) {
        console.error('List sessions error:', error);
        res.status(500).json({ error: 'Erro ao listar sessões.' });
    }
});

// Revoke a session
router.post('/sessions/:id/revoke', auth, writeLimiter, validateParams(IdParam), async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await prisma.session.updateMany({
            where: { id, userId: req.user.id, revokedAt: null },
            data: { revokedAt: new Date() }
        });
        if (!updated.count) {
            return res.status(404).json({ error: 'Sessão não encontrada.' });
        }
        audit('auth.session.revoke', { userId: req.user.id, sessionId: id });
        res.json({ message: 'Sessão revogada.' });
    } catch (error) {
        console.error('Revoke session error:', error);
        res.status(500).json({ error: 'Erro ao revogar sessão.' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    res.json({ user: req.user });
});

// Update profile
router.put('/profile', auth, writeLimiter, validateBody(AuthProfileUpdateBody), async (req, res) => {
    try {
        const { name, avatar } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name: encryptString(name) }),
                ...(avatar !== undefined && { avatar: avatar ? encryptString(avatar) : null })
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                createdAt: true
            }
        });

        res.json({
            user: {
                ...user,
                email: decryptString(user.email),
                name: decryptString(user.name),
                avatar: decryptString(user.avatar)
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
});

// Change password
router.put('/password', auth, validateBody(AuthChangePasswordBody), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: 'A nova senha deve ser diferente da senha atual.' });
        }

        if (isCommonPassword(newPassword)) {
            return res.status(400).json({ error: 'Escolha uma senha mais forte (senha muito comum).' });
        }

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Senha atual incorreta.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        // Revoke all sessions after password change
        await revokeAllSessionsForUser(req.user.id);
        res.clearCookie('token', clearCookieOptions);
        res.clearCookie(CSRF_COOKIE, clearCookieOptions);
        clearRefreshCookie(res);

        res.json({ message: 'Senha alterada com sucesso! Faça login novamente.' });

        audit('auth.password.changed', { userId: req.user.id });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Erro ao alterar senha.' });
    }
});

// MFA setup (returns otpauth url)
router.post('/mfa/setup', auth, writeLimiter, async (req, res) => {
    try {
        const label = `Savit (${req.user.email})`;
        const secret = generateTotpSecret(label);
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                mfaSecret: encryptTotpSecret(secret.base32),
                mfaEnabled: false
            }
        });

        audit('mfa.setup', { userId: req.user.id });
        const payload = { otpauthUrl: secret.otpauthUrl };
        if (process.env.NODE_ENV !== 'production') {
            payload.secret = secret.base32;
        }
        res.json(payload);
    } catch (error) {
        console.error('MFA setup error:', error);
        res.status(500).json({ error: 'Erro ao configurar MFA.' });
    }
});

router.post('/mfa/enable', auth, writeLimiter, validateBody(MfaCodeBody), async (req, res) => {
    try {
        const { code } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        const secretBase32 = decryptTotpSecret(user.mfaSecret);
        if (!secretBase32 || !verifyTotpCode(secretBase32, code)) {
            return res.status(400).json({ error: 'Código MFA inválido.' });
        }
        await prisma.user.update({ where: { id: req.user.id }, data: { mfaEnabled: true } });
        audit('mfa.enable', { userId: req.user.id });
        res.json({ message: 'MFA ativado com sucesso.' });
    } catch (error) {
        console.error('MFA enable error:', error);
        res.status(500).json({ error: 'Erro ao ativar MFA.' });
    }
});

router.post('/mfa/disable', auth, writeLimiter, validateBody(MfaCodeBody), async (req, res) => {
    try {
        const { code } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        const secretBase32 = decryptTotpSecret(user.mfaSecret);
        if (!secretBase32 || !verifyTotpCode(secretBase32, code)) {
            return res.status(400).json({ error: 'Código MFA inválido.' });
        }
        await prisma.user.update({ where: { id: req.user.id }, data: { mfaEnabled: false, mfaSecret: null } });
        audit('mfa.disable', { userId: req.user.id });
        res.json({ message: 'MFA desativado.' });
    } catch (error) {
        console.error('MFA disable error:', error);
        res.status(500).json({ error: 'Erro ao desativar MFA.' });
    }
});

// Admin middleware
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    next();
};

function runPrismaCommand(args, options = {}) {
    const cwd = options.cwd || process.cwd();
    const timeoutMs = options.timeoutMs || 120_000;

    const isWindows = process.platform === 'win32';
    const npxCmd = isWindows ? 'npx.cmd' : 'npx';

    return new Promise((resolve, reject) => {
        execFile(
            npxCmd,
            ['prisma', ...args],
            {
                cwd,
                env: process.env,
                windowsHide: true,
                timeout: timeoutMs,
                maxBuffer: 1024 * 1024
            },
            (error, stdout, stderr) => {
                if (error) {
                    const combined = String(stdout || '') + (stdout && stderr ? '\n' : '') + String(stderr || '');
                    const err = new Error(combined || error.message || 'Falha ao executar Prisma CLI');
                    err.code = error.code;
                    return reject(err);
                }
                const combined = String(stdout || '') + (stdout && stderr ? '\n' : '') + String(stderr || '');
                return resolve(combined);
            }
        );
    });
}

function truncateOutput(text, maxChars = 12_000) {
    const s = String(text || '').trim();
    if (s.length <= maxChars) return s;
    return s.slice(0, maxChars) + `\n... (truncado; ${s.length - maxChars} chars omitidos)`;
}

function generateTemporaryPassword(length = 16) {
    const crypto = require('crypto');
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const hasLetter = (s) => /[A-Za-z]/.test(s);
    const hasNumber = (s) => /\d/.test(s);

    for (let attempt = 0; attempt < 20; attempt++) {
        let out = '';
        for (let i = 0; i < length; i++) {
            const idx = crypto.randomInt(0, alphabet.length);
            out += alphabet[idx];
        }
        if (hasLetter(out) && hasNumber(out)) return out;
    }

    // Fallback that always satisfies policy
    return `Savit${crypto.randomInt(10, 99)}-${crypto.randomInt(100000, 999999)}`;
}

// Get pending users (admin only)
router.get('/admin/pending-users', auth, isAdmin, adminLimiter, async (req, res) => {
    try {
        const pendingUsers = await prisma.user.findMany({
            where: { approved: false },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            users: pendingUsers.map(u => ({
                ...u,
                name: decryptString(u.name),
                email: decryptString(u.email)
            }))
        });
    } catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários pendentes.' });
    }
});

// Get all users (admin only)
router.get('/admin/users', auth, isAdmin, adminLimiter, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                approved: true,
                createdAt: true,
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            users: users.map(u => ({
                ...u,
                name: decryptString(u.name),
                email: decryptString(u.email)
            }))
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
});

// Approve user (admin only)
router.post('/admin/approve/:userId', auth, isAdmin, adminLimiter, validateParams(UserIdParam), async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.update({
            where: { id: userId },
            data: { approved: true },
            select: {
                id: true,
                email: true,
                name: true,
                approved: true
            }
        });

        res.json({
            message: 'Usuário aprovado com sucesso!',
            user: { ...user, name: decryptString(user.name), email: decryptString(user.email) }
        });

        audit('admin.user.approve', { adminId: req.user.id, userId });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ error: 'Erro ao aprovar usuário.' });
    }
});

// Reject/Delete user (admin only)
router.delete('/admin/users/:userId', auth, isAdmin, adminLimiter, validateParams(UserIdParam), async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent admin from deleting themselves
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        res.json({ message: 'Usuário removido com sucesso!' });

        audit('admin.user.delete', { adminId: req.user.id, userId });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Erro ao remover usuário.' });
    }
});

// Toggle admin role (admin only)
router.post('/admin/toggle-role/:userId', auth, isAdmin, adminLimiter, validateParams(UserIdParam), async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent admin from changing their own role
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Você não pode alterar seu próprio cargo.' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: user.role === 'admin' ? 'user' : 'admin' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        });

        res.json({
            message: 'Cargo alterado com sucesso!',
            user: { ...updatedUser, name: decryptString(updatedUser.name), email: decryptString(updatedUser.email) }
        });

        audit('admin.user.toggleRole', { adminId: req.user.id, userId, role: updatedUser.role });
    } catch (error) {
        console.error('Toggle role error:', error);
        res.status(500).json({ error: 'Erro ao alterar cargo.' });
    }
});

// Admin: reset user password (generates a temporary password by default)
router.post(
    '/admin/reset-password/:userId',
    auth,
    isAdmin,
    adminLimiter,
    validateParams(UserIdParam),
    validateBody(AdminResetUserPasswordBody),
    async (req, res) => {
        try {
            const { userId } = req.params;

            // Prefer using user self-service change password flow for the admin account.
            if (userId === req.user.id) {
                return res.status(400).json({ error: 'Para sua própria conta, use a opção de alterar senha.' });
            }

            const providedPassword = req.body?.newPassword;
            if (providedPassword && isCommonPassword(providedPassword)) {
                return res.status(400).json({ error: 'Escolha uma senha mais forte (senha muito comum).' });
            }

            const temporaryPassword = providedPassword || generateTemporaryPassword();
            const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });

            // Revoke all sessions so user must login again with the new password
            await revokeAllSessionsForUser(userId);

            audit('admin.user.resetPassword', {
                adminId: req.user.id,
                userId,
                mode: providedPassword ? 'set' : 'generated'
            });

            res.json({
                message: 'Senha redefinida com sucesso.',
                ...(providedPassword ? {} : { temporaryPassword })
            });
        } catch (error) {
            console.error('Admin reset password error:', error);
            res.status(500).json({ error: 'Erro ao redefinir senha.' });
        }
    }
);

// Admin: run database migrations (prisma migrate deploy)
router.post('/admin/migrations/deploy', auth, isAdmin, adminLimiter, async (req, res) => {
    if (migrationsRunning) {
        return res.status(409).json({ error: 'Uma migração já está em execução. Tente novamente em instantes.' });
    }

    migrationsRunning = true;
    const startedAt = Date.now();
    try {
        const schemaPath = path.join('prisma', 'schema.prisma');
        const output = await runPrismaCommand(['migrate', 'deploy', '--schema', schemaPath], { timeoutMs: 180_000 });

        audit('admin.migrations.deploy', {
            adminId: req.user.id,
            durationMs: Date.now() - startedAt
        });

        return res.json({
            message: 'Migrations aplicadas.',
            output: truncateOutput(output)
        });
    } catch (error) {
        audit('admin.migrations.deploy.fail', {
            adminId: req.user.id,
            durationMs: Date.now() - startedAt,
            code: error?.code || null
        });
        return res.status(500).json({ error: 'Falha ao aplicar migrations.', details: truncateOutput(error?.message || String(error)) });
    } finally {
        migrationsRunning = false;
    }
});

module.exports = router;
