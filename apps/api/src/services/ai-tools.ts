// Tool calling exposto à IA. Cada tool roda server-side com userId do contexto
// (extraído do JWT da requisição HTTP que iniciou o chat) — o modelo só envia
// argumentos, nunca o ID do dono. Isso garante que mesmo se o modelo alucinar,
// não vaza dados de outro usuário.

import type { Prisma, NoteType, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import type { ToolDefinition } from './openrouter.js';

// ---------- Definições enviadas ao modelo ----------

export const SAVIT_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'create_note',
      description:
        'Cria uma nova nota de TEXTO simples no Savit. Use quando o usuário pedir pra anotar algo sem prazo. Para criar tarefa com prazo, use create_task.',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Texto da nota.' },
          categoryName: {
            type: 'string',
            description: 'Nome da categoria existente (ex: "Trabalho"). Opcional.',
          },
        },
        required: ['content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Cria uma nova tarefa no kanban. Use sempre que o usuário pedir pra "lembrar de", "criar tarefa", ou der instrução com prazo.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Título curto da tarefa.' },
          dueAt: {
            type: 'string',
            description:
              'Prazo em ISO 8601 (ex: "2026-05-03T09:00:00.000Z"). Omita se sem prazo.',
          },
          categoryName: { type: 'string', description: 'Categoria por nome.' },
          priority: {
            type: 'string',
            enum: ['low', 'med', 'high'],
            description: 'Prioridade.',
          },
          column: {
            type: 'string',
            enum: ['hoje', 'amanha', 'semana', 'sem-prazo'],
            description: 'Coluna kanban inicial.',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description:
        'Atualiza uma tarefa existente. Use após search_notes/list_tasks pra obter o id.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'cuid da tarefa' },
          title: { type: 'string' },
          status: { type: 'string', enum: ['TODAY', 'UPCOMING', 'SOMEDAY', 'DONE', 'ARCHIVED'] },
          dueAt: { type: 'string', description: 'ISO 8601 ou null pra limpar' },
          priority: { type: 'string', enum: ['low', 'med', 'high'] },
          column: { type: 'string' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: 'Lista as tarefas do usuário. Use pra responder perguntas como "o que tenho pra hoje?".',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['TODAY', 'UPCOMING', 'SOMEDAY', 'DONE', 'ARCHIVED'],
            description: 'Filtra por status. Omita pra ver todas pendentes.',
          },
          column: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_notes',
      description: 'Busca nas notas do usuário por palavra-chave (ILIKE em PT-BR).',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_categories',
      description: 'Lista as categorias do usuário com cores. Use antes de criar nota/tarefa pra escolher categoryName válido.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_today_summary',
      description: 'Resumo do dia: contadores de tarefas pendentes/concluídas, próximos prazos, ideias capturadas hoje.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// ---------- Dispatcher ----------

export interface ToolContext {
  userId: string;
}

export interface ToolEffect {
  /** Tipo de mudança feita (pra UI mostrar inline com link). */
  kind: 'note_created' | 'task_created' | 'task_updated' | 'none';
  /** id do recurso afetado, quando aplicável */
  resourceId?: string;
  /** título humano-legível (pra UI exibir sem GET extra) */
  label?: string;
}

export interface ToolResult {
  output: unknown;
  effect: ToolEffect;
}

export async function runTool(
  ctx: ToolContext,
  name: string,
  rawArgs: string,
): Promise<ToolResult> {
  let args: Record<string, unknown> = {};
  try {
    args = rawArgs ? (JSON.parse(rawArgs) as Record<string, unknown>) : {};
  } catch (err) {
    return {
      output: { error: 'invalid_json_args', message: String(err) },
      effect: { kind: 'none' },
    };
  }

  switch (name) {
    case 'create_note':
      return await createNote(ctx, args as unknown as { content: string; categoryName?: string });
    case 'create_task':
      return await createTask(ctx, args as unknown as CreateTaskArgs);
    case 'update_task':
      return await updateTask(ctx, args as unknown as UpdateTaskArgs);
    case 'list_tasks':
      return await listTasks(ctx, args as unknown as ListTasksArgs);
    case 'search_notes':
      return await searchNotes(ctx, args as unknown as { query: string; limit?: number });
    case 'list_categories':
      return await listCategories(ctx);
    case 'get_today_summary':
      return await todaySummary(ctx);
    default:
      return {
        output: { error: 'unknown_tool', name },
        effect: { kind: 'none' },
      };
  }
}

// ---------- Implementações ----------

async function resolveCategoryByName(
  userId: string,
  name?: string,
): Promise<string | null> {
  if (!name) return null;
  const cat = await prisma.category.findFirst({
    where: {
      userId,
      name: { equals: name.trim(), mode: 'insensitive' },
    },
    select: { id: true },
  });
  return cat?.id ?? null;
}

async function createNote(ctx: ToolContext, args: { content: string; categoryName?: string }): Promise<ToolResult> {
  const categoryId = await resolveCategoryByName(ctx.userId, args.categoryName);
  const note = await prisma.note.create({
    data: {
      userId: ctx.userId,
      type: 'TEXT' as NoteType,
      contentText: args.content,
      categoryId,
    },
    include: { category: true },
  });
  return {
    output: {
      id: note.id,
      type: note.type,
      contentText: note.contentText,
      category: note.category?.name ?? null,
    },
    effect: {
      kind: 'note_created',
      resourceId: note.id,
      label: note.contentText?.slice(0, 80) ?? 'Nota criada',
    },
  };
}

interface CreateTaskArgs {
  title: string;
  dueAt?: string;
  categoryName?: string;
  priority?: 'low' | 'med' | 'high';
  column?: string;
}

async function createTask(ctx: ToolContext, args: CreateTaskArgs): Promise<ToolResult> {
  const categoryId = await resolveCategoryByName(ctx.userId, args.categoryName);
  const column = args.column ?? 'hoje';
  const last = await prisma.task.aggregate({
    where: { userId: ctx.userId, column },
    _max: { sortOrder: true },
  });
  const task = await prisma.task.create({
    data: {
      userId: ctx.userId,
      title: args.title,
      status: column === 'concluidas' ? 'DONE' : column === 'amanha' || column === 'semana' ? 'UPCOMING' : column === 'sem-prazo' ? 'SOMEDAY' : 'TODAY',
      column,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
      dueAt: args.dueAt ? new Date(args.dueAt) : null,
      priority: args.priority ?? null,
      categoryId,
    },
    include: { category: true },
  });
  return {
    output: {
      id: task.id,
      title: task.title,
      column: task.column,
      dueAt: task.dueAt?.toISOString() ?? null,
      category: task.category?.name ?? null,
      priority: task.priority,
    },
    effect: {
      kind: 'task_created',
      resourceId: task.id,
      label: task.title,
    },
  };
}

interface UpdateTaskArgs {
  id: string;
  title?: string;
  status?: TaskStatus;
  dueAt?: string | null;
  priority?: 'low' | 'med' | 'high';
  column?: string;
}

async function updateTask(ctx: ToolContext, args: UpdateTaskArgs): Promise<ToolResult> {
  const existing = await prisma.task.findFirst({ where: { id: args.id, userId: ctx.userId } });
  if (!existing) {
    return { output: { error: 'task_not_found' }, effect: { kind: 'none' } };
  }
  const data: Prisma.TaskUpdateInput = {};
  if (args.title !== undefined) data.title = args.title;
  if (args.status !== undefined) {
    data.status = args.status;
    if (args.status === 'DONE') data.completedAt = new Date();
  }
  if (args.dueAt !== undefined) {
    data.dueAt = args.dueAt ? new Date(args.dueAt) : null;
  }
  if (args.priority !== undefined) data.priority = args.priority;
  if (args.column !== undefined) data.column = args.column;

  const updated = await prisma.task.update({
    where: { id: args.id },
    data,
    include: { category: true },
  });
  return {
    output: {
      id: updated.id,
      title: updated.title,
      status: updated.status,
      column: updated.column,
      dueAt: updated.dueAt?.toISOString() ?? null,
    },
    effect: { kind: 'task_updated', resourceId: updated.id, label: updated.title },
  };
}

interface ListTasksArgs {
  status?: TaskStatus;
  column?: string;
  limit?: number;
}

async function listTasks(ctx: ToolContext, args: ListTasksArgs): Promise<ToolResult> {
  const where: Prisma.TaskWhereInput = { userId: ctx.userId };
  if (args.status) where.status = args.status;
  else where.status = { notIn: ['DONE', 'ARCHIVED'] };
  if (args.column) where.column = args.column;
  const items = await prisma.task.findMany({
    where,
    orderBy: [{ dueAt: 'asc' }, { sortOrder: 'asc' }],
    take: args.limit ?? 20,
    include: { category: true },
  });
  return {
    output: items.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      column: t.column,
      dueAt: t.dueAt?.toISOString() ?? null,
      category: t.category?.name ?? null,
      priority: t.priority,
    })),
    effect: { kind: 'none' },
  };
}

