import { Router } from 'express';
import express from 'express';
import { z } from 'zod';
import path from 'node:path';
import { createWriteStream, createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { UploadSignInput } from '@savit/shared';
import type { AttachmentKind } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { buildKey, signPutUrl, STORAGE_MODE, LOCAL_UPLOADS_DIR } from '../services/r2.js';

export const uploadsRouter: Router = Router();

// ----- Fallback local (dev) — registrado ANTES dos handlers autenticados -----
// O cliente faz PUT direto aqui sem auth: o r2Key inclui userId, e em dev
// adivinhar URLs de outras pessoas não é problema. Em prod (mode=r2) esta
// rota não recebe requisições — Cloudflare R2 cobre tudo via presigned URL.

if (STORAGE_MODE === 'local') {
  uploadsRouter.put(
    '/local/:key',
    express.raw({ type: '*/*', limit: '50mb' }),
    async (req, res, next) => {
      try {
        const key = decodeURIComponent(req.params.key ?? '');
        if (!isSafeKey(key)) throw new HttpError(400, 'invalid_key');
        const target = path.join(LOCAL_UPLOADS_DIR, key);
        ensureParentDir(target);
        const ws = createWriteStream(target);
        ws.write(req.body);
        ws.end();
        ws.on('close', () => res.status(204).end());
        ws.on('error', (err) => next(err));
      } catch (err) {
        next(err);
      }
    },
  );

  uploadsRouter.get('/local/:key', async (req, res, next) => {
    try {
      const key = decodeURIComponent(req.params.key ?? '');
      if (!isSafeKey(key)) throw new HttpError(400, 'invalid_key');
      const target = path.join(LOCAL_UPLOADS_DIR, key);
      if (!existsSync(target)) throw new HttpError(404, 'not_found');
      const stats = await stat(target);
      const att = await prisma.attachment.findFirst({
        where: { r2Key: key },
        select: { mimeType: true },
      });
      res.setHeader('Content-Type', att?.mimeType ?? 'application/octet-stream');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      createReadStream(target).pipe(res);
    } catch (err) {
      next(err);
    }
  });
}

// ----- Endpoints autenticados (/sign, /complete) -----
const signedHandler = Router();
signedHandler.use(requireAuth);

signedHandler.post('/sign', async (req, res, next) => {
  try {
    const input = UploadSignInput.parse(req.body);
    if (input.noteId) {
      const owns = await prisma.note.findFirst({
        where: { id: input.noteId, userId: req.user!.id },
        select: { id: true },
      });
      if (!owns) throw new HttpError(400, 'invalid_note');
    }

    const r2Key = buildKey(req.user!.id, input.kind, input.mimeType);

    // pré-cria o registro com uploadedAt = null; cliente confirma em /complete
    const att = await prisma.attachment.create({
      data: {
        userId: req.user!.id,
        noteId: input.noteId ?? null,
        kind: input.kind as AttachmentKind,
        r2Key,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      },
      select: { id: true, r2Key: true },
    });

    const signed = await signPutUrl({
      r2Key,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    });

    res.status(201).json({
      attachmentId: att.id,
      r2Key: att.r2Key,
      uploadUrl: signed.uploadUrl,
      method: signed.method,
      headers: signed.headers,
      expiresInSec: signed.expiresInSec,
      mode: STORAGE_MODE,
    });
  } catch (err) {
    next(err);
  }
});

const CompleteInput = z.object({
  attachmentId: z.string().cuid(),
  noteId: z.string().cuid().optional(),
  meta: z.record(z.unknown()).optional(),
  durationMs: z.number().int().nonnegative().optional(),
});

signedHandler.post('/complete', async (req, res, next) => {
  try {
    const input = CompleteInput.parse(req.body);
    const att = await prisma.attachment.findFirst({
      where: { id: input.attachmentId, userId: req.user!.id },
    });
    if (!att) throw new HttpError(404, 'not_found');

    if (input.noteId) {
      const owns = await prisma.note.findFirst({
        where: { id: input.noteId, userId: req.user!.id },
        select: { id: true },
      });
      if (!owns) throw new HttpError(400, 'invalid_note');
    }

    const updated = await prisma.attachment.update({
      where: { id: att.id },
      data: {
        uploadedAt: new Date(),
        ...(input.noteId !== undefined && { note: { connect: { id: input.noteId } } }),
        ...(input.meta !== undefined && { meta: input.meta as object }),
        ...(input.durationMs !== undefined && { durationMs: input.durationMs }),
      },
    });

    res.json(serializeAttachment(updated));
  } catch (err) {
    next(err);
  }
});

uploadsRouter.use('/', signedHandler);

function isSafeKey(key: string): boolean {
  if (!key) return false;
  if (key.includes('..')) return false;
  if (key.startsWith('/') || key.startsWith('\\')) return false;
  return true;
}

function ensureParentDir(file: string) {
  const dir = path.dirname(file);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function serializeAttachment(a: {
  id: string;
  noteId: string | null;
  kind: AttachmentKind;
  r2Key: string;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  transcription: string | null;
  meta: unknown;
  uploadedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: a.id,
    noteId: a.noteId,
    kind: a.kind,
    r2Key: a.r2Key,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    durationMs: a.durationMs,
    transcription: a.transcription,
    meta: a.meta,
    url: STORAGE_MODE === 'local' ? `/api/uploads/local/${encodeURIComponent(a.r2Key)}` : null,
    uploadedAt: a.uploadedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}
// suprimir warning de unused (statSync) — útil futuramente
void statSync;
