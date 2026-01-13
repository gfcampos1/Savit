const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Set cookie options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
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
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
                role: isFirstUser ? 'admin' : 'user',
                approved: isFirstUser, // First user is auto-approved
                // Create default categories
                categories: {
                    create: [
                        { name: 'Pessoal', color: '#25D366' },
                        { name: 'Trabalho', color: '#34B7F1' },
                        { name: 'Ideias', color: '#9C27B0' }
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
            return res.status(201).json({
                message: 'Conta criada! Aguarde a aprovação do administrador.',
                pendingApproval: true
            });
        }

        // Generate token
        const token = generateToken(user.id);

        // Set cookie
        res.cookie('token', token, cookieOptions);

        res.status(201).json({
            message: 'Conta criada com sucesso!',
            user,
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro ao criar conta.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Email ou senha incorretos.' });
        }

        // Check if user is approved
        if (!user.approved) {
            return res.status(403).json({ 
                error: 'Sua conta ainda não foi aprovada pelo administrador.',
                pendingApproval: true
            });
        }

        // Generate token
        const token = generateToken(user.id);

        // Set cookie
        res.cookie('token', token, cookieOptions);

        res.json({
            message: 'Login realizado com sucesso!',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
                createdAt: user.createdAt
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout realizado com sucesso!' });
});

// Get current user
router.get('/me', auth, async (req, res) => {
    res.json({ user: req.user });
});

// Update profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, avatar } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name }),
                ...(avatar !== undefined && { avatar })
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                createdAt: true
            }
        });

        res.json({ user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
});

// Change password
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Senhas são obrigatórias.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
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

        res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Erro ao alterar senha.' });
    }
});

// Admin middleware
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    next();
};

// Get pending users (admin only)
router.get('/admin/pending-users', auth, isAdmin, async (req, res) => {
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

        res.json({ users: pendingUsers });
    } catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários pendentes.' });
    }
});

// Get all users (admin only)
router.get('/admin/users', auth, isAdmin, async (req, res) => {
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

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
});

// Approve user (admin only)
router.post('/admin/approve/:userId', auth, isAdmin, async (req, res) => {
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

        res.json({ message: 'Usuário aprovado com sucesso!', user });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ error: 'Erro ao aprovar usuário.' });
    }
});

// Reject/Delete user (admin only)
router.delete('/admin/users/:userId', auth, isAdmin, async (req, res) => {
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
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Erro ao remover usuário.' });
    }
});

// Toggle admin role (admin only)
router.post('/admin/toggle-role/:userId', auth, isAdmin, async (req, res) => {
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

        res.json({ message: 'Cargo alterado com sucesso!', user: updatedUser });
    } catch (error) {
        console.error('Toggle role error:', error);
        res.status(500).json({ error: 'Erro ao alterar cargo.' });
    }
});

module.exports = router;
