// Chat IA com streaming SSE e tool calling.
//
// POST /api/chat/threads/:id/messages devolve text/event-stream com eventos:
//   - { type: 'delta',       content: '...' }            // texto incremental
//   - { type: 'tool_call',   id, name, args }            // modelo pediu tool
//   - { type: 'tool_result', id, name, result, effect }  // server executou
//   - { type: 'message_id',  id }                        // id final da msg do assistant
//   - { type: 'done', usage }
//   - { type: 'error', message }
//
// O loop pode iterar várias rodadas: modelo pede tools → server executa →
// resultado vai como nova mensagem role=tool → modelo continua até terminar.

import { Router, type Response } from 'express';
import { z } from 'zod';
import type { Prisma, ChatRole } from '@prisma/client';
import { ChatMessageInput } from '@savit/shared';
import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import {
  OpenRouterError,
  chatCompletionStream,
  isOpenRouterConfigured,
  type ChatMessage,
  type ToolCallShape,
} from '../services/openrouter.js';
import { SAVIT_TOOLS, runTool } from '../services/ai-tools.js';

export const chatRouter: Router = Router();
chatRouter.use(requireAuth);

// ---------- whitelist de modelos ----------

const ALLOWED_MODELS = [
  'anthropic/claude-sonnet-4-6',
  'anthropic/claude-opus-4-7',
  'openai/gpt-5',
  'google/gemini-2.5-pro',
  'meta-llama/llama-3.3-70b-instruct',
];

chatRouter.get('/models', (_req, res) => {
  res.json({
    items: ALLOWED_MODELS.map((id) => ({ id, label: humanize(id) })),
    default: env.OPENROUTER_DEFAULT_MODEL,
    fallback: env.OPENROUTER_FALLBACK_MODEL,
  });
});

function humanize(id: string): string {
  return id.split('/').pop()?.replace(/-/g, ' ') ?? id;
}

// ---------- threads ----------

