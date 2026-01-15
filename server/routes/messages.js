const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');
const { writeLimiter, readHeavyLimiter } = require('../middleware/rateLimiters');
const { MessageCreateBody, MessageUpdateBody, MessagesQuery, IdParam } = require('../utils/schemas');
const { encryptString, decryptString } = require('../utils/crypto');
const { normalizeStoredText } = require('../utils/richText');

const router = express.Router();
const prisma = new PrismaClient();

function decryptCategory(cat) {
    if (!cat) return cat;
    return {
        ...cat,
        name: decryptString(cat.name)
    };
}

function decryptMessage(msg) {
    const decryptedText = decryptString(msg.text);
    const decryptedImagesRaw = decryptString(msg.images);
    let imagesArray = [];
    try {
        imagesArray = decryptedImagesRaw ? JSON.parse(decryptedImagesRaw) : [];
    } catch {
        imagesArray = [];
    }

    return {
        ...msg,
        text: decryptedText,
        images: imagesArray,
        category: decryptCategory(msg.category)
    };
}

// Apply auth middleware to all routes
router.use(auth);

// Get all messages
router.get('/', readHeavyLimiter, validateQuery(MessagesQuery), async (req, res) => {
    try {
        const { categoryId, search, date, isTask, limit = 100, offset = 0 } = req.query;

        const where = {
            userId: req.user.id
        };

        // Filter by category
        if (categoryId) {
            where.categoryId = categoryId;
        }

        // Filter by task
        if (isTask === 'true') {
            where.isTask = true;
        }

        // Filter by date
        if (date) {
            const startDate = new Date(date);
            if (Number.isNaN(startDate.getTime())) {
                return res.status(400).json({ error: 'Data inválida.' });
            }
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            
            where.createdAt = {
                gte: startDate,
                lt: endDate
            };
        }

        const parsedLimit = Math.max(1, Math.min(Number(limit) || 100, 200));
        const parsedOffset = Math.max(0, Number(offset) || 0);

        // If searching, we need to filter after decrypting (DB can't search ciphertext).
        const take = search ? Math.min(parsedLimit + parsedOffset, 500) : parsedLimit;
        const skip = search ? 0 : parsedOffset;

        const messages = await prisma.message.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' },
            take,
            skip
        });

        let decrypted = messages.map(decryptMessage);

        if (search) {
            const q = String(search).toLowerCase();
            decrypted = decrypted.filter(m => (m.text || '').toLowerCase().includes(q));
        }

        const paged = search ? decrypted.slice(parsedOffset, parsedOffset + parsedLimit) : decrypted;
        res.json({ messages: paged });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens.' });
    }
});

// Get single message
router.get('/:id', validateParams(IdParam), async (req, res) => {
    try {
        const message = await prisma.message.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                }
            }
        });

        if (!message) {
            return res.status(404).json({ error: 'Mensagem não encontrada.' });
        }

        res.json({ message: decryptMessage(message) });
    } catch (error) {
        console.error('Get message error:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagem.' });
    }
});

// Create message
router.post('/', writeLimiter, validateBody(MessageCreateBody), async (req, res) => {
    try {
        const { text, categoryId, isTask, taskDate, taskTime, images } = req.body;

        // Verify category belongs to user if provided
        if (categoryId) {
            const category = await prisma.category.findFirst({
                where: { id: categoryId, userId: req.user.id }
            });
            if (!category) {
                return res.status(400).json({ error: 'Categoria inválida.' });
            }
        }

        const safeImages = Array.isArray(images) ? images : [];

        let taskDateValue = null;
        if (taskDate) {
            const d = new Date(taskDate);
            if (Number.isNaN(d.getTime())) {
                return res.status(400).json({ error: 'Data da tarefa inválida.' });
            }
            taskDateValue = d;
        }

        const message = await prisma.message.create({
            data: {
                text: encryptString(normalizeStoredText(text)),
                images: safeImages.length > 0 ? encryptString(JSON.stringify(safeImages)) : null,
                categoryId: categoryId || null,
                isTask: isTask || false,
                taskDate: taskDateValue,
                taskTime: taskTime || null,
                userId: req.user.id
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                }
            }
        });

        res.status(201).json({ message: decryptMessage(message) });
    } catch (error) {
        console.error('Create message error:', error);
        res.status(500).json({ error: 'Erro ao criar mensagem.' });
    }
});

// Update message
router.put('/:id', validateParams(IdParam), writeLimiter, validateBody(MessageUpdateBody), async (req, res) => {
    try {
        const { text, categoryId, isTask, taskDate, taskTime, taskCompleted, images } = req.body;

        // Verify message belongs to user
        const existingMessage = await prisma.message.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!existingMessage) {
            return res.status(404).json({ error: 'Mensagem não encontrada.' });
        }

        // Verify category belongs to user if provided
        if (categoryId) {
            const category = await prisma.category.findFirst({
                where: { id: categoryId, userId: req.user.id }
            });
            if (!category) {
                return res.status(400).json({ error: 'Categoria inválida.' });
            }
        }

        const updateData = {};
        
        if (text !== undefined) updateData.text = encryptString(normalizeStoredText(text));
        if (categoryId !== undefined) updateData.categoryId = categoryId || null;
        if (isTask !== undefined) updateData.isTask = isTask;
        if (taskDate !== undefined) {
            if (taskDate) {
                const d = new Date(taskDate);
                if (Number.isNaN(d.getTime())) {
                    return res.status(400).json({ error: 'Data da tarefa inválida.' });
                }
                updateData.taskDate = d;
            } else {
                updateData.taskDate = null;
            }
        }
        if (taskTime !== undefined) updateData.taskTime = taskTime || null;
        if (images !== undefined) {
            updateData.images = (Array.isArray(images) && images.length > 0)
                ? encryptString(JSON.stringify(images))
                : null;
        }
        if (taskCompleted !== undefined) {
            updateData.taskCompleted = taskCompleted;
            updateData.completedAt = taskCompleted ? new Date() : null;
        }

        const message = await prisma.message.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                }
            }
        });

        res.json({ message: decryptMessage(message) });
    } catch (error) {
        console.error('Update message error:', error);
        res.status(500).json({ error: 'Erro ao atualizar mensagem.' });
    }
});

// Toggle task completion
router.patch('/:id/toggle', validateParams(IdParam), writeLimiter, async (req, res) => {
    try {
        // Verify message belongs to user
        const existingMessage = await prisma.message.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!existingMessage) {
            return res.status(404).json({ error: 'Mensagem não encontrada.' });
        }

        if (!existingMessage.isTask) {
            return res.status(400).json({ error: 'Esta mensagem não é uma tarefa.' });
        }

        const message = await prisma.message.update({
            where: { id: req.params.id },
            data: {
                taskCompleted: !existingMessage.taskCompleted,
                completedAt: !existingMessage.taskCompleted ? new Date() : null
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                }
            }
        });

        res.json({ message: decryptMessage(message) });
    } catch (error) {
        console.error('Toggle task error:', error);
        res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
    }
});

// Delete message
router.delete('/:id', validateParams(IdParam), writeLimiter, async (req, res) => {
    try {
        // Verify message belongs to user
        const existingMessage = await prisma.message.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!existingMessage) {
            return res.status(404).json({ error: 'Mensagem não encontrada.' });
        }

        await prisma.message.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Mensagem excluída com sucesso.' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Erro ao excluir mensagem.' });
    }
});

module.exports = router;
