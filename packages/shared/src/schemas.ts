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
});
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
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

export const CategoryPatch = CategoryInput.partial();

// ---------- Note ----------

export const NoteInput = z.object({
  type: z.enum(NOTE_TYPES as unknown as [string, ...string[]]).default('TEXT'),
  title: z.string().max(200).optional(),
  contentJson: z.unknown().optional(),
  contentText: z.string().max(50_000).optional(),
  rawInput: z.string().max(2_000).optional(),
  categoryId: z.string().cuid().nullable().optional(),
  priority: z.enum(['low', 'med', 'high']).optional(),
});
export type NoteInput = z.infer<typeof NoteInput>;

export const NotePatch = NoteInput.partial();

// ---------- Task ----------

export const TaskInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5_000).optional(),
  status: z.enum(TASK_STATUSES as unknown as [string, ...string[]]).default('TODAY'),
  column: z.string().min(1).max(40).default('hoje'),
  sortOrder: z.number().int().nonnegative().default(0),
  dueAt: z.string().datetime().nullable().optional(),
  priority: z.enum(['low', 'med', 'high']).optional(),
  reminderMinBefore: z.number().int().nonnegative().optional(),
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
  model: z.string().max(120).optional(),
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