chatRouter.get('/threads', async (req, res, next) => {
  try {
    const items = await prisma.chatThread.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        model: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
    res.json({
      items: items.map((t) => ({
        id: t.id,
        title: t.title,
        model: t.model,
        messageCount: t._count.messages,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

const CreateThread = z.object({
  title: z.string().min(1).max(120).optional(),
  model: z.string().max(120).optional(),
});

chatRouter.post('/threads', async (req, res, next) => {
  try {
    const input = CreateThread.parse(req.body ?? {});
    const model = input.model && ALLOWED_MODELS.includes(input.model)
      ? input.model
      : env.OPENROUTER_DEFAULT_MODEL;
    const thread = await prisma.chatThread.create({
      data: { userId: req.user!.id, title: input.title ?? null, model },
    });
    res.status(201).json({
      id: thread.id,
      title: thread.title,
      model: thread.model,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

chatRouter.get('/threads/:id', async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const thread = await prisma.chatThread.findFirst({
      where: { id, userId: req.user!.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!thread) throw new HttpError(404, 'not_found');
    res.json({
      id: thread.id,
      title: thread.title,
      model: thread.model,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      messages: thread.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
        toolResult: m.toolResult,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

chatRouter.delete('/threads/:id', async (req, res, next) => {
  try {
    const id = z.string().cuid().parse(req.params.id);
    const owns = await prisma.chatThread.findFirst({
      where: { id, userId: req.user!.id },
      select: { id: true },
    });
    if (!owns) throw new HttpError(404, 'not_found');
    await prisma.chatThread.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ---------- streaming messages ----------

chatRouter.post('/threads/:id/messages', async (req, res, next) => {
  try {
    if (!isOpenRouterConfigured()) {
      throw new HttpError(503, 'openrouter_not_configured');
    }
    const id = z.string().cuid().parse(req.params.id);
    const input = ChatMessageInput.parse(req.body);

    const thread = await prisma.chatThread.findFirst({
      where: { id, userId: req.user!.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!thread) throw new HttpError(404, 'not_found');

    // checagem de quota de tokens diária — soft limit por usuário
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const usageToday = await prisma.aiUsage.aggregate({
      where: { userId: req.user!.id, date: today },
      _sum: { inputTokens: true, outputTokens: true },
    });
    const totalTokensToday =
      (usageToday._sum.inputTokens ?? 0) + (usageToday._sum.outputTokens ?? 0);
    if (totalTokensToday >= env.AI_DAILY_TOKEN_LIMIT) {
      throw new HttpError(429, 'daily_token_limit_reached');
    }

    const model = input.model && ALLOWED_MODELS.includes(input.model) ? input.model : thread.model;

    // Persiste a mensagem do usuário
    await prisma.chatMessage.create({
      data: { threadId: thread.id, role: 'USER' as ChatRole, content: input.content },
    });
    await prisma.chatThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date(), ...(model !== thread.model && { model }) },
    });

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Constrói mensagens iniciais: system + histórico (incluindo a nova do user)
    const history: ChatMessage[] = await loadHistoryForOpenRouter(thread.id);
    const sys = await buildSystemPrompt(req.user!.id);
    let messages: ChatMessage[] = [{ role: 'system', content: sys }, ...history];

    let assistantText = '';
    let totalIn = 0;
    let totalOut = 0;
    let lastFinish = '';

    try {
      // Loop de tool calling: pode iterar até MAX_TURNS rodadas
      const MAX_TURNS = 4;
      for (let turn = 0; turn < MAX_TURNS; turn++) {
        const stream = chatCompletionStream({
          messages,
          model,
          tools: SAVIT_TOOLS,
        });

        let turnText = '';
        let turnToolCalls: ToolCallShape[] = [];
        let turnUsage: { input_tokens: number; output_tokens: number } | undefined;

        for await (const ev of stream) {
          if (ev.type === 'delta' && ev.delta) {
            turnText += ev.delta;
            sse(res, { type: 'delta', content: ev.delta });
          } else if (ev.type === 'tool_calls' && ev.toolCalls) {
            turnToolCalls = ev.toolCalls;
          } else if (ev.type === 'usage' && ev.usage) {
            turnUsage = ev.usage;
          } else if (ev.type === 'done') {
            lastFinish = ev.finishReason ?? 'stop';
          }
        }

        if (turnUsage) {
          totalIn += turnUsage.input_tokens;
          totalOut += turnUsage.output_tokens;
        }
        assistantText += turnText;

        // Sem tool calls → finalizamos
        if (turnToolCalls.length === 0) break;

        // Adiciona a mensagem do assistant com as tool_calls
        messages = [
          ...messages,
          {
            role: 'assistant',
            content: turnText || null,
            tool_calls: turnToolCalls,
          },
        ];

        // Executa cada tool e adiciona resultados como role=tool
        for (const tc of turnToolCalls) {
          sse(res, {
            type: 'tool_call',
            id: tc.id,
            name: tc.function.name,
            args: safeParse(tc.function.arguments),
          });

          let result;
          try {
            result = await runTool({ userId: req.user!.id }, tc.function.name, tc.function.arguments);
          } catch (err) {
            logger.error({ err, tool: tc.function.name }, 'tool failed');
            result = {
              output: { error: 'tool_execution_failed', message: String(err) },
              effect: { kind: 'none' as const },
            };
          }

          sse(res, {
            type: 'tool_result',
            id: tc.id,
            name: tc.function.name,
            result: result.output,
            effect: result.effect,
          });

          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(result.output),
          });
        }

        // Continua o loop pra próxima rodada (modelo vai responder com base no resultado)
      }

      // Persiste a mensagem final do assistant
      const saved = await prisma.chatMessage.create({
        data: {
          threadId: thread.id,
          role: 'ASSISTANT' as ChatRole,
          content: assistantText,
          model,
          inputTokens: totalIn,
          outputTokens: totalOut,
        },
      });

      // Atualiza usage e thread
      await Promise.all([
        prisma.aiUsage.upsert({
          where: { userId_date_model: { userId: req.user!.id, date: today, model } },
          update: {
            inputTokens: { increment: totalIn },
            outputTokens: { increment: totalOut },
          },
          create: {
            userId: req.user!.id,
            date: today,
            model,
            inputTokens: totalIn,
            outputTokens: totalOut,
          },
        }),
        prisma.chatThread.update({
          where: { id: thread.id },
          data: {
            updatedAt: new Date(),
            // gera título a partir da primeira mensagem se ainda for null
            ...(thread.title === null && {
              title: makeTitleFromContent(input.content),
            }),
          },
        }),
      ]);

      sse(res, {
        type: 'message_id',
        id: saved.id,
      });
      sse(res, {
        type: 'done',
        finishReason: lastFinish,
        usage: { input: totalIn, output: totalOut, model },
      });
      res.end();
    } catch (err) {
      const message = err instanceof OpenRouterError ? err.message : 'stream_failed';
      logger.error({ err }, 'chat stream failed');
      sse(res, { type: 'error', message });
      res.end();
    }
  } catch (err) {
    next(err);
  }
});

// ---------- helpers ----------

function sse(res: Response, payload: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

function makeTitleFromContent(text: string): string {
  return text.trim().slice(0, 60) || 'Nova conversa';
}

async function loadHistoryForOpenRouter(threadId: string): Promise<ChatMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
    take: 60,
  });
  return messages.map((m) => {
    const role: ChatMessage['role'] =
      m.role === 'USER' ? 'user' : m.role === 'ASSISTANT' ? 'assistant' : m.role === 'SYSTEM' ? 'system' : 'tool';
    return {
      role,
      content: m.content,
      ...(m.toolCalls && Array.isArray(m.toolCalls) && {
        tool_calls: m.toolCalls as unknown as ToolCallShape[],
      }),
    };
  });
}

async function buildSystemPrompt(userId: string): Promise<string> {
  const cats = await prisma.category.findMany({
    where: { userId },
    select: { name: true, color: true },
    orderBy: { sortOrder: 'asc' },
  });
  const today = new Date();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const catList = cats.map((c) => `- ${c.name}`).join('\n');

  return `Você é o assistente do Savit, um app PT-BR de notas e tarefas. Responda sempre em português do Brasil, em tom calmo e direto.

DATA E HORA AGORA: ${today.toISOString()} (timezone do servidor: ${tz})

CATEGORIAS DO USUÁRIO:
${catList || '(nenhuma ainda)'}

VOCÊ TEM ACESSO A FERRAMENTAS:
- create_task: crie tarefas com prazo. SEMPRE use ISO 8601 absoluto pra dueAt (calcule a partir da data acima).
- create_note: crie notas de texto sem prazo.
- list_tasks / search_notes / list_categories / get_today_summary: leia dados antes de responder.
- update_task: marque tarefas como concluídas, mude prazos.

REGRAS:
1. Se o usuário falar de prazo (amanhã, sex, daqui 2h…), CONVERTA para ISO 8601 absoluto e use create_task.
2. Antes de criar com categoryName, garanta que ela existe (use list_categories ou só liste como já vem acima).
3. Quando você executar tools, comente brevemente o que fez ("✦ Criei a tarefa…"). Não cole o JSON completo.
4. Se o usuário fizer uma pergunta sobre o que tem pendente / ideias recentes, USE list_tasks ou search_notes antes de inventar.
5. Mensagens curtas. Sem listas longas a menos que pedido.`;
}
