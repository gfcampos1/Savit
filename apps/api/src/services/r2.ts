// Storage service. Em produção usa Cloudflare R2 via API S3-compatible com
// presigned PUT URLs. Em dev (sem credenciais R2) cai num fallback local que
// guarda arquivos em apps/api/.uploads/ e expõe via /api/uploads/local/*.
//
// O contrato é o mesmo: o cliente recebe { uploadUrl, publicUrl, r2Key } e
// faz PUT direto pra uploadUrl, sem o backend ter que buffer-ar o arquivo.

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isR2Configured = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY,
);

export const STORAGE_MODE: 'r2' | 'local' = isR2Configured ? 'r2' : 'local';

if (STORAGE_MODE === 'local') {
  logger.warn(
    'storage: R2 não configurado, usando disco local em apps/api/.uploads/. Configure R2_* pra produção.',
  );
}

// Pasta local pra dev fallback (apps/api/.uploads/)
export const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../.uploads');
if (STORAGE_MODE === 'local' && !existsSync(LOCAL_UPLOADS_DIR)) {
  mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

const r2Client =
  STORAGE_MODE === 'r2'
    ? new S3Client({
        region: env.R2_REGION,
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
      })
    : null;

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/mp4': 'm4a',
  'application/pdf': 'pdf',
  'application/json': 'json',
};

export function buildKey(userId: string, kind: string, mimeType: string): string {
  const id = crypto.randomBytes(12).toString('base64url');
  const ext = EXT_BY_MIME[mimeType] ?? mimeTypeToExt(mimeType);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  return `${userId}/${kind.toLowerCase()}/${date}/${id}${ext ? `.${ext}` : ''}`;
}

function mimeTypeToExt(mime: string): string {
  const slash = mime.indexOf('/');
  if (slash === -1) return '';
  return mime.slice(slash + 1).replace(/[^a-z0-9]/gi, '');
}

export interface SignedUpload {
  uploadUrl: string;
  publicUrl: string;
  r2Key: string;
  /** indica que o cliente deve usar PUT (sempre, neste design). */
  method: 'PUT';
  /** headers que o cliente DEVE enviar no PUT (pra cassar com a assinatura). */
  headers: Record<string, string>;
  expiresInSec: number;
}

export async function signPutUrl(opts: {
  r2Key: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<SignedUpload> {
  if (STORAGE_MODE === 'r2' && r2Client) {
    const cmd = new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: opts.r2Key,
      ContentType: opts.mimeType,
      ContentLength: opts.sizeBytes,
    });
    const uploadUrl = await getSignedUrl(r2Client, cmd, { expiresIn: 600 });
    return {
      uploadUrl,
      publicUrl: publicUrlFor(opts.r2Key),
      r2Key: opts.r2Key,
      method: 'PUT',
      headers: { 'Content-Type': opts.mimeType },
      expiresInSec: 600,
    };
  }

  // Local fallback: o cliente faz PUT direto numa rota nossa.
  const localPath = `/api/uploads/local/${encodeURIComponent(opts.r2Key)}`;
  return {
    uploadUrl: localPath,
    publicUrl: localPath,
    r2Key: opts.r2Key,
    method: 'PUT',
    headers: { 'Content-Type': opts.mimeType },
    expiresInSec: 600,
  };
}

/**
 * URL de leitura pública. Em prod usa o R2_PUBLIC_BASE_URL (pode ser um domínio
 * custom ou pub-xxxx.r2.dev). Em dev devolve a rota local.
 */
export function publicUrlFor(r2Key: string): string {
  if (STORAGE_MODE === 'r2') {
    const base = env.R2_PUBLIC_BASE_URL.replace(/\/$/, '');
    return `${base}/${r2Key}`;
  }
  return `/api/uploads/local/${encodeURIComponent(r2Key)}`;
}

/** GET pra leituras autenticadas (futuro) — devolve URL assinada. */
export async function signGetUrl(r2Key: string): Promise<string> {
  if (STORAGE_MODE === 'r2' && r2Client) {
    const cmd = new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: r2Key });
    return getSignedUrl(r2Client, cmd, { expiresIn: 3600 });
  }
  return publicUrlFor(r2Key);
}
