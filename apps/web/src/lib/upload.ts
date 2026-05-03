// Upload de anexos. Fluxo:
//   1. POST /api/uploads/sign     → { uploadUrl, attachmentId, headers, mode }
//   2. PUT  uploadUrl (body=blob) → 204 (sem Authorization, é direto pro storage)
//   3. POST /api/uploads/complete → { url, ... } com a URL pública pronta
//
// Em dev (mode=local) o uploadUrl é uma rota nossa /api/uploads/local/* — o PUT
// passa pelo Vite proxy. Em prod (mode=r2) é uma URL absoluta da Cloudflare.

import { api } from './api';

export type AttachmentKind = 'PHOTO' | 'AUDIO' | 'DRAWING_EXPORT' | 'FILE';

export interface SignedUploadResponse {
  attachmentId: string;
  r2Key: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresInSec: number;
  mode: 'r2' | 'local';
}

export interface CompletedAttachment {
  id: string;
  noteId: string | null;
  kind: AttachmentKind;
  r2Key: string;
  mimeType: string;
  sizeBytes: number;
  url: string | null;
  createdAt: string;
  uploadedAt: string | null;
}

export interface UploadOptions {
  blob: Blob;
  kind: AttachmentKind;
  noteId?: string;
  meta?: Record<string, unknown>;
  durationMs?: number;
  onProgress?: (loaded: number, total: number) => void;
}

export async function uploadAttachment(opts: UploadOptions): Promise<{
  attachment: CompletedAttachment;
  /** URL utilizável imediatamente para `<img src>` etc. */
  url: string;
}> {
  const sign = await api<SignedUploadResponse>('/api/uploads/sign', {
    method: 'POST',
    body: {
      kind: opts.kind,
      mimeType: opts.blob.type || 'application/octet-stream',
      sizeBytes: opts.blob.size,
      ...(opts.noteId && { noteId: opts.noteId }),
    },
  });

  // PUT direto. fetch() não emite progresso — quando precisarmos disso (áudios
  // longos), trocar por XHR. Por ora basta.
  const putRes = await fetch(sign.uploadUrl, {
    method: 'PUT',
    headers: sign.headers,
    body: opts.blob,
  });
  if (!putRes.ok) {
    throw new Error(`upload PUT falhou: HTTP ${putRes.status}`);
  }
  opts.onProgress?.(opts.blob.size, opts.blob.size);

  const attachment = await api<CompletedAttachment>('/api/uploads/complete', {
    method: 'POST',
    body: {
      attachmentId: sign.attachmentId,
      ...(opts.noteId && { noteId: opts.noteId }),
      ...(opts.meta && { meta: opts.meta }),
      ...(opts.durationMs !== undefined && { durationMs: opts.durationMs }),
    },
  });

  // url pode vir nulo (modo r2 — usa R2_PUBLIC_BASE_URL pelo backend).
  // Em ambos os casos a forma mais robusta é GET /api/notes/:id depois pra
  // resolver. Pra imagens que precisam aparecer JÁ no editor, usamos a
  // uploadUrl em local e construímos a URL absoluta em r2.
  const inlineUrl =
    attachment.url ??
    (sign.mode === 'r2'
      ? sign.uploadUrl.split('?')[0] ?? sign.uploadUrl // remove a query string da assinatura
      : sign.uploadUrl);

  return { attachment, url: inlineUrl };
}
