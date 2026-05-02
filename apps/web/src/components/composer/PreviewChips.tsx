import type { ParseResult } from '@/lib/parse-natural';

interface PreviewChipsProps {
  parsed: ParseResult;
  onClearMatch: (index: number) => void;
}

/**
 * Chips do parser exibidos acima do input. Cada chip tem X pra remover do texto.
 * SPEC §3.3 + R-01.
 */
export function PreviewChips({ parsed, onClearMatch }: PreviewChipsProps) {
  if (parsed.matches.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      <KindChip kind={parsed.isTask ? 'task' : 'note'} />
      {parsed.matches.map((m, i) => (
        <Chip
          key={`${m.kind}-${i}`}
          color={m.kind === 'category' ? parsed.categoryColor ?? undefined : undefined}
          onRemove={m.kind === 'task' ? undefined : () => onClearMatch(i)}
        >
          {m.label}
        </Chip>
      ))}
    </div>
  );
}

function KindChip({ kind }: { kind: 'task' | 'note' }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent-soft text-accent px-2.5 py-1 text-xs font-medium">
      <span className="font-mono uppercase tracking-mono text-[10px]">
        {kind === 'task' ? 'tarefa' : 'nota'}
      </span>
    </span>
  );
}

interface ChipProps {
  children: React.ReactNode;
  color?: string;
  onRemove?: () => void;
}

function Chip({ children, color, onRemove }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border hairline bg-surface px-2.5 py-1 text-xs">
      {color ? (
        <span className="h-2 w-2 rounded-sm" style={{ background: color }} aria-hidden />
      ) : null}
      <span className="text-ink-2">{children}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="remover"
          className="text-ink-3 hover:text-ink leading-none"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
