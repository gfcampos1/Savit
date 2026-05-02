// Card editorial de resumo da semana. Texto em Instrument Serif + tags mono.

import type { WeeklySummaryResponse } from '@/hooks/useStats';

interface WeeklySummaryCardProps {
  data: WeeklySummaryResponse | null;
  /** Quando true, mostra X pra dispensar (no Inbox de segunda). */
  dismissable?: boolean;
  onDismiss?: () => void;
}

export function WeeklySummaryCard({ data, dismissable, onDismiss }: WeeklySummaryCardProps) {
  if (!data) return null;
  const p = data.payload;
  const tags = [
    p.deltaVsLastWeek > 0
      ? `+${p.deltaVsLastWeek} vs semana passada`
      : p.deltaVsLastWeek < 0
      ? `${p.deltaVsLastWeek} vs semana passada`
      : null,
    p.becameTask > 0 ? `${p.becameTask} virou tarefa` : null,
    p.whenPattern !== 'distribuído' ? `picos de ${p.whenPattern}` : null,
  ].filter(Boolean);

  return (
    <article className="relative rounded-lg border hairline bg-surface p-5 shadow-card">
      {dismissable ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="dispensar"
          className="absolute top-3 right-3 text-ink-3 hover:text-ink text-xl leading-none"
        >
          ×
        </button>
      ) : null}
      <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3 mb-2">
        resumo · semana de {p.weekStart}
      </p>
      <p className="display-serif text-2xl text-ink leading-snug">
        {renderEditorial(data.text)}
      </p>
      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-block rounded-pill border hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-mono text-ink-3"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

// renderiza o markdown leve (**bold**) que o backend gera
function renderEditorial(text: string) {
  const out: (string | JSX.Element)[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <strong key={key++} className="text-ink">
        {m[1]}
      </strong>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
