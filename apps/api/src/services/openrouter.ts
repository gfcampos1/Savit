// Cliente mínimo de OpenRouter. Cobre dois fluxos:
//  - chat.completions (streaming SSE) — usado na F8 (chat IA)
//  - audio.transcriptions (multipart) — usado na F5 (voz)
//
// Mantemos o client interno (sem SDK) pra ter controle total sobre headers,
// keep-alive e SSE.

import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';

export const isOpenRouterConfigured = (): boolean =>
  Boolean(env.OPENROUTER_API_KEY);

if (!isOpenRouterConfigured()) {
  logger.warn(
    'openrouter: OPENROUTER_API_KEY vazio — chat IA vai retornar 503 até configurar.',
  );
}

const baseHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
  'HTTP-Referer': env.OPENROUTER_HTTP_REFERER,
  'X-Title': env.OPENROUTER_APP_NAME,
});

export class OpenRouterError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

// ---------- Chat completion (streaming) ----------

/** Mensagem no formato OpenAI/OpenRouter. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  /** Pra mensagens role=tool: id da tool call sendo respondida. */
  tool_call_id?: string;
  /** Pra mensagens role=assistant: tool calls que o modelo pediu. */
  tool_calls?: ToolCallShape[];
  name?: string;
}

export interface ToolCallShape {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>; // JSON Schema
  };
}

export interface StreamEvent {
  type: 'delta' | 'tool_calls' | 'usage' | 'done';
  /** texto delta (type=delta) */
  delta?: string;
  /** tool calls completas (type=tool_calls) */
  toolCalls?: ToolCallShape[];
  /** type=usage */
  usage?: { input_tokens: number; output_tokens: number };
  /** type=done — finish_reason do modelo */
  finishReason?: string;
}

interface ChatStreamInput {
  messages: ChatMessage[];
  model: string;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | 'required';
  signal?: AbortSignal;
}

/**
 * Async generator que emite StreamEvent conforme OpenRouter manda chunks SSE.
 * Acumula tool_calls (que vêm fragmentados) e emite-os "completos" no fim.
 *
 * O caller deve consumir em loop até receber { type: 'done' }.
 */
export async function* chatCompletionStream(
  input: ChatStreamInput,
): AsyncGenerator<StreamEvent, void, void> {
  if (!isOpenRouterConfigured()) {
    throw new OpenRouterError(503, 'openrouter_not_configured');
  }

  const url = `${env.OPENROUTER_BASE_URL.replace(/\/$/, '')}/chat/completions`;
  const body = {
    model: input.model,
    messages: input.messages,
    stream: true,
    ...(input.tools && input.tools.length > 0 && {
      tools: input.tools,
      tool_choice: input.toolChoice ?? 'auto',
    }),
    // pede usage_includes pra obter tokens no final
    stream_options: { include_usage: true },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...baseHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: input.signal,
  });

  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => '');
    throw new OpenRouterError(res.status, 'chat_failed', txt);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let usage: StreamEvent['usage'];
  let finishReason: string | undefined;

  // tool_calls vêm em fragmentos. Acumulamos por índice (não por id, porque a
  // primeira mensagem traz id e nome, as seguintes só `arguments` em append).
  const toolAcc: Map<number, ToolCallShape> = new Map();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Eventos SSE são separados por linha em branco
      let nl: number;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line || !line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') {
          finishReason = finishReason ?? 'stop';
          break;
        }
        let json: Record<string, unknown>;
        try {
          json = JSON.parse(payload);
        } catch {
          continue;
        }

        const choices = (json.choices ?? []) as Array<{
          delta?: {
            content?: string;
            tool_calls?: Array<{
              index: number;
              id?: string;
              type?: string;
              function?: { name?: string; arguments?: string };
            }>;
          };
          finish_reason?: string;
        }>;

        for (const choice of choices) {
          const d = choice.delta;
          if (d?.content) {
            yield { type: 'delta', delta: d.content };
          }
          if (d?.tool_calls) {
            for (const tc of d.tool_calls) {
              const acc = toolAcc.get(tc.index) ?? {
                id: '',
                type: 'function' as const,
                function: { name: '', arguments: '' },
              };
              if (tc.id) acc.id = tc.id;
              if (tc.function?.name) acc.function.name += tc.function.name;
              if (tc.function?.arguments) acc.function.arguments += tc.function.arguments;
              toolAcc.set(tc.index, acc);
            }
          }
          if (choice.finish_reason) finishReason = choice.finish_reason;
        }

        if (json.usage && typeof json.usage === 'object') {
          const u = json.usage as { prompt_tokens?: number; completion_tokens?: number };
          usage = {
            input_tokens: u.prompt_tokens ?? 0,
            output_tokens: u.completion_tokens ?? 0,
          };
        }
      }
    }

    if (toolAcc.size > 0) {
      yield { type: 'tool_calls', toolCalls: Array.from(toolAcc.values()) };
    }
    if (usage) {
      yield { type: 'usage', usage };
    }
    yield { type: 'done', finishReason };
  } finally {
    reader.releaseLock();
  }
}
