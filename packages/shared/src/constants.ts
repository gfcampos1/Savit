// Paleta da SPEC §1.5 — usada em categorias.
export const CATEGORY_COLORS = [
  '#c0563a',
  '#e6b540',
  '#3a8a6a',
  '#7a5cc7',
  '#5b8cff',
  '#d96fa0',
  '#1d4ed8',
  '#ff8a5b',
  '#5cd6c0',
  '#ff6b9d',
  '#7c5cff',
  '#f0b95c',
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const THEMES = ['paper', 'snow', 'playful', 'linear'] as const;
export type Theme = (typeof THEMES)[number];

export const KANBAN_DEFAULT_COLUMNS = ['hoje', 'amanha', 'semana', 'sem-prazo', 'concluidas'] as const;
export type KanbanColumn = (typeof KANBAN_DEFAULT_COLUMNS)[number];

export const NOTE_TYPES = ['TEXT', 'VOICE', 'DRAWING', 'MINDMAP', 'PHOTO', 'MIXED'] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export const TASK_STATUSES = ['TODAY', 'UPCOMING', 'SOMEDAY', 'DONE', 'ARCHIVED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
