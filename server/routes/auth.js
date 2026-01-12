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

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
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
                createdAt: true
            }
        });

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

module.exports = router;
