// Parser de captura natural em PT-BR.
// Porta TS de Refactor/Savit (1)/prototype/store.jsx (linhas 107-192) com extensões:
// - prioridade explícita (!, !!, !!!)
// - múltiplos formatos de hora (9h, 9h30, 09:30)
// - "próxima segunda" / "próxima semana"
// - dias da semana (segunda..domingo) → próxima ocorrência
//
// Detecta também as palavras-chave para sinalizar que é uma TAREFA (não nota).

import type { Category } from '@savit/shared';
import { dueLabel } from './format-date.js';

export interface ParseResult {
  /** Texto normalizado para exibição/salvamento (input original com chips removidos). */
  text: string;
  /** Texto bruto preservado para debug e o campo `rawInput` no DB. */
  raw: string;
  isTask: boolean;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  dueAt: number | null;
  dueLabel: string | null;
  priority: 'low' | 'med' | 'high' | null;
  /** Trechos do texto que viraram chips, com posição inicial. Usado p/ remover ao clicar X. */
  matches: ChipMatch[];
}

export type ChipKind = 'category' | 'date' | 'time' | 'priority' | 'task';
export interface ChipMatch {
  kind: ChipKind;
  /** Trecho original que casou. */
  raw: string;
  /** Label exibida no chip. */
  label: string;
}

const TIME_KEYWORDS: Record<string, number> = {
  'depois de amanhã': 2,
  'depois de amanha': 2,
  'amanhã': 1,
  'amanha': 1,
  'hoje': 0,
};

const DAY_OF_WEEK: Record<string, number> = {
  domingo: 0,
  dom: 0,
  segunda: 1,
  'segunda-feira': 1,
  seg: 1,
  terça: 2,
  terca: 2,
  'terça-feira': 2,
  'terca-feira': 2,
  ter: 2,
  quarta: 3,
  'quarta-feira': 3,
  qua: 3,
  quinta: 4,
  'quinta-feira': 4,
  qui: 4,
  sexta: 5,
  'sexta-feira': 5,
  sex: 5,
  sábado: 6,
  sabado: 6,
  sab: 6,
};

const TASK_VERBS = [
  'lembrar',
  'ligar',
  'enviar',
  'mandar',
  'comprar',
  'fazer',
  'revisar',
  'escrever',
  'agendar',
  'pagar',
  'reservar',
  'finalizar',
  'terminar',
  'responder',
  'estudar',
  'ler',
  'marcar',
];

const EMPTY_RESULT = (raw: string): ParseResult => ({
  text: raw,
  raw,
  isTask: false,
  categoryId: null,
  categoryName: null,
  categoryColor: null,
  dueAt: null,
  dueLabel: null,
  priority: null,
  matches: [],
});

