import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '@savit/shared';
import { parseNatural } from '@/lib/parse-natural';
import { useCreateNote, usePatchNote } from '@/hooks/useNotes';
import { useCreateTask } from '@/hooks/useTasks';
import { transcribeAttachment, uploadAttachment } from '@/lib/upload';
import { ApiError } from '@/lib/api';
import { PreviewChips } from './PreviewChips';
import { CategoryPicker } from './CategoryPicker';
import { VoiceRecorder, type RecordedClip } from '@/components/editor/VoiceRecorder';

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const createNote = useCreateNote();
  const patchNote = usePatchNote();
  const createTask = useCreateTask();

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
    requestAnimationFrame(() => taRef.current?.focus());
  }

  async function submit() {
    const content = parsed.text.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (parsed.isTask) {
        await createTask.mutateAsync({
          title: content,
          dueAt: parsed.dueAt ? new Date(parsed.dueAt).toISOString() : null,
          categoryId: effectiveCategoryId ?? null,
          priority: parsed.priority ?? undefined,
          status: 'TODAY',
          column: 'hoje',
        });
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

  async function onVoiceClip(clip: RecordedClip) {
    setVoiceBusy('enviando…');
    try {
      // 1. cria a nota tipo VOICE primeiro pra poder linkar o anexo
      const note = await createNote.mutateAsync({
        type: 'VOICE',
        contentText: '',
        rawInput: '[áudio]',
        categoryId: effectiveCategoryId ?? null,
      });

      // 2. upload do áudio
      setVoiceBusy('enviando áudio…');
      const { attachment } = await uploadAttachment({
        blob: clip.blob,
        kind: 'AUDIO',
        noteId: note.id,
        durationMs: clip.durationMs,
      });

      // 3. transcribe (pode falhar se OPENROUTER_API_KEY ausente — não bloqueia)
      let transcript = '';
      setVoiceBusy('transcrevendo…');
      try {
        const t = await transcribeAttachment(attachment.id, 'pt');
        transcript = t.text;
      } catch (err) {
        console.warn('transcribe falhou', err);
        if (err instanceof ApiError && err.status === 503) {
          transcript = '[transcrição indisponível — configure OPENROUTER_API_KEY]';
        } else {
          transcript = '[falha ao transcrever]';
        }
      }

      // 4. atualiza a nota com o texto transcrito
      await patchNote.mutateAsync({ id: note.id, contentText: transcript });

      setVoiceOpen(false);
      setVoiceBusy(null);
      navigate(`/notes/${note.id}`);
    } catch (err) {
      console.error('voice flow error', err);
      setError('Não conseguimos salvar a gravação.');
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
        onComplete={onVoiceClip}
      />
    );
  }

  return (
    <div className="rounded-lg border hairline bg-surface shadow-card p-3">
      {parsed.matches.length > 0 ? (
        <PreviewChips parsed={parsed} onClearMatch={clearMatch} />
      ) : null}

      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Sobre o que é? — escreva ou cole, # categoria, amanhã 9h pra virar tarefa…"
          rows={1}
          className="flex-1 resize-none bg-transparent text-ink text-md leading-snug outline-none placeholder:text-ink-3 py-1"
          aria-label="capturar ideia"
        />
        <button
          type="button"
          onClick={() => setVoiceOpen(true)}
          aria-label="gravar voz"
          title="gravar voz"
          className="grid place-items-center h-10 w-10 rounded-pill border hairline text-ink-2 hover:text-accent hover:border-accent transition-colors"
        >
          <MicIcon />
        </button>
        <label
          aria-label="adicionar foto"
          title="foto / câmera"
          className="grid place-items-center h-10 w-10 rounded-pill border hairline text-ink-2 hover:text-accent hover:border-accent transition-colors cursor-pointer"
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
          className="grid place-items-center h-10 w-10 rounded-pill border hairline text-ink-2 hover:text-accent hover:border-accent transition-colors"
        >
          <PenIcon />
        </button>
        <button
          type="button"
          onClick={() => void createMindMapNote()}
          aria-label="mapa mental"
          title="mapa mental"
          className="grid place-items-center h-10 w-10 rounded-pill border hairline text-ink-2 hover:text-accent hover:border-accent transition-colors"
        >
          <MindIcon />
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!text.trim() || submitting}
          aria-label="enviar"
          className="grid place-items-center h-10 w-10 rounded-pill bg-ink text-bg disabled:opacity-40 transition-opacity"
        >
          {submitting ? (
            <span className="font-mono text-[10px]">…</span>
          ) : (
            <SendIcon />
          )}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <CategoryPicker
          categories={categories}
          value={pinnedCategoryId}
          onChange={setPinnedCategoryId}
          autoCategoryName={!pinnedCategoryId ? parsed.categoryName : null}
        />
        <span className="font-mono text-[10px] uppercase tracking-mono text-ink-3 hidden sm:block">
          ⌘↵ enviar
        </span>
      </div>

      {error ? (
        <p className="text-xs text-danger mt-2" role="alert">
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

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12L19 5L13 19L11 13L5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
