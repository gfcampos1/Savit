import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RecurringTaskInput, RecurringTaskPatch } from '@savit/shared';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireActive } from '../middleware/billing.js';
import { HttpError } from '../middleware/error.js';

export const recurringTasksRouter: Router = Router();
recurringTasksRouter.use(requireAuth);

recurringTasksRouter.get('/', async (req, res, next) => {
  try {
    const items = await prisma.recurringTask.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isActive: 'desc' }, { weekday: 'asc' }, { createdAt: 'asc' }],
      include: { category: true },
    });
    res.json({ items: items.map(serialize) });
  } catch (err) {
    next(err);
  }
});

recurringTasksRouter.post('/', requireActive, async (req, res, next) => {
  try {
    const input = RecurringTaskInput.parse(req.body);
    if (input.categoryId) await assertOwnsCategory(req.user!.id, input.categoryId);

    const created = await prisma.recurringTask.create({
      data: {
        userId: req.user!.id,
        title: input.title,
        description: input.description ?? null,
        categoryId: input.categoryId ?? null,
        priority: input.priority ?? null,
        weekday: input.weekday,
        nextRunAt: nextOccurrence(input.weekday),
      },
      include: { category: true },
    });
    res.status(201).json(serialize(created));
  } catch (err) {
    next(err);
  }
});

recurringTasksRouter.patch('/:id', requireActive, async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const patch = RecurringTaskPatch.parse(req.body);
    const existing = await prisma.recurringTask.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) throw new HttpError(404, 'not_found');
    if (patch.categoryId !== undefined && patch.categoryId !== null) {
      await assertOwnsCategory(req.user!.id, patch.categoryId);
    }

    const data: Prisma.RecurringTaskUpdateInput = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.description !== undefined) data.description = patch.description;
    if (patch.priority !== undefined) data.priority = patch.priority;
    if (patch.categoryId !== undefined) {
      data.category = patch.categoryId
        ? { connect: { id: patch.categoryId } }
        : { disconnect: true };
    }
    if (patch.isActive !== undefined) data.isActive = patch.isActive;
    if (patch.weekday !== undefined) {
      data.weekday = patch.weekday;
      // mudou de dia? recalcula nextRunAt pra próxima ocorrência do novo dia
      data.nextRunAt = nextOccurrence(patch.weekday);
    }

    const updated = await prisma.recurringTask.update({
      where: { id },
      data,
      include: { category: true },
    });
    res.json(serialize(updated));
  } catch (err) {
    next(err);
  }
});

recurringTasksRouter.delete('/:id', requireActive, async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const existing = await prisma.recurringTask.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!existing) throw new HttpError(404, 'not_found');
    await prisma.recurringTask.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ----- helpers -----

async function assertOwnsCategory(userId: string, categoryId: string): Promise<void> {
  const cat = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!cat) throw new HttpError(400, 'invalid_category');
}

/**
 * Próxima ocorrência semanal do `weekday` (0=domingo..6=sábado), sempre no
 * futuro estrito e ancorada em 00:00 UTC do dia alvo. Hora UTC fixa garante
 * que o cron diário (que roda cedo manhã UTC) pegue a entrada na mesma data
 * alvo, sem off-by-one por timezone do servidor.
 */
function nextOccurrence(weekday: number, now: Date = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  const today = d.getUTCDay();
  let diff = (weekday - today + 7) % 7;
  if (diff === 0) diff = 7; // hoje? agenda pra semana que vem
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

type RtWithCategory = Prisma.RecurringTaskGetPayload<{ include: { category: true } }>;

function serialize(r: RtWithCategory) {
  return {
    id: r.id,
    userId: r.userId,
    categoryId: r.categoryId,
    title: r.title,
    description: r.description,
    priority: r.priority,
    weekday: r.weekday,
    isActive: r.isActive,
    nextRunAt: r.nextRunAt.toISOString(),
    lastRunAt: r.lastRunAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    category: r.category
      ? {
          id: r.category.id,
          name: r.category.name,
          color: r.category.color,
          icon: r.category.icon,
          slug: r.category.slug,
        }
      : null,
  };
}
