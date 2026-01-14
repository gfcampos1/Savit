const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { decryptString } = require('../utils/crypto');

const prisma = new PrismaClient();

const auth = async (req, res, next) => {
    try {
        // Cookie-only auth (httpOnly JWT). Avoid Authorization header tokens.
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: 'Acesso não autorizado. Faça login.' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: 'JWT_SECRET não configurado no servidor.' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                mfaEnabled: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        // Decrypt sensitive fields (best-effort)
        req.user = {
            ...user,
            name: decryptString(user.name),
            avatar: decryptString(user.avatar),
            email: decryptString(user.email)
        };
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Erro de autenticação.' });
    }
};

module.exports = auth;
