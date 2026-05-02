// Tipos consumidos pelo frontend (mirror das entidades do Prisma — só o que o
// client precisa enxergar). Mantidos manualmente pra evitar gerar tipos
// completos do Prisma client no bundle do web.

import type { CategoryColor, KanbanColumn, NoteType, TaskStatus } from './constants.js';

export type Iso = string; // ISO datetime

export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
  icon: string | null;
  sortOrder: number;
  createdAt: Iso;
  updatedAt: Iso;
}

/** Subset embutido em Note/Task quando o backend faz `include: { category: true }`. */
export interface CategoryRef {
  id: string;
  name: string;
  color: CategoryColor;
  icon: string | null;
}

export interface Note {
  id: string;
  type: NoteType;
  title: string | null;
  contentJson: unknown | null;
  contentText: string | null;
  rawInput: string | null;
  priority: 'low' | 'med' | 'high' | null;
  archivedAt: Iso | null;
  createdAt: Iso;
  updatedAt: Iso;
  categoryId: string | null;
  category?: CategoryRef | null;
  attachments?: Attachment[];
}

export interface Task {
  id: string;
  noteId: string | null;
  categoryId: string | null;
  category?: CategoryRef | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  column: KanbanColumn | string;
  sortOrder: number;
  dueAt: Iso | null;
  priority: 'low' | 'med' | 'high' | null;
  reminderMinBefore: number | null;
  completedAt: Iso | null;
  createdAt: Iso;
  updatedAt: Iso;
}

export interface Attachment {
  id: string;
  noteId: string | null;
  kind: 'PHOTO' | 'AUDIO' | 'DRAWING_EXPORT' | 'FILE';
  url: string; // URL pública construída a partir do R2_PUBLIC_BASE_URL
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  transcription: string | null;
  meta: Record<string, unknown> | null;
  createdAt: Iso;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  createdAt: Iso;
}

export interface AuthResponse {
  user: MeResponse;
  accessToken: string;
}
