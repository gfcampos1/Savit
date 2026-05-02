// Bubble de mensagem (user / assistant) com markdown leve (sem deps externas).
// Renderiza linhas com **negrito**, *italic*, `code`, e quebras.

import type { ReactNode } from 'react';
import { ToolCallCard, type ToolEvent } from './ToolCallCard';

export interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  /** Eventos de tool intercalados na mensagem (apenas pra assistant). */
  tools?: ToolEvent[];
  streaming?: boolean;
}

export function Message({ role, content, tools, streaming }: MessageProps) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-ink text-bg'
            : 'bg-surface border hairline text-ink'
        }`}
      >
        {tools && tools.length > 0 ? (
          <div className="-mx-1">
            {tools.map((t) => (
              <ToolCallCard key={t.id} event={t} />
            ))}
          </div>
        ) : null}
        {content ? (
          <div>
            {renderInline(content)}
            {streaming ? <span className="text-ink-3 ml-0.5 animate-pulse">▊</span> : null}
          </div>
        ) : streaming ? (
          <span className="text-ink-3 animate-pulse">…</span>
        ) : null}
      </div>
    </div>
  );
}

// Markdown leve inline. Suporta **bold**, *italic*, `code` e quebras.
function renderInline(text: string): ReactNode {
  const parts = text.split(/\n/);
  return parts.map((line, i) => (
    <p key={i} className={i > 0 ? 'mt-1' : ''}>
      {tokenize(line)}
    </p>
  ));
}

function tokenize(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    if (m[2]) out.push(<strong key={key++}>{m[2]}</strong>);
    else if (m[3]) out.push(<em key={key++}>{m[3]}</em>);
    else if (m[4]) out.push(
      <code
        key={key++}
        className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded"
      >
        {m[4]}
      </code>,
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}
