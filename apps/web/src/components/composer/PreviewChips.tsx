import type { ParseResult } from '@/lib/parse-natural';

interface PreviewChipsProps {
  parsed: ParseResult;
  onClearMatch: (index: number) => void;
}

/**
 * Chips do parser exibidos acima do input. Cada chip tem X pra remover do texto.
 * Hoje só categoria e prioridade — composer sempre cria nota.
 */
export function PreviewChips({ parsed, onClearMatch }: PreviewChipsProps) {
  if (parsed.matches.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {parsed.matches.map((m, i) => (
        <Chip
          key={`${m.kind}-${i}`}
          color={m.kind === 'category' ? parsed.categoryColor ?? undefined : undefined}
          onRemove={() => onClearMatch(i)}
        >
          {m.label}
        </Chip>
      ))}
    </div>
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
