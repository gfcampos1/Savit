import { useEffect, useMemo, useRef, useState } from 'react';
import type { Category } from '@savit/shared';
import { parseNatural } from '@/lib/parse-natural';
import { useCreateNote } from '@/hooks/useNotes';
import { useCreateTask } from '@/hooks/useTasks';
import { PreviewChips } from './PreviewChips';
import { CategoryPicker } from './CategoryPicker';

interface ComposerProps {
  categories: Category[];
  defaultCategoryId?: string | null;
}

/**
 * Captura natural com chips de preview. SPEC §3.3 + F1.
 *
 * - Parser roda enquanto digita; chips removíveis.
 * - Categoria pode ser fixada via dropdown (sobrescreve #hashtag).
 * - Cmd/Ctrl+Enter envia, Esc colapsa.
 * - Cria nota OU tarefa baseado no parser; se houver dueAt → tarefa.
 */
export function Composer({ categories, defaultCategoryId = null }: ComposerProps) {
  const [text, setText] = useState('');
  const [pinnedCategoryId, setPinnedCategoryId] = useState<string | null>(defaultCategoryId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const createNote = useCreateNote();
  const createTask = useCreateTask();

  const parsed = useMemo(() => parseNatural(text, categories), [text, categories]);
  const effectiveCategoryId = pinnedCategoryId ?? parsed.categoryId;

  // auto-grow do textarea (max 5 linhas)
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 5 * 28); // ~5 linhas em fs 15
    el.style.height = `${next}px`;
  }, [text]);

  function clearMatch(idx: number) {
    const m = parsed.matches[idx];
    if (!m || !m.raw) return;
    setText((prev) => prev.replace(m.raw, '').replace(/\s{2,}/g, ' ').trim());
  }

  function reset() {
    setText('');
    setError(null);
    requestAnimationFrame(() => taRef.current?.focus());
  }

  async function submit() {
    const content = parsed.text.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (parsed.isTask) {
        await createTask.mutateAsync({
          title: content,
          dueAt: parsed.dueAt ? new Date(parsed.dueAt).toISOString() : null,
          categoryId: effectiveCategoryId ?? null,
          priority: parsed.priority ?? undefined,
          status: 'TODAY',
          column: 'hoje',
        });
      } else {
        await createNote.mutateAsync({
          type: 'TEXT',
          contentText: content,
          rawInput: parsed.raw,
          categoryId: effectiveCategoryId ?? null,
          priority: parsed.priority ?? undefined,
        });
      }
      reset();
    } catch (err) {
      setError('Não conseguimos salvar agora. Tente de novo.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void submit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      taRef.current?.blur();
    }
  }

  return (
    <div className="rounded-lg border hairline bg-surface shadow-card p-3">
      {parsed.matches.length > 0 ? (
        <PreviewChips parsed={parsed} onClearMatch={clearMatch} />
      ) : null}

      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Sobre o que é? — escreva ou cole, # categoria, amanhã 9h pra virar tarefa…"
          rows={1}
          className="flex-1 resize-none bg-transparent text-ink text-md leading-snug outline-none placeholder:text-ink-3 py-1"
          aria-label="capturar ideia"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!text.trim() || submitting}
          aria-label="enviar"
          className="grid place-items-center h-10 w-10 rounded-pill bg-ink text-bg disabled:opacity-40 transition-opacity"
        >
          {submitting ? (
            <span className="font-mono text-[10px]">…</span>
          ) : (
            <SendIcon />
          )}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <CategoryPicker
          categories={categories}
          value={pinnedCategoryId}
          onChange={setPinnedCategoryId}
          autoCategoryName={!pinnedCategoryId ? parsed.categoryName : null}
        />
        <span className="font-mono text-[10px] uppercase tracking-mono text-ink-3 hidden sm:block">
          ⌘↵ enviar
        </span>
      </div>

      {error ? (
        <p className="text-xs text-danger mt-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12L19 5L13 19L11 13L5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
