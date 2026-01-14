const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { validateBody, validateParams } = require('../middleware/validate');
const { writeLimiter } = require('../middleware/rateLimiters');
const { CategoryCreateBody, CategoryUpdateBody, IdParam } = require('../utils/schemas');
const { encryptString, decryptString, hmacNormalized } = require('../utils/crypto');
const { normalizeHexColor } = require('../utils/validation');

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
            }
        });

        const formattedCategories = categories.map(cat => ({
            id: cat.id,
            name: decryptString(cat.name),
            color: cat.color,
            messageCount: cat._count.messages,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt
        }))
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

        res.json({ categories: formattedCategories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Erro ao buscar categorias.' });
    }
});

// Get single category
router.get('/:id', validateParams(IdParam), async (req, res) => {
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
                name: decryptString(category.name),
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
router.post('/', writeLimiter, validateBody(CategoryCreateBody), async (req, res) => {
    try {
        const { name, color } = req.body;

        const nameHash = hmacNormalized(name);

        // Check if category with same name exists (by hash)
        const existing = await prisma.category.findFirst({
            where: {
                nameHash,
                userId: req.user.id
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Já existe uma categoria com este nome.' });
        }

        const category = await prisma.category.create({
            data: {
                name: encryptString(name),
                nameHash,
                color: normalizeHexColor(color),
                userId: req.user.id
            }
        });

        res.status(201).json({
            category: {
                ...category,
                name: decryptString(category.name),
                messageCount: 0
            }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Erro ao criar categoria.' });
    }
});

// Update category
router.put('/:id', validateParams(IdParam), writeLimiter, validateBody(CategoryUpdateBody), async (req, res) => {
    try {
        const { name, color } = req.body;

        // Verify category belongs to user
        const existing = await prisma.category.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Categoria não encontrada.' });
        }

        // Check for duplicate name (by hash)
        let nextHash;
        if (name !== undefined) {
            nextHash = hmacNormalized(name);
            const duplicate = await prisma.category.findFirst({
                where: {
                    nameHash: nextHash,
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
                ...(name !== undefined ? { name: encryptString(name), nameHash: nextHash } : {}),
                ...(color !== undefined ? { color: normalizeHexColor(color, existing.color || '#25D366') } : {})
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
                name: decryptString(category.name),
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
router.delete('/:id', validateParams(IdParam), writeLimiter, async (req, res) => {
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
