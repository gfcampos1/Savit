import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '@savit/shared';
import { parseNatural } from '@/lib/parse-natural';
import { useCreateNote } from '@/hooks/useNotes';
import { useCreateTask } from '@/hooks/useTasks';
import { useMakeTaskRecurring } from '@/hooks/useRecurringTasks';
import { uploadAttachment } from '@/lib/upload';
import { PreviewChips } from './PreviewChips';
import { CategoryPicker } from './CategoryPicker';
import { VoiceRecorder } from '@/components/editor/VoiceRecorder';
import { toast } from '@/stores/ui';

interface ComposerProps {
  categories: Category[];
  defaultCategoryId?: string | null;
  /** Texto inicial pré-preenchido (ex: vindo do share target). */
  initialText?: string;
}

/**
 * Captura natural com chips de preview. SPEC §3.3 + F1.
 *
 * - Parser roda enquanto digita; chips removíveis.
 * - Categoria pode ser fixada via dropdown (sobrescreve #hashtag).
 * - Cmd/Ctrl+Enter envia, Esc colapsa.
 * - Cria nota OU tarefa baseado no parser; se houver dueAt → tarefa.
 */
export function Composer({
  categories,
  defaultCategoryId = null,
  initialText = '',
}: ComposerProps) {
  const [text, setText] = useState(initialText);

  // se o initialText mudar (ex: novo share-target enquanto app está aberto),
  // sobrescrevemos o draft local — mais útil que ignorar.
  useEffect(() => {
    if (initialText) setText(initialText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText]);
  const [pinnedCategoryId, setPinnedCategoryId] = useState<string | null>(defaultCategoryId);
  const [recurringWeekly, setRecurringWeekly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const createNote = useCreateNote();
  const createTask = useCreateTask();
  const makeRecurring = useMakeTaskRecurring();

  const parsed = useMemo(() => parseNatural(text, categories), [text, categories]);
  const effectiveCategoryId = pinnedCategoryId ?? parsed.categoryId;

  // auto-grow do textarea (max 5 linhas)
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 5 * 28); // ~5 linhas em fs 15
    el.style.height = `${next}px`;
  }, [text]);

  function clearMatch(idx: number) {
    const m = parsed.matches[idx];
    if (!m || !m.raw) return;
    setText((prev) => prev.replace(m.raw, '').replace(/\s{2,}/g, ' ').trim());
  }

  function reset() {
    setText('');
    setError(null);
    setRecurringWeekly(false);
    requestAnimationFrame(() => taRef.current?.focus());
  }

  async function submit() {
    const content = parsed.text.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (parsed.isTask) {
        const task = await createTask.mutateAsync({
          title: content,
          dueAt: parsed.dueAt ? new Date(parsed.dueAt).toISOString() : null,
          categoryId: effectiveCategoryId ?? null,
          priority: parsed.priority ?? undefined,
          status: 'TODAY',
          column: 'hoje',
        });
        if (recurringWeekly) {
          await makeRecurring.mutateAsync({ taskId: task.id });
        }
      } else {
        await createNote.mutateAsync({
          type: 'TEXT',
          contentText: content,
          rawInput: parsed.raw,
          categoryId: effectiveCategoryId ?? null,
          priority: parsed.priority ?? undefined,
        });
      }
      reset();
    } catch (err) {
      setError('Não conseguimos salvar agora. Tente de novo.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function createDrawingNote() {
    const note = await createNote.mutateAsync({
      type: 'DRAWING',
      contentText: '',
      categoryId: effectiveCategoryId ?? null,
    });
    navigate(`/notes/${note.id}`);
  }

  async function createMindMapNote() {
    const note = await createNote.mutateAsync({
      type: 'MINDMAP',
      contentText: '',
      categoryId: effectiveCategoryId ?? null,
    });
    navigate(`/notes/${note.id}`);
  }

  /**
   * Cria nota tipo PHOTO e dispara o file picker. Tem que criar a nota primeiro
   * pra associar os anexos. Como o file picker é síncrono via DOM, usamos uma
   * ref oculta no JSX abaixo e chamamos click() depois.
   */
  async function createPhotoNote(files: FileList | null) {
    const fileArr = files ? Array.from(files) : [];
    if (fileArr.length === 0) return;
    const note = await createNote.mutateAsync({
      type: 'PHOTO',
      contentText: '',
      categoryId: effectiveCategoryId ?? null,
    });
    for (const f of fileArr) {
      await uploadAttachment({ blob: f, kind: 'PHOTO', noteId: note.id });
    }
    navigate(`/notes/${note.id}`);
  }

  async function onVoiceTranscript(transcript: string) {
    setVoiceBusy('salvando…');
    try {
      // Aplica o parser natural na transcrição (pode capturar #categoria,
      // hoje 9h, etc. se o usuário disser de viva voz).
      const speechParsed = parseNatural(transcript, categories);
      const cleanText = speechParsed.text.trim() || transcript;

      let note;
      if (speechParsed.isTask) {
        await createTask.mutateAsync({
          title: cleanText,
          dueAt: speechParsed.dueAt ? new Date(speechParsed.dueAt).toISOString() : null,
          categoryId: speechParsed.categoryId ?? effectiveCategoryId ?? null,
          priority: speechParsed.priority ?? undefined,
          status: 'TODAY',
          column: 'hoje',
        });
        toast({ message: 'Tarefa criada por voz.', tone: 'success' });
      } else {
        note = await createNote.mutateAsync({
          type: 'TEXT',
          contentText: cleanText,
          rawInput: transcript,
          categoryId: speechParsed.categoryId ?? effectiveCategoryId ?? null,
          priority: speechParsed.priority ?? undefined,
        });
        toast({
          message: 'Nota criada por voz.',
          tone: 'success',
          actionLabel: 'Abrir',
          onAction: () => navigate(`/notes/${note!.id}`),
        });
      }

      setVoiceOpen(false);
      setVoiceBusy(null);
    } catch (err) {
      console.error('voice flow error', err);
      setError('Não conseguimos salvar.');
      setVoiceBusy(null);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void submit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      taRef.current?.blur();
    }
  }

  if (voiceOpen) {
    return (
      <VoiceRecorder
        busyLabel={voiceBusy}
        onCancel={() => {
          setVoiceOpen(false);
          setVoiceBusy(null);
        }}
        onComplete={onVoiceTranscript}
      />
    );
  }

  const canSubmit = !!text.trim() && !submitting;

  return (
    <div className="space-y-2">
      {/* Bubble principal: textarea + ícones inline + send circular.
          Padrão chat moderno (WhatsApp/iMessage): tudo num container só. */}
      <div className="rounded-3xl border hairline bg-surface shadow-card px-4 pt-3 pb-2">
        {parsed.matches.length > 0 ? (
          <PreviewChips parsed={parsed} onClearMatch={clearMatch} />
        ) : null}

        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Envie uma mensagem…"
          rows={1}
          className="w-full resize-none bg-transparent text-ink text-md leading-snug outline-none placeholder:text-ink-3 py-1 no-scrollbar"
          aria-label="capturar ideia"
        />

        <div className="mt-1 flex items-center gap-1">
          {/* Ícones inline sem borda — só ícone tappable. */}
          <button
            type="button"
            onClick={() => setVoiceOpen(true)}
            aria-label="gravar voz"
            title="gravar voz"
            className="grid place-items-center h-9 w-9 rounded-full text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <MicIcon />
          </button>
          <label
            aria-label="adicionar foto"
            title="foto / câmera"
            className="grid place-items-center h-9 w-9 rounded-full text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={(e) => void createPhotoNote(e.target.files)}
              className="hidden"
            />
            <PhotoIcon />
          </label>
          <button
            type="button"
            onClick={() => void createDrawingNote()}
            aria-label="desenhar"
            title="desenho à mão"
            className="grid place-items-center h-9 w-9 rounded-full text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <PenIcon />
          </button>
          <button
            type="button"
            onClick={() => void createMindMapNote()}
            aria-label="mapa mental"
            title="mapa mental"
            className="grid place-items-center h-9 w-9 rounded-full text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <MindIcon />
          </button>

          <span className="flex-1" />

          {/* Send circular ancorado à direita do bubble. */}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit}
            aria-label="enviar"
            className={`grid place-items-center h-10 w-10 rounded-full transition-colors shrink-0 ${
              canSubmit
                ? 'bg-ink text-bg hover:opacity-90'
                : 'bg-surface-2 text-ink-3 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="font-mono text-[10px]">…</span>
            ) : (
              <ArrowUpIcon />
            )}
          </button>
        </div>
      </div>

      {/* Tray de contexto fora do bubble — categoria + recorrência + dica.
          Visualmente leve, não compete com o bubble principal. */}
      <div className="px-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryPicker
            categories={categories}
            value={pinnedCategoryId}
            onChange={setPinnedCategoryId}
            autoCategoryName={!pinnedCategoryId ? parsed.categoryName : null}
          />
          {parsed.isTask ? (
            <button
              type="button"
              onClick={() => setRecurringWeekly((v) => !v)}
              aria-pressed={recurringWeekly}
              title="Toda semana, no dia de hoje, cria uma nova cópia em 'Sem prazo'"
              className={`inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs transition-colors ${
                recurringWeekly
                  ? 'bg-ink text-bg border-ink'
                  : 'hairline text-ink-2 hover:text-ink'
              }`}
            >
              ↻ semanal
            </button>
          ) : null}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-mono text-ink-3 hidden sm:block">
          ⌘↵ enviar
        </span>
      </div>

      {error ? (
        <p className="px-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 6l1.5-2h5L16 6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 4l6 6L9 21H3v-6L14 4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13 5l6 6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function MindIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="4" cy="6" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="20" cy="6" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="4" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="20" cy="18" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M10 11L6 7M14 11l4-4M10 13l-4 4M14 13l4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M5 12l7-7 7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
