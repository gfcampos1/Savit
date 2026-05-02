// Formatadores de data em PT-BR. Porta do prototype/store.jsx.

const PT_DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const PT_MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function formatTime(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** Label curto para `dueAt` em cards de tarefa. */
export function dueLabel(timestamp: number | string | Date | null | undefined): string {
  if (timestamp == null) return 'Sem prazo';
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d);
  const targetDay = new Date(target);
  targetDay.setHours(0, 0, 0, 0);
  const diff = Math.round((targetDay.getTime() - now.getTime()) / 86_400_000);
  const time = formatTime(target);

  if (diff === 0) return `Hoje, ${time}`;
  if (diff === 1) return `Amanhã, ${time}`;
  if (diff < 0) return `Atrasada · ${target.getDate()}/${target.getMonth() + 1}`;
  if (diff < 7) return `${PT_DAYS_SHORT[target.getDay()]} ${target.getDate()}/${target.getMonth() + 1}, ${time}`;
  return `${target.getDate()}/${target.getMonth() + 1}, ${time}`;
}

/** Label longa pra agrupar o feed por dia ("Hoje", "Ontem", "Sex 28 Abr"...). */
export function dayHeading(timestamp: number | string | Date): string {
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - target.getTime()) / 86_400_000);

  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff < 7) return `${PT_DAYS_SHORT[d.getDay()]} ${d.getDate()} ${PT_MONTHS_SHORT[d.getMonth()]}`;
  if (target.getFullYear() === today.getFullYear()) {
    return `${d.getDate()} ${PT_MONTHS_SHORT[d.getMonth()]}`;
  }
  return `${d.getDate()} ${PT_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Chave estável pra agrupar (YYYY-MM-DD). */
export function dayKey(timestamp: number | string | Date): string {
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}
