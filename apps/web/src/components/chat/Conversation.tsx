// Painel direito do chat: histórico de mensagens + composer com streaming.
// Mantém estado local pra renderizar a mensagem do assistant em tempo real
// enquanto o backend manda eventos SSE.

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  sendMessageStream,
  useChatModels,
  useThread,
  type StreamEvent,
} from '@/hooks/useChat';
import { Message } from './Message';
import type { ToolEvent } from './ToolCallCard';

interface ConversationProps {
  threadId: string;
}

interface PendingAssistant {
  text: string;
  tools: ToolEvent[];
}

export function Conversation({ threadId }: ConversationProps) {
  const thread = useThread(threadId);
  const models = useChatModels();
  const qc = useQueryClient();

  const [draft, setDraft] = useState('');
  const [model, setModel] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState<PendingAssistant | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // sincroniza o modelo selecionado com o da thread carregada
  useEffect(() => {
    if (thread.data?.model) setModel(thread.data.model);
  }, [thread.data?.model]);

  // auto-scroll quando mensagens mudam ou stream chega
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [thread.data?.messages.length, pending?.text, pending?.tools.length]);

  async function send() {
    const content = draft.trim();
    if (!content || streaming) return;
    setDraft('');
    setError(null);
    setPending({ text: '', tools: [] });
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      for await (const ev of sendMessageStream(threadId, content, {
        model,
        signal: controller.signal,
      })) {
        applyEvent(ev);
      }
    } catch (err) {
      console.error('chat stream error', err);
      setError(err instanceof Error ? err.message : 'erro no stream');
    } finally {
      setStreaming(false);
      // refetch thread para puxar mensagens persistidas (e atualiza lista de threads)
      await qc.invalidateQueries({ queryKey: ['chat', 'threads'] });
      await thread.refetch();
      setPending(null);
      // invalida queries de tasks/notes pra refletir o que a IA criou
      await qc.invalidateQueries({ queryKey: ['tasks'] });
      await qc.invalidateQueries({ queryKey: ['notes'] });
    }
  }

  function applyEvent(ev: StreamEvent) {
    setPending((curr) => {
      const base = curr ?? { text: '', tools: [] };
      if (ev.type === 'delta') return { ...base, text: base.text + ev.content };
      if (ev.type === 'tool_call') {
        return {
          ...base,
          tools: [
            ...base.tools,
            { id: ev.id, name: ev.name, args: ev.args, status: 'pending' },
          ],
        };
      }
      if (ev.type === 'tool_result') {
        return {
          ...base,
          tools: base.tools.map((t) =>
            t.id === ev.id
              ? { ...t, status: 'done', effect: ev.effect }
              : t,
          ),
        };
      }
      if (ev.type === 'error') {
        setError(ev.message);
      }
      return base;
    });
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void send();
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  if (thread.isLoading) {
    return (
      <p className="text-xs text-ink-3 text-center py-10">carregando conversa…</p>
    );
  }
  if (thread.error || !thread.data) {
    return <p className="text-xs text-danger text-center py-10">erro ao carregar.</p>;
  }

  const messages = thread.data.messages;
  return (
    <section className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 py-3 border-b hairline">
        <h2 className="display-serif text-lg flex-1 truncate">
          {thread.data.title ?? 'Nova conversa'}
        </h2>
        <select
          value={model ?? thread.data.model}
          onChange={(e) => setModel(e.target.value)}
          className="text-xs bg-surface border hairline rounded px-2 py-1 text-ink-2 focus:outline-none focus:border-accent"
        >
          {models.data?.items.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !pending ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((m) => {
              if (m.role === 'TOOL') return null; // já renderizadas como cards na msg do assistant anterior
              return (
                <Message
                  key={m.id}
                  role={m.role === 'USER' ? 'user' : 'assistant'}
                  content={m.content}
                  tools={extractToolEvents(m.toolCalls, m.toolResult)}
                />
              );
            })}
            {pending ? (
              <Message
                role="assistant"
                content={pending.text}
                tools={pending.tools}
                streaming={streaming}
              />
            ) : null}
          </>
        )}
        {error ? (
          <p className="text-xs text-danger mt-3 text-center">⚠ {error}</p>
        ) : null}
      </div>

      <footer className="border-t hairline p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder="Pergunte ou peça pra criar uma tarefa…"
            rows={1}
            className="flex-1 resize-none bg-surface border hairline rounded-md px-3 py-2 text-sm text-ink outline-none focus:border-accent leading-snug"
          />
          {streaming ? (
            <button
              type="button"
              onClick={stop}
              className="px-4 py-2 rounded-md bg-danger text-white text-sm font-medium"
            >
              parar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void send()}
              disabled={!draft.trim()}
              className="px-4 py-2 rounded-md bg-ink text-bg text-sm font-medium disabled:opacity-40"
            >
              enviar
            </button>
          )}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3 mt-1.5 text-right">
          ⌘↵ enviar
        </p>
      </footer>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6 text-ink-2">
      <p className="display-serif text-2xl text-ink mb-2">
        Pergunte qualquer coisa.
      </p>
      <p className="text-sm">
        A IA pode criar tarefas, listar notas, organizar o seu dia. Tente:
      </p>
      <ul className="mt-4 inline-block text-left text-sm space-y-1">
        <li className="text-ink-3">— "o que tenho pra hoje?"</li>
        <li className="text-ink-3">— "crie uma tarefa pra ligar pro João amanhã às 10h"</li>
        <li className="text-ink-3">— "anota: ideia de feature pra calendário"</li>
      </ul>
    </div>
  );
}

function extractToolEvents(toolCalls: unknown, toolResult: unknown): ToolEvent[] | undefined {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return undefined;
  const results = (toolResult ?? {}) as Record<string, { effect?: ToolEvent['effect'] }>;
  return toolCalls.map((tc) => {
    const t = tc as { id: string; function?: { name: string } };
    const r = results[t.id];
    return {
      id: t.id,
      name: t.function?.name ?? 'tool',
      effect: r?.effect,
      status: 'done',
    };
  });
}