async function searchNotes(
  ctx: ToolContext,
  args: { query: string; limit?: number },
): Promise<ToolResult> {
  const items = await prisma.note.findMany({
    where: {
      userId: ctx.userId,
      archivedAt: null,
      contentText: { contains: args.query, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    take: args.limit ?? 10,
    include: { category: true },
  });
  return {
    output: items.map((n) => ({
      id: n.id,
      type: n.type,
      contentText: n.contentText?.slice(0, 240) ?? null,
      category: n.category?.name ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    effect: { kind: 'none' },
  };
}

async function listCategories(ctx: ToolContext): Promise<ToolResult> {
  const cats = await prisma.category.findMany({
    where: { userId: ctx.userId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, name: true, color: true },
  });
  return { output: cats, effect: { kind: 'none' } };
}

async function todaySummary(ctx: ToolContext): Promise<ToolResult> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  const [tasksToday, tasksDoneToday, capturedToday, pending] = await Promise.all([
    prisma.task.count({
      where: {
        userId: ctx.userId,
        OR: [
          { dueAt: { gte: startOfDay, lte: endOfDay } },
          { column: 'hoje', dueAt: null },
        ],
        status: { notIn: ['DONE', 'ARCHIVED'] },
      },
    }),
    prisma.task.count({
      where: {
        userId: ctx.userId,
        completedAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.note.count({
      where: { userId: ctx.userId, createdAt: { gte: startOfDay, lte: endOfDay } },
    }),
    prisma.task.count({
      where: { userId: ctx.userId, status: { notIn: ['DONE', 'ARCHIVED'] } },
    }),
  ]);

  return {
    output: {
      now: new Date().toISOString(),
      tasksToday,
      tasksDoneToday,
      capturedToday,
      totalPending: pending,
    },
    effect: { kind: 'none' },
  };
}
