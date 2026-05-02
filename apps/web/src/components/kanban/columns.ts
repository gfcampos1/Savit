// Definição das colunas do kanban. SPEC §3.5.

export interface KanbanColumnDef {
  key: string;
  label: string;
  /** sublabel mono na header da coluna */
  sub?: string;
  /** marca colunas "completas" (não recebem novas tarefas via composer). */
  terminal?: boolean;
}

export const KANBAN_COLUMNS: KanbanColumnDef[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'amanha', label: 'Amanhã' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'sem-prazo', label: 'Sem prazo' },
  { key: 'concluidas', label: 'Concluídas', terminal: true },
];

export function columnLabel(key: string): string {
  return KANBAN_COLUMNS.find((c) => c.key === key)?.label ?? key;
}
