import { z } from 'zod';
import { CATEGORY_COLORS, KANBAN_DEFAULT_COLUMNS, NOTE_TYPES, TASK_STATUSES } from './constants.js';

// ---------- Auth ----------

export const RegisterInput = z.object({
  email: z.string().email().max(254),
  password: z
    .string()
    .min(10, 'mínimo 10 caracteres')
    .max(128)
    .regex(/[A-Za-z]/, 'precisa de letra')
    .regex(/[0-9]/, 'precisa de número'),
  name: z.string().min(1).max(80).optional(),
  // "Mantenha-me conectado" — refresh token com TTL longo (sticky na rotação).
  rememberMe: z.boolean().optional(),
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof LoginInput>;

// ---------- Category ----------

export const CategoryInput = z.object({
  name: z.string().min(1).max(40).trim(),
  color: z.enum(CATEGORY_COLORS as unknown as [string, ...string[]]),
  icon: z.string().max(40).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});
export type CategoryInput = z.infer<typeof CategoryInput>;

// PATCH aceita os mesmos campos editáveis + hiddenAt para ocultar/reexibir.
// `slug` nunca é editável via API (set apenas no seed/backfill).
export const CategoryPatch = CategoryInput.partial().extend({
  hiddenAt: z.string().datetime().nullable().optional(),
});

// ---------- Categorias fixas (Livros, YouTube) ----------

export const FIXED_CATEGORY_SLUGS = ['books', 'youtube'] as const;
export type FixedCategorySlug = (typeof FIXED_CATEGORY_SLUGS)[number];

export const BookMeta = z
  .object({
    bookName: z.string().min(1).max(200),
    chapter: z.string().max(100).optional(),
    pageFrom: z.number().int().positive().optional(),
    pageTo: z.number().int().positive().optional(),
  })
  .refine(
    (d) => d.pageFrom == null || d.pageTo == null || d.pageTo >= d.pageFrom,
    { message: 'pageTo precisa ser >= pageFrom', path: ['pageTo'] },
  );
export type BookMeta = z.infer<typeof BookMeta>;

export const YoutubeMeta = z.object({
  channel: z.string().min(1).max(120),
  watchedAt: z.string().datetime().optional(),
  link: z.string().url(),
});
export type YoutubeMeta = z.infer<typeof YoutubeMeta>;

/**
 * Retorna o schema Zod do metadata associado ao slug da categoria fixa.
 * Para categorias do usuário (slug nulo) ou slugs desconhecidos, retorna null
 * — nesse caso o handler ignora o campo metadata.
 */
export function metaSchemaFor(slug: string | null | undefined) {
  if (slug === 'books') return BookMeta;
  if (slug === 'youtube') return YoutubeMeta;
  return null;
}

// ---------- Note ----------

export const NoteInput = z.object({
  type: z.enum(NOTE_TYPES as unknown as [string, ...string[]]).default('TEXT'),
  title: z.string().max(200).optional(),
  contentJson: z.unknown().optional(),
  contentText: z.string().max(50_000).optional(),
  rawInput: z.string().max(2_000).optional(),
  categoryId: z.string().cuid().nullable().optional(),
  priority: z.enum(['low', 'med', 'high']).optional(),
  // Validação real (por slug da categoria fixa) acontece no handler com
  // metaSchemaFor(slug). Aqui aceita qualquer JSON livre.
  metadata: z.unknown().nullable().optional(),
});
export type NoteInput = z.infer<typeof NoteInput>;

export const NotePatch = NoteInput.partial();

// ---------- Task ----------

export const TaskInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5_000).nullable().optional(),
  status: z.enum(TASK_STATUSES as unknown as [string, ...string[]]).default('TODAY'),
  column: z.string().min(1).max(40).default('hoje'),
  sortOrder: z.number().int().nonnegative().default(0),
  dueAt: z.string().datetime().nullable().optional(),
  priority: z.enum(['low', 'med', 'high']).nullable().optional(),
  reminderMinBefore: z.number().int().nonnegative().nullable().optional(),
  categoryId: z.string().cuid().nullable().optional(),
  noteId: z.string().cuid().nullable().optional(),
});
export type TaskInput = z.infer<typeof TaskInput>;

export const TaskPatch = TaskInput.partial();

export const TaskMoveInput = z.object({
  column: z.string().min(1).max(40),
  sortOrder: z.number().int().nonnegative(),
  dueAt: z.string().datetime().nullable().optional(),
});

// ---------- Chat ----------

export const ChatMessageInput = z.object({
  content: z.string().min(1).max(20_000),
});

// ---------- Upload ----------

export const UploadSignInput = z.object({
  kind: z.enum(['PHOTO', 'AUDIO', 'DRAWING_EXPORT', 'FILE']),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024), // 50MB cap
  noteId: z.string().cuid().optional(),
});

// helper pra rotas que recebem os defaults exportados acima
export const KanbanColumnSchema = z.enum(KANBAN_DEFAULT_COLUMNS as unknown as [string, ...string[]]);

// ---------- Recurring Task ----------

export const RecurringTaskInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5_000).optional(),
  categoryId: z.string().cuid().nullable().optional(),
  priority: z.enum(['low', 'med', 'high']).optional(),
  weekday: z.number().int().min(0).max(6),
});
export type RecurringTaskInput = z.infer<typeof RecurringTaskInput>;

export const RecurringTaskPatch = RecurringTaskInput.partial().extend({
  isActive: z.boolean().optional(),
});
