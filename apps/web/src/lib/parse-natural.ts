// Parser de captura natural em PT-BR.
// O composer sempre cria nota — não há mais detecção automática de tarefa.
// Detecta apenas o que é metadado de nota:
// - categoria via #hashtag
// - prioridade via !, !!, !!! (ou "urgente")

import type { Category } from '@savit/shared';

export interface ParseResult {
  /** Texto normalizado para exibição/salvamento (input original com chips removidos). */
  text: string;
  /** Texto bruto preservado para debug e o campo `rawInput` no DB. */
  raw: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  priority: 'low' | 'med' | 'high' | null;
  /** Trechos do texto que viraram chips. Usado p/ remover ao clicar X. */
  matches: ChipMatch[];
}

export type ChipKind = 'category' | 'priority';
export interface ChipMatch {
  kind: ChipKind;
  /** Trecho original que casou. */
  raw: string;
  /** Label exibida no chip. */
  label: string;
}

const EMPTY_RESULT = (raw: string): ParseResult => ({
  text: raw,
  raw,
  categoryId: null,
  categoryName: null,
  categoryColor: null,
  priority: null,
  matches: [],
});

export function parseNatural(input: string, categories: Category[]): ParseResult {
  const raw = input;
  if (!input || !input.trim()) return EMPTY_RESULT(raw);

  const matches: ChipMatch[] = [];
  let text = input;

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
    categoryId,
    categoryName,
    categoryColor,
    priority,
    matches,
  };
}
