import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { streamSSE } from '@/lib/sse';

const TKEY = ['chat', 'threads'] as const;

// ----- types -----

export interface ThreadSummary {
  id: string;
  title: string | null;
  model: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersistedMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content: string;
  toolCalls: unknown | null;
  toolResult: unknown | null;
  createdAt: string;
}

export interface ThreadDetail {
  id: string;
  title: string | null;
  model: string;
  createdAt: string;
  updatedAt: string;
  messages: PersistedMessage[];
}

export interface ModelOption {
  id: string;
  label: string;
}

export type StreamEvent =
  | { type: 'delta'; content: string }
  | { type: 'tool_call'; id: string; name: string; args: unknown }
  | {
      type: 'tool_result';
      id: string;
      name: string;
      result: unknown;
      effect: { kind: string; resourceId?: string; label?: string };
    }
  | { type: 'message_id'; id: string }
  | { type: 'done'; finishReason?: string; usage?: { input: number; output: number; model: string } }
  | { type: 'error'; message: string };

// ----- queries -----

export function useThreads() {
  return useQuery({
    queryKey: TKEY,
    queryFn: async () => {
      const res = await api<{ items: ThreadSummary[] }>('/api/chat/threads');
      return res.items;
    },
  });
}

export function useThread(id: string | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: [...TKEY, id],
    queryFn: () => api<ThreadDetail>(`/api/chat/threads/${id}`),
  });
}

export function useChatModels() {
  return useQuery({
    queryKey: ['chat', 'models'],
    queryFn: () =>
      api<{ items: ModelOption[]; default: string; fallback: string }>('/api/chat/models'),
    staleTime: 60 * 60 * 1000,
  });
}

// ----- mutations -----

export function useCreateThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title?: string; model?: string } = {}) =>
      api<ThreadSummary>('/api/chat/threads', { method: 'POST', body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: TKEY });
    },
  });
}

export function useDeleteThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/chat/threads/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: TKEY });
    },
  });
}

/**
 * Envia uma mensagem e consome o stream SSE.
 * Retorna o iterador — quem chama renderiza incrementalmente.
 */
export async function* sendMessageStream(
  threadId: string,
  content: string,
  opts: { model?: string; signal?: AbortSignal } = {},
): AsyncGenerator<StreamEvent, void, void> {
  for await (const ev of streamSSE<StreamEvent>(`/api/chat/threads/${threadId}/messages`, {
    body: { content, ...(opts.model && { model: opts.model }) },
    signal: opts.signal,
  })) {
    yield ev;
  }
}
