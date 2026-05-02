import { useState } from 'react';
import type { Note } from '@savit/shared';
import { formatTime } from '@/lib/format-date';
import { useDeleteNote } from '@/hooks/useNotes';

interface NoteCardProps {
  note: Note;
}

/** Card de NOTA — Paper: serif 19px, metadata em linha. SPEC §3.2. */
export function NoteCard({ note }: NoteCardProps) {
  const [deleting, setDeleting] = useState(false);
  const del = useDeleteNote();

  async function onDelete() {
    if (deleting) return;
    if (!confirm('Excluir esta nota?')) return;
    setDeleting(true);
    try {
      await del.mutateAsync(note.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article
      className="rounded-md border hairline bg-surface p-4 shadow-card relative group"
      data-note-id={note.id}
    >
      {note.contentText ? (
        <p className="display-serif text-[19px] leading-snug text-ink whitespace-pre-wrap">
          {note.contentText}
        </p>
      ) : (
        <p className="text-ink-3 italic text-sm">(sem texto)</p>
      )}

      <div className="mt-3 flex items-center gap-2 text-[11.5px] font-mono text-ink-3">
        {note.category ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: note.category.color }}
              aria-hidden
            />
            <span className="uppercase tracking-mono">{note.category.name}</span>
          </span>
        ) : null}
        <span aria-hidden>·</span>
        <time dateTime={note.createdAt}>{formatTime(new Date(note.createdAt))}</time>
        <button
          type="button"
          onClick={onDelete}
          aria-label="excluir nota"
          className="ml-auto opacity-0 group-hover:opacity-100 focus:opacity-100 text-ink-3 hover:text-danger transition-opacity"
        >
          excluir
        </button>
      </div>
    </article>
  );
}
