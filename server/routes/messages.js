const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(auth);

// Get all messages
router.get('/', async (req, res) => {
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
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            
            where.createdAt = {
                gte: startDate,
                lt: endDate
            };
        }

        // Search in text
        if (search) {
            where.text = {
                contains: search,
                mode: 'insensitive'
            };
        }

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
            take: parseInt(limit),
            skip: parseInt(offset)
        });

        res.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens.' });
    }
});

// Get single message
router.get('/:id', async (req, res) => {
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

        res.json({ message });
    } catch (error) {
        console.error('Get message error:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagem.' });
    }
});

// Create message
router.post('/', async (req, res) => {
    try {
        const { text, categoryId, isTask, taskDate, taskTime } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'O texto da mensagem é obrigatório.' });
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

        const message = await prisma.message.create({
            data: {
                text: text.trim(),
                categoryId: categoryId || null,
                isTask: isTask || false,
                taskDate: taskDate ? new Date(taskDate) : null,
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

        res.status(201).json({ message });
    } catch (error) {
        console.error('Create message error:', error);
        res.status(500).json({ error: 'Erro ao criar mensagem.' });
    }
});

// Update message
router.put('/:id', async (req, res) => {
    try {
        const { text, categoryId, isTask, taskDate, taskTime, taskCompleted } = req.body;

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
        
        if (text !== undefined) updateData.text = text.trim();
        if (categoryId !== undefined) updateData.categoryId = categoryId || null;
        if (isTask !== undefined) updateData.isTask = isTask;
        if (taskDate !== undefined) updateData.taskDate = taskDate ? new Date(taskDate) : null;
        if (taskTime !== undefined) updateData.taskTime = taskTime || null;
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

        res.json({ message });
    } catch (error) {
        console.error('Update message error:', error);
        res.status(500).json({ error: 'Erro ao atualizar mensagem.' });
    }
});

// Toggle task completion
router.patch('/:id/toggle', async (req, res) => {
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

        res.json({ message });
    } catch (error) {
        console.error('Toggle task error:', error);
        res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
    }
});

// Delete message
router.delete('/:id', async (req, res) => {
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
