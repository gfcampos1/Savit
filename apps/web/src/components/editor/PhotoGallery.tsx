// Galeria de fotos anexadas a uma nota. Grid de thumbs + lightbox simples.
// Suporta upload de novas fotos (botão + input file com `capture` no mobile).

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Note } from '@savit/shared';
import { uploadAttachment } from '@/lib/upload';

interface PhotoGalleryProps {
  note: Note;
  /** Permite anexar novas fotos. */
  editable?: boolean;
}

export function PhotoGallery({ note, editable = true }: PhotoGalleryProps) {
  const photos = (note.attachments ?? []).filter((a) => a.kind === 'PHOTO');
  const [active, setActive] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        await uploadAttachment({ blob: file, kind: 'PHOTO', noteId: note.id });
      }
      // Forçar refetch do note pra trazer attachments novos
      await qc.invalidateQueries({ queryKey: ['notes'] });
    } catch (err) {
      console.error('upload de foto falhou', err);
      alert('Não foi possível enviar uma das fotos.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="mb-6">
      <header className="flex items-center justify-between mb-3">
        <p className="font-mono text-[11px] uppercase tracking-mono text-ink-3">
          {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
        </p>
        {editable ? (
          <label className="cursor-pointer text-xs text-accent hover:underline underline-offset-2">
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={onPick}
              className="hidden"
            />
            {uploading ? 'enviando…' : '+ adicionar foto'}
          </label>
        ) : null}
      </header>

      {photos.length === 0 ? (
        <p className="text-center py-10 text-sm text-ink-3 italic border border-dashed hairline rounded-md">
          ainda sem fotos.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.url)}
              className="aspect-square rounded-md border hairline overflow-hidden bg-surface-2 hover:opacity-80 transition-opacity"
              aria-label="abrir foto"
            >
              <img
                src={p.url}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-6"
        >
          <img
            src={active}
            alt=""
            className="max-w-full max-h-full rounded-md shadow-card"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="fechar"
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>
      ) : null}
    </section>
  );
}
