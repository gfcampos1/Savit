import { Router } from 'express';
import { z } from 'zod';
import type { Prisma, TaskStatus as PrismaTaskStatus } from '@prisma/client';
import { TaskInput, TaskMoveInput, TaskPatch } from '@savit/shared';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireActive } from '../middleware/billing.js';
import { HttpError } from '../middleware/error.js';

export const tasksRouter: Router = Router();
tasksRouter.use(requireAuth);

const ListQuery = z.object({
  status: z.enum(['TODAY', 'UPCOMING', 'SOMEDAY', 'DONE', 'ARCHIVED']).optional(),
  column: z.string().min(1).max(40).optional(),
  includeDone: z.coerce.boolean().default(false),
});

tasksRouter.get('/', async (req, res, next) => {
  try {
    const { status, column, includeDone } = ListQuery.parse(req.query);
    const where: Prisma.TaskWhereInput = { userId: req.user!.id };
    if (status) where.status = status as PrismaTaskStatus;
    if (column) where.column = column;
    if (!includeDone && !status) where.status = { notIn: ['DONE', 'ARCHIVED'] };

    const items = await prisma.task.findMany({
      where,
      orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { category: true },
    });
    res.json({ items: items.map(serialize) });
  } catch (err) {
    next(err);
  }
});

tasksRouter.post('/', requireActive, async (req, res, next) => {
  try {
    const input = TaskInput.parse(req.body);
    if (input.categoryId) await assertOwnsCategory(req.user!.id, input.categoryId);
    if (input.noteId) await assertOwnsNote(req.user!.id, input.noteId);

    // sortOrder = max + 1 dentro da coluna (default no fim)
    const last = await prisma.task.aggregate({
      where: { userId: req.user!.id, column: input.column ?? 'hoje' },
      _max: { sortOrder: true },
    });
    const sortOrder = input.sortOrder ?? (last._max.sortOrder ?? -1) + 1;

    const created = await prisma.task.create({
      data: {
        userId: req.user!.id,
        title: input.title,
        description: input.description ?? null,
        status: (input.status ?? 'TODAY') as PrismaTaskStatus,
        column: input.column ?? 'hoje',
        sortOrder,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        priority: input.priority ?? null,
        reminderMinBefore: input.reminderMinBefore ?? null,
        categoryId: input.categoryId ?? null,
        noteId: input.noteId ?? null,
      },
      include: { category: true },
    });

    res.status(201).json(serialize(created));
  } catch (err) {
    next(err);
  }
});

tasksRouter.patch('/:id', requireActive, async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const patch = TaskPatch.parse(req.body);
    const existing = await prisma.task.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) throw new HttpError(404, 'not_found');
    if (patch.categoryId !== undefined && patch.categoryId !== null) {
      await assertOwnsCategory(req.user!.id, patch.categoryId);
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.description !== undefined && { description: patch.description }),
        ...(patch.status !== undefined && {
          status: patch.status as PrismaTaskStatus,
          completedAt: patch.status === 'DONE' ? new Date() : null,
        }),
        ...(patch.column !== undefined && { column: patch.column }),
        ...(patch.sortOrder !== undefined && { sortOrder: patch.sortOrder }),
        ...(patch.dueAt !== undefined && { dueAt: patch.dueAt ? new Date(patch.dueAt) : null }),
        ...(patch.priority !== undefined && { priority: patch.priority }),
        ...(patch.reminderMinBefore !== undefined && { reminderMinBefore: patch.reminderMinBefore }),
        ...(patch.categoryId !== undefined && { categoryId: patch.categoryId }),
      },
      include: { category: true },
    });
    res.json(serialize(updated));
  } catch (err) {
    next(err);
  }
});

/**
 * Move uma tarefa entre colunas/posições do kanban.
 * - Se a coluna nova for temporal (hoje/amanha/semana) e o cliente não passou
 *   `dueAt`, ajustamos automaticamente pra manhã do dia destino.
 * - Re-numeramos sortOrder na coluna destino pra acomodar o novo item.
 */
tasksRouter.patch('/:id/move', requireActive, async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const input = TaskMoveInput.parse(req.body);
    const existing = await prisma.task.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) throw new HttpError(404, 'not_found');

    const data: Prisma.TaskUpdateInput = {
      column: input.column,
      sortOrder: input.sortOrder,
    };

    // Status segue a coluna (ex: arrastar pra "concluidas" marca DONE)
    const statusByColumn: Record<string, PrismaTaskStatus | undefined> = {
      hoje: 'TODAY',
      amanha: 'UPCOMING',
      semana: 'UPCOMING',
      'sem-prazo': 'SOMEDAY',
      concluidas: 'DONE',
      arquivadas: 'ARCHIVED',
    };
    const newStatus = statusByColumn[input.column];
    if (newStatus) {
      data.status = newStatus;
      data.completedAt = newStatus === 'DONE' ? new Date() : null;
    }

    // dueAt: cliente passou explicitamente vence; senão calculamos pela coluna
    if (input.dueAt !== undefined) {
      data.dueAt = input.dueAt ? new Date(input.dueAt) : null;
    } else {
      const next = computeDueAtForColumn(input.column);
      if (next !== undefined) data.dueAt = next;
    }

    // Re-numera os sortOrder dos vizinhos na coluna destino pra abrir espaço
    await prisma.$transaction(async (tx) => {
      // empurra todos com sortOrder >= input.sortOrder na coluna destino
      await tx.task.updateMany({
        where: {
          userId: req.user!.id,
          column: input.column,
          sortOrder: { gte: input.sortOrder },
          NOT: { id },
        },
        data: { sortOrder: { increment: 1 } },
      });
      await tx.task.update({ where: { id }, data });
    });

    const updated = await prisma.task.findUnique({
      where: { id },
      include: { category: true },
    });
    res.json(serialize(updated!));
  } catch (err) {
    next(err);
  }
});

tasksRouter.delete('/:id', requireActive, async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const existing = await prisma.task.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) throw new HttpError(404, 'not_found');
    await prisma.task.delete({ where: { id } });
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

async function assertOwnsNote(userId: string, noteId: string): Promise<void> {
  const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
  if (!note) throw new HttpError(400, 'invalid_note');
}

/**
 * Default dueAt para colunas temporais: manhã (09:00) do dia destino.
 * undefined = não toca em dueAt. null = limpa.
 */
function computeDueAtForColumn(column: string): Date | null | undefined {
  const now = new Date();
  const morning = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(9, 0, 0, 0);
    return d;
  };

  switch (column) {
    case 'hoje':
      return morning(0);
    case 'amanha':
      return morning(1);
    case 'semana': {
      // próximo dia útil até o final da semana corrente; senão segunda da próxima
      const dow = now.getDay(); // 0=dom..6=sab
      const diasAteSexta = (5 - dow + 7) % 7;
      return morning(Math.max(diasAteSexta, 2));
    }
    case 'sem-prazo':
      return null;
    default:
      return undefined;
  }
}

type TaskWithCategory = Prisma.TaskGetPayload<{ include: { category: true } }>;

function serialize(t: TaskWithCategory) {
  return {
    id: t.id,
    noteId: t.noteId,
    categoryId: t.categoryId,
    title: t.title,
    description: t.description,
    status: t.status,
    column: t.column,
    sortOrder: t.sortOrder,
    dueAt: t.dueAt?.toISOString() ?? null,
    priority: t.priority,
    reminderMinBefore: t.reminderMinBefore,
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    category: t.category
      ? {
          id: t.category.id,
          name: t.category.name,
          color: t.category.color,
          icon: t.category.icon,
        }
      : null,
  };
}
