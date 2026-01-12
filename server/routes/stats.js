const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(auth);

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        
        // Start of today
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Start of this week (Monday)
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        
        // Start of this month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Total messages
        const totalMessages = await prisma.message.count({
            where: { userId }
        });

        // Messages today
        const messagesToday = await prisma.message.count({
            where: {
                userId,
                createdAt: { gte: todayStart }
            }
        });

        // Messages this week
        const messagesThisWeek = await prisma.message.count({
            where: {
                userId,
                createdAt: { gte: weekStart }
            }
        });

        // Messages this month
        const messagesThisMonth = await prisma.message.count({
            where: {
                userId,
                createdAt: { gte: monthStart }
            }
        });

        // Total tasks
        const totalTasks = await prisma.message.count({
            where: { userId, isTask: true }
        });

        // Completed tasks
        const completedTasks = await prisma.message.count({
            where: { userId, isTask: true, taskCompleted: true }
        });

        // Pending tasks
        const pendingTasks = totalTasks - completedTasks;

        // Overdue tasks
        const overdueTasks = await prisma.message.count({
            where: {
                userId,
                isTask: true,
                taskCompleted: false,
                taskDate: { lt: todayStart }
            }
        });

        // Tasks due today
        const tasksDueToday = await prisma.message.count({
            where: {
                userId,
                isTask: true,
                taskCompleted: false,
                taskDate: {
                    gte: todayStart,
                    lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        // Categories count
        const categoriesCount = await prisma.category.count({
            where: { userId }
        });

        // Messages per category
        const messagesPerCategory = await prisma.category.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                color: true,
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: {
                messages: {
                    _count: 'desc'
                }
            },
            take: 5
        });

        // Messages without category
        const uncategorizedMessages = await prisma.message.count({
            where: { userId, categoryId: null }
        });

        // Activity last 7 days
        const activityDays = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(todayStart);
            dayStart.setDate(dayStart.getDate() - i);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const count = await prisma.message.count({
                where: {
                    userId,
                    createdAt: {
                        gte: dayStart,
                        lt: dayEnd
                    }
                }
            });

            activityDays.push({
                date: dayStart.toISOString().split('T')[0],
                day: dayStart.toLocaleDateString('pt-BR', { weekday: 'short' }),
                count
            });
        }

        // Recent messages
        const recentMessages = await prisma.message.findMany({
            where: { userId },
            include: {
                category: {
                    select: { id: true, name: true, color: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // Upcoming tasks
        const upcomingTasks = await prisma.message.findMany({
            where: {
                userId,
                isTask: true,
                taskCompleted: false,
                taskDate: { gte: todayStart }
            },
            include: {
                category: {
                    select: { id: true, name: true, color: true }
                }
            },
            orderBy: { taskDate: 'asc' },
            take: 5
        });

        // Streak calculation (consecutive days with at least one message)
        let streak = 0;
        let checkDate = new Date(todayStart);
        
        while (true) {
            const dayEnd = new Date(checkDate);
            dayEnd.setDate(dayEnd.getDate() + 1);
            
            const hasMessage = await prisma.message.findFirst({
                where: {
                    userId,
                    createdAt: {
                        gte: checkDate,
                        lt: dayEnd
                    }
                }
            });

            if (hasMessage) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }

            // Limit check to 365 days
            if (streak >= 365) break;
        }

        res.json({
            stats: {
                messages: {
                    total: totalMessages,
                    today: messagesToday,
                    thisWeek: messagesThisWeek,
                    thisMonth: messagesThisMonth,
                    uncategorized: uncategorizedMessages
                },
                tasks: {
                    total: totalTasks,
                    completed: completedTasks,
                    pending: pendingTasks,
                    overdue: overdueTasks,
                    dueToday: tasksDueToday,
                    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                },
                categories: {
                    total: categoriesCount,
                    topCategories: messagesPerCategory.map(c => ({
                        id: c.id,
                        name: c.name,
                        color: c.color,
                        count: c._count.messages
                    }))
                },
                activity: {
                    last7Days: activityDays,
                    streak
                },
                recent: {
                    messages: recentMessages,
                    upcomingTasks
                }
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
    }
});

// Get activity chart data
router.get('/activity', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const userId = req.user.id;
        
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const activityData = [];
        
        for (let i = parseInt(days) - 1; i >= 0; i--) {
            const dayStart = new Date(todayStart);
            dayStart.setDate(dayStart.getDate() - i);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const messages = await prisma.message.count({
                where: {
                    userId,
                    createdAt: {
                        gte: dayStart,
                        lt: dayEnd
                    }
                }
            });

            const tasksCompleted = await prisma.message.count({
                where: {
                    userId,
                    isTask: true,
                    taskCompleted: true,
                    completedAt: {
                        gte: dayStart,
                        lt: dayEnd
                    }
                }
            });

            activityData.push({
                date: dayStart.toISOString().split('T')[0],
                messages,
                tasksCompleted
            });
        }

        res.json({ activity: activityData });
    } catch (error) {
        console.error('Activity stats error:', error);
        res.status(500).json({ error: 'Erro ao buscar atividade.' });
    }
});

module.exports = router;
