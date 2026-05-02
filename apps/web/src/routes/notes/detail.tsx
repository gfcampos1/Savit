import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useNote, usePatchNote } from '@/hooks/useNotes';
import { useCategories } from '@/hooks/useCategories';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { TipTapEditor, type TipTapDoc } from '@/components/editor/TipTapEditor';
import { PhotoGallery } from '@/components/editor/PhotoGallery';
import { CategoryPicker } from '@/components/composer/CategoryPicker';
import { dayHeading, formatTime } from '@/lib/format-date';

// tldraw é pesado — só carrega quando o usuário abre uma nota DRAWING.
const DrawingCanvas = lazy(() =>
  import('@/components/editor/DrawingCanvas').then((m) => ({ default: m.DrawingCanvas })),
);

export function NoteDetailPage() {
  const params = useParams();
  const id = params.id;
  const navigate = useNavigate();
  const note = useNote(id);
  const cats = useCategories();
  const patch = usePatchNote();

  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const initial = useMemo(() => {
    if (!note.data) return null;
    return { json: note.data.contentJson, text: note.data.contentText };
  }, [note.data]);

  const debouncedSave = useDebouncedCallback(async (doc: TipTapDoc) => {
    if (!id) return;
    try {
      await patch.mutateAsync({ id, contentJson: doc.json, contentText: doc.text });
      setSavedAt(Date.now());
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'erro ao salvar');
    }
  }, 800);

  // Para DRAWING: snapshot vira contentJson (texto fica vazio).
  const saveDrawing = useCallback(
    async (snapshot: unknown) => {
      if (!id) return;
      try {
        await patch.mutateAsync({ id, contentJson: snapshot });
        setSavedAt(Date.now());
        setSaveError(null);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'erro ao salvar');
      }
    },
    [id, patch],
  );

  // flush ao desmontar (mudança de rota)
  useEffect(() => () => debouncedSave.flush(), [debouncedSave]);

  if (note.isLoading || !initial) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="label-mono text-ink-3">carregando…</p>
      </div>
    );
  }

  if (note.error || !note.data) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="display-serif text-2xl">Nota não encontrada.</p>
        <Link to="/" className="text-sm text-accent underline underline-offset-2 mt-3 inline-block">
          ← voltar pro inbox
        </Link>
      </div>
    );
  }

  const n = note.data;
  const updated = new Date(n.updatedAt);

  async function changeCategory(categoryId: string | null) {
    if (!id) return;
    await patch.mutateAsync({ id, categoryId });
  }

  return (
    <article className="max-w-3xl mx-auto px-6 py-10 pb-32">
      <header className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-ink-2 hover:text-ink"
          aria-label="voltar"
        >
          ←
        </button>
        <CategoryPicker
          categories={cats.data ?? []}
          value={n.categoryId}
          onChange={(catId) => void changeCategory(catId)}
        />
        <span className="flex-1" />
        <span className="font-mono text-[11px] uppercase tracking-mono text-ink-3">
          {dayHeading(updated)} · {formatTime(updated)}
        </span>
        <SaveStatus saving={patch.isPending} savedAt={savedAt} error={saveError} />
      </header>

      {n.type === 'VOICE' ? <AudioAttachments note={n} /> : null}

      {n.type === 'PHOTO' || n.type === 'MIXED' ? <PhotoGallery note={n} /> : null}

      {n.type === 'DRAWING' ? (
        <Suspense
          fallback={
            <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3 py-10 text-center">
              carregando canvas…
            </p>
          }
        >
          <DrawingCanvas
            initialSnapshot={initial.json}
            onChange={(snap) => void saveDrawing(snap)}
          />
        </Suspense>
      ) : (
        <TipTapEditor
          initialJson={initial.json}
          initialText={initial.text ?? ''}
          noteId={n.id}
          onChange={debouncedSave}
          placeholder={
            n.type === 'VOICE'
              ? 'transcrição (edite à vontade)…'
              : n.type === 'PHOTO'
              ? 'legenda ou notas sobre as fotos…'
              : 'comece a escrever — cole imagens, formate texto…'
          }
        />
      )}
    </article>
  );
}

function AudioAttachments({ note }: { note: NonNullable<ReturnType<typeof useNote>['data']> }) {
  const audios = (note.attachments ?? []).filter((a) => a.kind === 'AUDIO');
  if (audios.length === 0) return null;
  return (
    <div className="mb-6 flex flex-col gap-2">
      {audios.map((a) => (
        <figure
          key={a.id}
          className="rounded-md border hairline bg-surface-2 p-3 flex items-center gap-3"
        >
          <span className="font-mono text-[10px] uppercase tracking-mono text-ink-3 shrink-0">
            áudio
          </span>
          <audio src={a.url} controls preload="metadata" className="flex-1 h-8" />
        </figure>
      ))}
    </div>
  );
}

function SaveStatus({
  saving,
  savedAt,
  error,
}: {
  saving: boolean;
  savedAt: number | null;
  error: string | null;
}) {
  if (error) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-mono text-danger">
        erro · tentando…
      </span>
    );
  }
  if (saving) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-mono text-ink-3">
        salvando…
      </span>
    );
  }
  if (savedAt && Date.now() - savedAt < 5_000) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-mono text-success">
        salvo ✓
      </span>
    );
  }
  return null;
}
