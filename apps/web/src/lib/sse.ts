// Consumidor de SSE via fetch + ReadableStream. EventSource não suporta POST
// nem cookies cross-origin com Authorization, então rolamos manual.
//
// Cada evento é uma linha "data: {...}\n\n". Devolvemos um async iterator dos
// objetos JSON parseados.

import { useAuthStore } from '@/stores/auth';

export interface SSEStreamOptions {
  body?: unknown;
  signal?: AbortSignal;
}

export async function* streamSSE<TEvent>(
  path: string,
  opts: SSEStreamOptions = {},
): AsyncGenerator<TEvent, void, void> {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Cache-Control': 'no-cache',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(path, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    let message = `sse failed: HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j && typeof j === 'object' && 'error' in j) {
        message = String((j as Record<string, unknown>).error);
      }
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line || !line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          yield JSON.parse(payload) as TEvent;
        } catch {
          /* skip unparseable */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
