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
    'openrouter: OPENROUTER_API_KEY vazio — chat IA e transcrição de voz vão retornar 503 até configurar.',
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

// ---------- Transcription ----------

export interface TranscribeInput {
  /** Buffer de áudio (qualquer formato suportado pelo Whisper). */
  audio: Buffer;
  /** Nome do arquivo (usado pra inferir ext no FormData). */
  filename: string;
  mimeType: string;
  /** Override do modelo. Default: env.WHISPER_MODEL. */
  model?: string;
  /** Idioma (ISO-639-1). Default: pt-BR detecta sozinho — mas passar 'pt' ajuda. */
  language?: string;
}

export interface TranscribeResult {
  text: string;
  language?: string;
  durationSec?: number;
  model: string;
}

export async function transcribeAudio(input: TranscribeInput): Promise<TranscribeResult> {
  if (!isOpenRouterConfigured()) {
    throw new OpenRouterError(503, 'openrouter_not_configured');
  }

  const model = input.model ?? env.WHISPER_MODEL;

  const fd = new FormData();
  // Web FormData (Node 20+) aceita Blob diretamente; criamos a partir do Buffer.
  const blob = new Blob([new Uint8Array(input.audio)], { type: input.mimeType });
  fd.append('file', blob, input.filename);
  fd.append('model', model);
  if (input.language) fd.append('language', input.language);
  fd.append('response_format', 'json');

  const url = `${env.OPENROUTER_BASE_URL.replace(/\/$/, '')}/audio/transcriptions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: baseHeaders(),
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new OpenRouterError(res.status, 'transcription_failed', text);
  }

  const data = (await res.json()) as {
    text?: string;
    language?: string;
    duration?: number;
  };

  return {
    text: (data.text ?? '').trim(),
    language: data.language,
    durationSec: data.duration,
    model,
  };
}
