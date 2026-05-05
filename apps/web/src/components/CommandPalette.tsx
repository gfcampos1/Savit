// Command palette ⌘K — overlay com input + lista navegável por teclado.
// Itens vêm de:
//   - ações fixas (ir pra Inbox/Tarefas/Chat/Dashboard, novo desenho/mapa, foco)
//   - notas do usuário (busca por contentText, top 8)
//   - tarefas pendentes (busca por title, top 6)
//
// Navegação: ↑/↓ move seleção, Enter abre, Esc fecha.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/ui';
import { useNotes } from '@/hooks/useNotes';
import { useTasks } from '@/hooks/useTasks';
import { useThemeStore } from '@/stores/theme';
import { THEMES, type Theme } from '@savit/shared';

interface ItemBase {
  id: string;
  label: string;
  hint?: string;
  shortcut?: string;
  /** swatch da categoria, opcional */
  color?: string;
  onSelect: () => void;
}

interface Group {
  label: string;
  items: ItemBase[];
}

export function CommandPalette() {
  const open = useUIStore((s) => s.paletteOpen);
  const close = useUIStore((s) => s.closePalette);
  const navigate = useNavigate();
  const setTheme = useThemeStore((s) => s.setTheme);
  const currentTheme = useThemeStore((s) => s.theme);
  const notes = useNotes();
  const tasks = useTasks({ includeDone: false });

  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // foca o input quando abre + reseta query
  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const groups = useMemo<Group[]>(() => {
    if (!open) return [];
    const term = q.trim().toLowerCase();

    const actions: ItemBase[] = [
      {
        id: 'go-inbox',
        label: 'Ir pra Inbox',
        hint: 'capturas + notas + tarefas',
        shortcut: 'g i',
        onSelect: () => {
          navigate('/');
          close();
        },
      },
      {
        id: 'go-tasks',
        label: 'Ir pra Tarefas (kanban)',
        shortcut: 'g t',
        onSelect: () => {
          navigate('/tasks');
          close();
        },
      },
      {
        id: 'go-categories',
        label: 'Ir pra Categorias',
        shortcut: 'g c',
        onSelect: () => {
          navigate('/categories');
          close();
        },
      },
      {
        id: 'go-chat',
        label: 'Ir pra Chat IA',
        shortcut: 'g h',
        onSelect: () => {
          navigate('/chat');
          close();
        },
      },
      {
        id: 'go-dashboard',
        label: 'Ir pra Dashboard',
        shortcut: 'g d',
        onSelect: () => {
          navigate('/dashboard');
          close();
        },
      },
      {
        id: 'go-focus',
        label: 'Modo foco do dia',
        hint: 'tela cheia, uma tarefa por vez',
        onSelect: () => {
          navigate('/focus');
          close();
        },
      },
      {
        id: 'go-profile',
        label: 'Perfil & configurações',
        onSelect: () => {
          navigate('/profile');
          close();
        },
      },
    ];

    const themeActions: ItemBase[] = THEMES.filter((t) => t !== currentTheme).map(
      (t): ItemBase => ({
        id: `theme-${t}`,
        label: `Trocar tema pra ${labelTheme(t)}`,
        onSelect: () => {
          setTheme(t);
          close();
        },
      }),
    );

    const noteHits = (notes.data?.items ?? [])
      .filter((n) => {
        if (!term) return true;
        return (n.contentText ?? '').toLowerCase().includes(term);
      })
      .slice(0, 8)
      .map((n): ItemBase => ({
        id: `note-${n.id}`,
        label: (n.contentText ?? '').slice(0, 80) || '(sem texto)',
        hint: n.category?.name ?? undefined,
        color: n.category?.color,
        onSelect: () => {
          navigate(`/notes/${n.id}`);
          close();
        },
      }));

    const taskHits = (tasks.data?.items ?? [])
      .filter((t) => {
        if (!term) return true;
        return t.title.toLowerCase().includes(term);
      })
      .slice(0, 6)
      .map((t): ItemBase => ({
        id: `task-${t.id}`,
        label: t.title,
        hint: t.category?.name ?? undefined,
        color: t.category?.color,
        onSelect: () => {
          navigate('/tasks');
          close();
        },
      }));

    const filteredActions = term
      ? [...actions, ...themeActions].filter((a) => a.label.toLowerCase().includes(term))
      : actions;

    const out: Group[] = [];
    if (filteredActions.length > 0) out.push({ label: 'Ações', items: filteredActions });
    if (taskHits.length > 0) out.push({ label: 'Tarefas', items: taskHits });
    if (noteHits.length > 0) out.push({ label: 'Notas', items: noteHits });
    if (term && themeActions.length > 0 && filteredActions.length === 0) {
      out.push({ label: 'Tema', items: themeActions });
    }
    return out;
  }, [open, q, notes.data, tasks.data, navigate, close, setTheme, currentTheme]);

  // Lista achatada pra navegação por índice
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const total = flat.length;

  // Mantém active dentro do range
  useEffect(() => {
    if (active >= total) setActive(Math.max(0, total - 1));
  }, [active, total]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (total === 0 ? 0 : (i + 1) % total));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (total === 0 ? 0 : (i - 1 + total) % total));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flat[active]?.onSelect();
    }
  }

  // scroll item ativo pra view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comandos"
      onClick={close}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[12vh] sm:pt-[18vh] px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-bg rounded-lg shadow-card border hairline overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b hairline">
          <span aria-hidden className="text-ink-3 text-sm">⌘K</span>
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="buscar ou navegar…"
            className="flex-1 bg-transparent text-ink text-md outline-none placeholder:text-ink-3"
          />
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {total === 0 ? (
            <p className="text-sm text-ink-3 italic text-center py-8 px-4">
              {q ? `nada por aqui pra "${q}".` : 'tudo vazio. capture algo primeiro.'}
            </p>
          ) : (
            renderGroups(groups, active)
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 px-4 py-2 border-t hairline text-[10px] font-mono uppercase tracking-mono text-ink-3">
          <span>↑↓ navegar · ↵ abrir · esc fecha</span>
          <span>{total} {total === 1 ? 'item' : 'itens'}</span>
        </footer>
      </div>
    </div>
  );
}

