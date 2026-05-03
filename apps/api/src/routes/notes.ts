import { Router } from 'express';
import { z } from 'zod';
import { Prisma, type NoteType } from '@prisma/client';
import { NoteInput, NotePatch } from '@savit/shared';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { requireActive } from '../middleware/billing.js';
import { HttpError } from '../middleware/error.js';
import { publicUrlFor } from '../services/r2.js';

export const notesRouter: Router = Router();
notesRouter.use(requireAuth);

const ListQuery = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  type: z.enum(['TEXT', 'VOICE', 'DRAWING', 'MINDMAP', 'PHOTO', 'MIXED']).optional(),
  categoryId: z.string().cuid().optional(),
  q: z.string().min(1).max(200).optional(),
  includeArchived: z.coerce.boolean().default(false),
});

notesRouter.get('/', async (req, res, next) => {
  try {
    const { cursor, limit, type, categoryId, q, includeArchived } = ListQuery.parse(req.query);
    const where: Prisma.NoteWhereInput = { userId: req.user!.id };
    if (!includeArchived) where.archivedAt = null;
    if (type) where.type = type as NoteType;
    if (categoryId) where.categoryId = categoryId;
    if (q) where.contentText = { contains: q, mode: 'insensitive' };

    const items = await prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: { category: true },
    });

    const hasMore = items.length > limit;
    const trimmed = hasMore ? items.slice(0, -1) : items;

    res.json({
      items: trimmed.map(serialize),
      nextCursor: hasMore ? trimmed[trimmed.length - 1]!.id : null,
    });
  } catch (err) {
    next(err);
  }
});

notesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const note = await prisma.note.findFirst({
      where: { id, userId: req.user!.id },
      include: { category: true, attachments: true },
    });
    if (!note) throw new HttpError(404, 'not_found');
    res.json(serialize(note));
  } catch (err) {
    next(err);
  }
});

notesRouter.post('/', requireActive, async (req, res, next) => {
  try {
    const input = NoteInput.parse(req.body);
    if (input.categoryId) await assertOwnsCategory(req.user!.id, input.categoryId);

    const created = await prisma.note.create({
      data: {
        userId: req.user!.id,
        type: (input.type ?? 'TEXT') as NoteType,
        title: input.title ?? null,
        contentJson:
          input.contentJson === undefined || input.contentJson === null
            ? Prisma.JsonNull
            : (input.contentJson as Prisma.InputJsonValue),
        contentText: input.contentText ?? null,
        rawInput: input.rawInput ?? null,
        categoryId: input.categoryId ?? null,
        priority: input.priority ?? null,
      },
      include: { category: true },
    });
    res.status(201).json(serialize(created));
  } catch (err) {
    next(err);
  }
});

notesRouter.patch('/:id', requireActive, async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const patch = NotePatch.parse(req.body);
    const existing = await prisma.note.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) throw new HttpError(404, 'not_found');
    if (patch.categoryId !== undefined && patch.categoryId !== null) {
      await assertOwnsCategory(req.user!.id, patch.categoryId);
    }
    const updated = await prisma.note.update({
      where: { id },
      data: {
        ...(patch.type !== undefined && { type: patch.type as NoteType }),
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.contentJson !== undefined && {
          contentJson:
            patch.contentJson === null
              ? Prisma.JsonNull
              : (patch.contentJson as Prisma.InputJsonValue),
        }),
        ...(patch.contentText !== undefined && { contentText: patch.contentText }),
        ...(patch.rawInput !== undefined && { rawInput: patch.rawInput }),
        ...(patch.categoryId !== undefined && { categoryId: patch.categoryId }),
        ...(patch.priority !== undefined && { priority: patch.priority }),
      },
      include: { category: true },
    });
    res.json(serialize(updated));
  } catch (err) {
    next(err);
  }
});

/**
 * Converte uma nota em tarefa: cria um registro Task linkado ao note (`noteId`).
 * Não apaga a nota — relação opcional permite duas vidas paralelas.
 */
const ConvertInput = z.object({
  dueAt: z.string().datetime().nullable().optional(),
  column: z.string().min(1).max(40).optional(),
  title: z.string().min(1).max(200).optional(),
});

notesRouter.post('/:id/convert-to-task', requireActive, async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const input = ConvertInput.parse(req.body ?? {});

    const note = await prisma.note.findFirst({
      where: { id, userId: req.user!.id },
      include: { category: true },
    });
    if (!note) throw new HttpError(404, 'not_found');

    const title =
      input.title?.trim() ||
      note.title?.trim() ||
      (note.contentText ?? '').trim().split(/\n/)[0]?.slice(0, 200) ||
      'Sem título';

    const column = input.column ?? 'hoje';
    const last = await prisma.task.aggregate({
      where: { userId: req.user!.id, column },
      _max: { sortOrder: true },
    });

    const created = await prisma.task.create({
      data: {
        userId: req.user!.id,
        noteId: note.id,
        categoryId: note.categoryId ?? null,
        title,
        column,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        priority: note.priority,
      },
      include: { category: true },
    });

    res.status(201).json({
      id: created.id,
      noteId: created.noteId,
      categoryId: created.categoryId,
      title: created.title,
      status: created.status,
      column: created.column,
      sortOrder: created.sortOrder,
      dueAt: created.dueAt?.toISOString() ?? null,
      priority: created.priority,
      reminderMinBefore: created.reminderMinBefore,
      completedAt: null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      category: created.category
        ? {
            id: created.category.id,
            name: created.category.name,
            color: created.category.color,
            icon: created.category.icon,
          }
        : null,
      description: created.description,
    });
  } catch (err) {
    next(err);
  }
});

notesRouter.delete('/:id', requireActive, async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const existing = await prisma.note.findFirst({ where: { id, userId: req.user!.id } });
    if (!existing) throw new HttpError(404, 'not_found');
    await prisma.note.delete({ where: { id } });
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

type SerializableNote = Prisma.NoteGetPayload<{
  include: { category: true; attachments: true };
}>;

function serialize(note: Partial<SerializableNote> & SerializableBase) {
  return {
    id: note.id,
    type: note.type,
    title: note.title,
    contentJson: note.contentJson,
    contentText: note.contentText,
    rawInput: note.rawInput,
    priority: note.priority,
    archivedAt: note.archivedAt?.toISOString() ?? null,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    categoryId: note.categoryId,
    category: note.category
      ? {
          id: note.category.id,
          name: note.category.name,
          color: note.category.color,
          icon: note.category.icon,
        }
      : null,
    attachments: note.attachments
      ? note.attachments.map((a) => ({
          id: a.id,
          kind: a.kind,
          url: publicUrlFor(a.r2Key),
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          durationMs: a.durationMs,
          transcription: a.transcription,
          createdAt: a.createdAt.toISOString(),
        }))
      : undefined,
  };
}

type SerializableBase = Pick<
  SerializableNote,
  | 'id'
  | 'type'
  | 'title'
  | 'contentJson'
  | 'contentText'
  | 'rawInput'
  | 'priority'
  | 'archivedAt'
  | 'createdAt'
  | 'updatedAt'
  | 'categoryId'
>;