export function parseNatural(input: string, categories: Category[]): ParseResult {
  const raw = input;
  if (!input || !input.trim()) return EMPTY_RESULT(raw);

  const matches: ChipMatch[] = [];
  let text = input;
  const lower = input.toLowerCase();

  // ---------- Categoria por #hashtag ----------
  let categoryId: string | null = null;
  let categoryName: string | null = null;
  let categoryColor: string | null = null;

  const hashMatch = /#([\p{L}\d_-]+)/iu.exec(input);
  if (hashMatch) {
    const tag = hashMatch[1]!.toLowerCase();
    const cat =
      categories.find((c) => c.name.toLowerCase() === tag) ??
      categories.find((c) => c.name.toLowerCase().startsWith(tag)) ??
      categories.find((c) => tag.startsWith(c.name.toLowerCase().slice(0, 3)));
    if (cat) {
      categoryId = cat.id;
      categoryName = cat.name;
      categoryColor = cat.color;
      matches.push({ kind: 'category', raw: hashMatch[0], label: cat.name });
      text = text.replace(hashMatch[0], '').replace(/\s{2,}/g, ' ').trim();
    }
  }

  // ---------- Hora (9h, 9h30, 09:30) ----------
  let hour: number | null = null;
  let minute = 0;
  const hourMatch = /(?<![:\d])(\d{1,2})h(\d{2})?(?!\d)|(?<!\d)(\d{1,2}):(\d{2})(?!\d)/i.exec(lower);
  if (hourMatch) {
    if (hourMatch[1]) {
      hour = +hourMatch[1];
      minute = hourMatch[2] ? +hourMatch[2] : 0;
    } else if (hourMatch[3]) {
      hour = +hourMatch[3];
      minute = +hourMatch[4]!;
    }
    matches.push({
      kind: 'time',
      raw: hourMatch[0],
      label: `${pad(hour ?? 0)}:${pad(minute)}`,
    });
  }

  // ---------- Data ----------
  let dueAt: number | null = null;
  let dateOffsetApplied = false;

  // 1. Palavras-chave fixas (hoje / amanhã / depois de amanhã)
  for (const k of Object.keys(TIME_KEYWORDS)) {
    if (lower.includes(k)) {
      const d = new Date();
      d.setDate(d.getDate() + TIME_KEYWORDS[k]!);
      if (hour !== null) d.setHours(hour, minute, 0, 0);
      else d.setHours(9, 0, 0, 0);
      dueAt = d.getTime();
      matches.push({ kind: 'date', raw: k, label: capitalize(k) });
      dateOffsetApplied = true;
      break;
    }
  }

  // 2. Dia da semana → próxima ocorrência (sex, sexta-feira, próxima segunda...)
  if (!dateOffsetApplied) {
    const dowEntries = Object.entries(DAY_OF_WEEK).sort((a, b) => b[0].length - a[0].length);
    for (const [name, idx] of dowEntries) {
      const re = new RegExp(`(próxima\\s+|proxima\\s+)?\\b${escapeRegex(name)}\\b`, 'i');
      const m = re.exec(lower);
      if (m) {
        const d = new Date();
        const today = d.getDay();
        let delta = (idx - today + 7) % 7;
        if (delta === 0 || /próxima|proxima/.test(m[0])) delta = delta === 0 ? 7 : delta;
        d.setDate(d.getDate() + delta);
        if (hour !== null) d.setHours(hour, minute, 0, 0);
        else d.setHours(9, 0, 0, 0);
        dueAt = d.getTime();
        matches.push({
          kind: 'date',
          raw: m[0],
          label: capitalize(name.split('-')[0] ?? name),
        });
        dateOffsetApplied = true;
        break;
      }
    }
  }

  // 3. Data dd/mm ou dd/mm/yyyy
  if (!dateOffsetApplied) {
    const dm = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(input);
    if (dm) {
      const d = new Date();
      const day = +dm[1]!;
      const month = +dm[2]! - 1;
      const year = dm[3] ? (dm[3].length === 2 ? 2000 + +dm[3] : +dm[3]) : d.getFullYear();
      d.setFullYear(year, month, day);
      if (hour !== null) d.setHours(hour, minute, 0, 0);
      else d.setHours(9, 0, 0, 0);
      dueAt = d.getTime();
      matches.push({ kind: 'date', raw: dm[0], label: dm[0] });
      dateOffsetApplied = true;
    }
  }

  // 4. Hora sozinha (ex: "9h ligar João") → assume hoje
  if (!dateOffsetApplied && hour !== null) {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    dueAt = d.getTime();
  }

  const isTask = dueAt !== null || matchesTaskVerb(lower);
  if (!dueAt && isTask) {
    matches.push({ kind: 'task', raw: '', label: 'Tarefa' });
  }

  // ---------- Prioridade ----------
  let priority: ParseResult['priority'] = null;
  if (/!{3}/.test(input) || /\burgente\b/i.test(input)) {
    priority = 'high';
    matches.push({ kind: 'priority', raw: '!!!', label: 'urgente' });
  } else if (/!{2}/.test(input)) {
    priority = 'med';
    matches.push({ kind: 'priority', raw: '!!', label: 'média' });
  } else if (/(?<!\!)!(?!\!)/.test(input)) {
    priority = 'low';
    matches.push({ kind: 'priority', raw: '!', label: 'baixa' });
  }

  return {
    text: text.trim(),
    raw,
    isTask,
    categoryId,
    categoryName,
    categoryColor,
    dueAt,
    dueLabel: dueAt ? dueLabel(dueAt) : null,
    priority,
    matches,
  };
}

function matchesTaskVerb(lower: string): boolean {
  return TASK_VERBS.some((v) => lower.startsWith(v + ' ') || lower.includes(' ' + v + ' '));
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