function renderGroups(groups: Group[], active: number) {
  let idx = 0;
  return groups.map((g) => (
    <section key={g.label} className="py-1">
      <p className="px-4 pt-2 pb-1 font-mono text-[10px] uppercase tracking-mono text-ink-3">
        {g.label}
      </p>
      {g.items.map((item) => {
        const myIdx = idx++;
        const isActive = myIdx === active;
        return (
          <button
            key={item.id}
            type="button"
            data-idx={myIdx}
            onMouseEnter={() => {
              /* keyboard nav controla active; mouse não polui */
            }}
            onClick={() => item.onSelect()}
            className={`w-full text-left px-4 py-2 flex items-center gap-3 ${
              isActive ? 'bg-accent-soft' : 'hover:bg-surface-2/50'
            }`}
          >
            {item.color ? (
              <span
                className="h-2 w-2 rounded-sm shrink-0"
                style={{ background: item.color }}
                aria-hidden
              />
            ) : (
              <span aria-hidden className="text-ink-3 shrink-0">›</span>
            )}
            <span className="flex-1 text-sm text-ink truncate">{item.label}</span>
            {item.hint ? (
              <span className="font-mono text-[10px] text-ink-3 shrink-0">{item.hint}</span>
            ) : null}
            {item.shortcut ? (
              <kbd className="font-mono text-[10px] text-ink-3 bg-surface-2 px-1.5 py-0.5 rounded shrink-0">
                {item.shortcut}
              </kbd>
            ) : null}
          </button>
        );
      })}
    </section>
  ));
}

function labelTheme(t: Theme): string {
  switch (t) {
    case 'paper':
      return 'Paper';
    case 'snow':
      return 'Snow';
    case 'playful':
      return 'Playful';
    case 'linear':
      return 'Linear';
  }
}
