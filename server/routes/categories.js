const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(auth);

// Get all categories with message count
router.get('/', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { userId: req.user.id },
            include: {
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        const formattedCategories = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            color: cat.color,
            messageCount: cat._count.messages,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt
        }));

        res.json({ categories: formattedCategories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Erro ao buscar categorias.' });
    }
});

// Get single category
router.get('/:id', async (req, res) => {
    try {
        const category = await prisma.category.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: {
                _count: {
                    select: { messages: true }
                }
            }
        });

        if (!category) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }

        res.json({
            category: {
                id: category.id,
                name: category.name,
                color: category.color,
                messageCount: category._count.messages,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt
            }
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Erro ao buscar categoria.' });
    }
});

// Create category
router.post('/', async (req, res) => {
    try {
        const { name, color } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
        }

        // Check if category with same name exists
        const existing = await prisma.category.findFirst({
            where: {
                name: name.trim(),
                userId: req.user.id
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Já existe uma categoria com este nome.' });
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                color: color || '#25D366',
                userId: req.user.id
            }
        });

        res.status(201).json({
            category: {
                ...category,
                messageCount: 0
            }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Erro ao criar categoria.' });
    }
});

// Update category
router.put('/:id', async (req, res) => {
    try {
        const { name, color } = req.body;

        // Verify category belongs to user
        const existing = await prisma.category.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }

        // Check for duplicate name
        if (name && name.trim() !== existing.name) {
            const duplicate = await prisma.category.findFirst({
                where: {
                    name: name.trim(),
                    userId: req.user.id,
                    NOT: { id: req.params.id }
                }
            });

            if (duplicate) {
                return res.status(400).json({ error: 'Já existe uma categoria com este nome.' });
            }
        }

        const category = await prisma.category.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name: name.trim() }),
                ...(color && { color })
            },
            include: {
                _count: {
                    select: { messages: true }
                }
            }
        });

        res.json({
            category: {
                id: category.id,
                name: category.name,
                color: category.color,
                messageCount: category._count.messages,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt
            }
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Erro ao atualizar categoria.' });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        // Verify category belongs to user
        const existing = await prisma.category.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }

        await prisma.category.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Categoria excluída com sucesso.' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Erro ao excluir categoria.' });
    }
});

module.exports = router;
