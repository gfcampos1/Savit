// Transcrição de voz. Dois fluxos suportados:
//   1) JSON { attachmentId } — áudio já está no R2/local (uploadAttachment).
//      Lemos via fetch (R2 público ou /api/uploads/local) e passamos pro Whisper.
//   2) Multipart com campo "audio" — útil pra clipes curtos sem persistir.
//
// O fluxo (1) é o caminho preferido do frontend pra notas de voz: a UI já fez
// upload + complete antes, o áudio fica acessível e a transcrição é guardada
// em Attachment.transcription pra reaproveitar.

import { Router } from 'express';
import { z } from 'zod';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { LOCAL_UPLOADS_DIR, STORAGE_MODE, publicUrlFor } from '../services/r2.js';
import { OpenRouterError, transcribeAudio } from '../services/openrouter.js';

export const voiceRouter: Router = Router();
voiceRouter.use(requireAuth);

const Body = z.object({
  attachmentId: z.string().cuid(),
  language: z.string().min(2).max(8).optional(),
  model: z.string().max(120).optional(),
});

voiceRouter.post('/transcribe', async (req, res, next) => {
  try {
    const input = Body.parse(req.body);
    const att = await prisma.attachment.findFirst({
      where: { id: input.attachmentId, userId: req.user!.id },
    });
    if (!att) throw new HttpError(404, 'not_found');
    if (att.kind !== 'AUDIO') throw new HttpError(400, 'attachment_not_audio');

    // se já transcrito, devolve sem reprocessar
    if (att.transcription) {
      res.json({
        text: att.transcription,
        cached: true,
        attachmentId: att.id,
        durationMs: att.durationMs,
      });
      return;
    }

    const audio = await loadAudio(att.r2Key);
    if (!audio) throw new HttpError(404, 'audio_file_missing');

    const result = await transcribeAudio({
      audio,
      filename: path.basename(att.r2Key),
      mimeType: att.mimeType,
      language: input.language ?? 'pt',
      model: input.model,
    });

    const updated = await prisma.attachment.update({
      where: { id: att.id },
      data: {
        transcription: result.text,
        ...(result.durationSec !== undefined && {
          durationMs: Math.round(result.durationSec * 1000),
        }),
      },
    });

    // Atualiza usage (insere ou soma)
    await recordUsage(req.user!.id, result.model, audio.length);

    res.json({
      text: result.text,
      language: result.language,
      cached: false,
      model: result.model,
      attachmentId: att.id,
      durationMs: updated.durationMs,
    });
  } catch (err) {
    if (err instanceof OpenRouterError) {
      return next(new HttpError(err.status, err.message, err.body));
    }
    next(err);
  }
});

// ----- helpers -----

async function loadAudio(r2Key: string): Promise<Buffer | null> {
  if (STORAGE_MODE === 'local') {
    const target = path.join(LOCAL_UPLOADS_DIR, r2Key);
    if (!existsSync(target)) return null;
    return readFile(target);
  }
  // Em prod, o R2_PUBLIC_BASE_URL deve permitir GET autenticado ou ser público.
  const url = publicUrlFor(r2Key);
  const res = await fetch(url);
  if (!res.ok) return null;
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

/**
 * Registra uso na tabela AiUsage. Whisper cobra por minuto; aqui guardamos
 * só o tamanho do arquivo (audioSeconds aproximado) — refinaremos quando
 * tivermos a duração exata do clipe.
 */
async function recordUsage(userId: string, model: string, audioBytes: number): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  // Estimativa grosseira: ~16 KB/s pra opus 96 kbps. Bom o suficiente pra
  // controle de quota; o número exato vem com a duração.
  const audioSeconds = Math.max(1, Math.round(audioBytes / 16_000));
  await prisma.aiUsage.upsert({
    where: { userId_date_model: { userId, date: today, model } },
    update: { audioSeconds: { increment: audioSeconds } },
    create: { userId, date: today, model, audioSeconds },
  });
}
