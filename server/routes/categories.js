const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { validateBody, validateParams } = require('../middleware/validate');
const { writeLimiter } = require('../middleware/rateLimiters');
const {
    CategoryCreateBody,
    CategoryUpdateBody,
    CategorySectionCreateBody,
    CategorySectionUpdateBody,
    CategorySectionReorderBody,
    IdParam
} = require('../utils/schemas');
const { encryptString, decryptString, hmacNormalized } = require('../utils/crypto');
const { normalizeHexColor } = require('../utils/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(auth);

async function requireSectionOwnedByUser(sectionId, userId) {
    if (!sectionId) return null;
    const section = await prisma.categorySection.findFirst({
        where: { id: sectionId, userId }
    });
    return section || null;
}

// Get all category sections
router.get('/sections', async (req, res) => {
    try {
        const sections = await prisma.categorySection.findMany({
            where: { userId: req.user.id },
            orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
            include: {
                _count: { select: { categories: true } }
            }
        });

        res.json({
            sections: sections.map((s) => ({
                id: s.id,
                name: decryptString(s.name),
                color: s.color,
                position: s.position,
                categoryCount: s._count.categories,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt
            }))
        });
    } catch (error) {
        console.error('Get category sections error:', error);
        res.status(500).json({ error: 'Erro ao buscar seções.' });
    }
});

// Create category section
router.post('/sections', writeLimiter, validateBody(CategorySectionCreateBody), async (req, res) => {
    try {
        const { name, color } = req.body;
        const nameHash = hmacNormalized(name);

        const dup = await prisma.categorySection.findFirst({
            where: { userId: req.user.id, nameHash }
        });
        if (dup) {
            return res.status(400).json({ error: 'Já existe uma seção com este nome.' });
        }

        const maxPos = await prisma.categorySection.findFirst({
            where: { userId: req.user.id },
            orderBy: { position: 'desc' },
            select: { position: true }
        });
        const nextPosition = (maxPos?.position ?? -1) + 1;

        const section = await prisma.categorySection.create({
            data: {
                name: encryptString(name),
                nameHash,
                color: normalizeHexColor(color) || '#25D366',
                position: nextPosition,
                userId: req.user.id
            },
            include: { _count: { select: { categories: true } } }
        });

        res.status(201).json({
            section: {
                id: section.id,
                name: decryptString(section.name),
                color: section.color,
                position: section.position,
                categoryCount: section._count.categories,
                createdAt: section.createdAt,
                updatedAt: section.updatedAt
            }
        });
    } catch (error) {
        console.error('Create category section error:', error);
        res.status(500).json({ error: 'Erro ao criar seção.' });
    }
});

// Update category section
router.put('/sections/:id', validateParams(IdParam), writeLimiter, validateBody(CategorySectionUpdateBody), async (req, res) => {
    try {
        const { name, color } = req.body;

        const existing = await prisma.categorySection.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Seção não encontrada.' });
        }

        let nextHash;
        if (name !== undefined) {
            nextHash = hmacNormalized(name);
            const duplicate = await prisma.categorySection.findFirst({
                where: {
                    userId: req.user.id,
                    nameHash: nextHash,
                    NOT: { id: req.params.id }
                }
            });
            if (duplicate) {
                return res.status(400).json({ error: 'Já existe uma seção com este nome.' });
            }
        }

        const section = await prisma.categorySection.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined ? { name: encryptString(name), nameHash: nextHash } : {}),
                ...(color !== undefined ? { color: normalizeHexColor(color) } : {})
            },
            include: { _count: { select: { categories: true } } }
        });

        // If color was updated, update all categories in this section to inherit the new color
        if (color !== undefined) {
            await prisma.category.updateMany({
                where: { sectionId: req.params.id, userId: req.user.id },
                data: { color: normalizeHexColor(color) }
            });
        }

        res.json({
            section: {
                id: section.id,
                name: decryptString(section.name),
                color: section.color,
                position: section.position,
                categoryCount: section._count.categories,
                createdAt: section.createdAt,
                updatedAt: section.updatedAt
            }
        });
    } catch (error) {
        console.error('Update category section error:', error);
        res.status(500).json({ error: 'Erro ao atualizar seção.' });
    }
});

// Delete category section
router.delete('/sections/:id', validateParams(IdParam), writeLimiter, async (req, res) => {
    try {
        const existing = await prisma.categorySection.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Seção não encontrada.' });
        }

        await prisma.$transaction([
            prisma.category.updateMany({
                where: { userId: req.user.id, sectionId: req.params.id },
                data: { sectionId: null }
            }),
            prisma.categorySection.delete({ where: { id: req.params.id } })
        ]);

        res.json({ message: 'Seção excluída com sucesso.' });
    } catch (error) {
        console.error('Delete category section error:', error);
        res.status(500).json({ error: 'Erro ao excluir seção.' });
    }
});

// Reorder category sections
router.post('/sections/reorder', writeLimiter, validateBody(CategorySectionReorderBody), async (req, res) => {
    try {
        const orderedIds = Array.isArray(req.body.orderedIds) ? req.body.orderedIds : [];
        if (orderedIds.length === 0) {
            return res.json({ message: 'Ok' });
        }

        const owned = await prisma.categorySection.findMany({
            where: { userId: req.user.id, id: { in: orderedIds } },
            select: { id: true }
        });
        if (owned.length !== orderedIds.length) {
            return res.status(400).json({ error: 'Lista de seções inválida.' });
        }

        await prisma.$transaction(
            orderedIds.map((id, idx) =>
                prisma.categorySection.update({
                    where: { id },
                    data: { position: idx }
                })
            )
        );

        res.json({ message: 'Ok' });
    } catch (error) {
        console.error('Reorder category sections error:', error);
        res.status(500).json({ error: 'Erro ao reordenar seções.' });
    }
});

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
            sectionId: cat.sectionId || null,
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
                sectionId: category.sectionId || null,
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
        const { name, color, sectionId } = req.body;

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

        let finalSectionId = null;
        let finalColor = '#25D366'; // Default color
        if (sectionId) {
            const section = await requireSectionOwnedByUser(sectionId, req.user.id);
            if (!section) {
                return res.status(400).json({ error: 'Seção inválida.' });
            }
            finalSectionId = section.id;
            finalColor = section.color || '#25D366'; // Inherit color from section
        }

        const category = await prisma.category.create({
            data: {
                name: encryptString(name),
                nameHash,
                color: normalizeHexColor(finalColor),
                userId: req.user.id,
                sectionId: finalSectionId
            }
        });

        res.status(201).json({
            category: {
                ...category,
                name: decryptString(category.name),
                messageCount: 0,
                sectionId: category.sectionId || null
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
        const { name, color, sectionId } = req.body;

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

        let finalSectionId = undefined;
        let inheritedColor = undefined;
        if (sectionId !== undefined) {
            if (sectionId === null) {
                finalSectionId = null;
                inheritedColor = '#25D366'; // Default color when removing from section
            } else {
                const section = await requireSectionOwnedByUser(sectionId, req.user.id);
                if (!section) {
                    return res.status(400).json({ error: 'Seção inválida.' });
                }
                finalSectionId = section.id;
                inheritedColor = section.color || '#25D366'; // Inherit color from section
            }
        }

        const category = await prisma.category.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined ? { name: encryptString(name), nameHash: nextHash } : {}),
                ...(inheritedColor !== undefined ? { color: normalizeHexColor(inheritedColor) } : {}),
                ...(finalSectionId !== undefined ? { sectionId: finalSectionId } : {})
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
                sectionId: category.sectionId || null,
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
