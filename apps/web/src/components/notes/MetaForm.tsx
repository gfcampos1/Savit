// Formulários extras por categoria fixa.
// - 'books'   → BookMeta   (nome, capítulo, páginas de:até:)
// - 'youtube' → YoutubeMeta (canal, visto em, link)
// O detalhe da nota detecta o slug e renderiza o form correto. Persistência é
// debounced via PATCH /api/notes/:id { metadata }.

import { useEffect, useState } from 'react';
import type { BookMeta, YoutubeMeta } from '@savit/shared';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

type MetaFormProps = {
  slug: string;
  value: unknown | null;
  onChange: (next: unknown | null) => void;
};

export function MetaForm({ slug, value, onChange }: MetaFormProps) {
  if (slug === 'books') {
    return <BookForm value={(value as Partial<BookMeta>) ?? null} onChange={onChange} />;
  }
  if (slug === 'youtube') {
    return <YoutubeForm value={(value as Partial<YoutubeMeta>) ?? null} onChange={onChange} />;
  }
  return null;
}

// ---------------- Books ----------------

function BookForm({
  value,
  onChange,
}: {
  value: Partial<BookMeta> | null;
  onChange: (next: BookMeta | null) => void;
}) {
  const [bookName, setBookName] = useState(value?.bookName ?? '');
  const [chapter, setChapter] = useState(value?.chapter ?? '');
  const [pageFrom, setPageFrom] = useState<string>(
    value?.pageFrom != null ? String(value.pageFrom) : '',
  );
  const [pageTo, setPageTo] = useState<string>(
    value?.pageTo != null ? String(value.pageTo) : '',
  );

  // sincroniza estado local com value externo (ex: quando trocamos de nota)
  useEffect(() => {
    setBookName(value?.bookName ?? '');
    setChapter(value?.chapter ?? '');
    setPageFrom(value?.pageFrom != null ? String(value.pageFrom) : '');
    setPageTo(value?.pageTo != null ? String(value.pageTo) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.bookName, value?.chapter, value?.pageFrom, value?.pageTo]);

  const debounced = useDebouncedCallback((next: BookMeta | null) => onChange(next), 600);

  function emit(partial: { bookName?: string; chapter?: string; pageFrom?: string; pageTo?: string }) {
    const name = (partial.bookName ?? bookName).trim();
    const cap = (partial.chapter ?? chapter).trim();
    const from = partial.pageFrom ?? pageFrom;
    const to = partial.pageTo ?? pageTo;
    if (!name) {
      // sem livro = sem metadata (limpa)
      debounced(null);
      return;
    }
    const fromNum = from ? Number(from) : undefined;
    const toNum = to ? Number(to) : undefined;
    if ((fromNum != null && Number.isNaN(fromNum)) || (toNum != null && Number.isNaN(toNum))) return;
    if (fromNum != null && toNum != null && toNum < fromNum) return; // valida client-side antes de PATCH
    debounced({
      bookName: name,
      chapter: cap || undefined,
      pageFrom: fromNum,
      pageTo: toNum,
    });
  }

  return (
    <section className="mb-6 rounded-md border hairline bg-surface p-4">
      <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3 mb-3">livro</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="nome do livro">
          <input
            type="text"
            value={bookName}
            onChange={(e) => {
              setBookName(e.target.value);
              emit({ bookName: e.target.value });
            }}
            maxLength={200}
            className="w-full bg-transparent border-b hairline text-ink text-sm py-1.5 outline-none focus:border-accent transition-colors"
          />
        </Field>
        <Field label="capítulo">
          <input
            type="text"
            value={chapter}
            onChange={(e) => {
              setChapter(e.target.value);
              emit({ chapter: e.target.value });
            }}
            maxLength={100}
            className="w-full bg-transparent border-b hairline text-ink text-sm py-1.5 outline-none focus:border-accent transition-colors"
          />
        </Field>
        <Field label="página de">
          <input
            type="number"
            min={1}
            value={pageFrom}
            onChange={(e) => {
              setPageFrom(e.target.value);
              emit({ pageFrom: e.target.value });
            }}
            className="w-full bg-transparent border-b hairline text-ink text-sm py-1.5 outline-none focus:border-accent transition-colors"
          />
        </Field>
        <Field label="página até">
          <input
            type="number"
            min={1}
            value={pageTo}
            onChange={(e) => {
              setPageTo(e.target.value);
              emit({ pageTo: e.target.value });
            }}
            className="w-full bg-transparent border-b hairline text-ink text-sm py-1.5 outline-none focus:border-accent transition-colors"
          />
        </Field>
      </div>
    </section>
  );
}

// ---------------- YouTube ----------------

function YoutubeForm({
  value,
  onChange,
}: {
  value: Partial<YoutubeMeta> | null;
  onChange: (next: YoutubeMeta | null) => void;
}) {
  const [channel, setChannel] = useState(value?.channel ?? '');
  const [link, setLink] = useState(value?.link ?? '');
  const [watchedAt, setWatchedAt] = useState(toLocalInput(value?.watchedAt));

  useEffect(() => {
    setChannel(value?.channel ?? '');
    setLink(value?.link ?? '');
    setWatchedAt(toLocalInput(value?.watchedAt));
  }, [value?.channel, value?.link, value?.watchedAt]);

  const debounced = useDebouncedCallback((next: YoutubeMeta | null) => onChange(next), 600);

  function emit(partial: { channel?: string; link?: string; watchedAt?: string }) {
    const ch = (partial.channel ?? channel).trim();
    const ln = (partial.link ?? link).trim();
    const wa = partial.watchedAt ?? watchedAt;
    if (!ch || !ln) {
      // sem canal+link = sem metadata
      debounced(null);
      return;
    }
    if (!isValidUrl(ln)) return; // espera digitação completar
    debounced({
      channel: ch,
      link: ln,
      watchedAt: wa ? new Date(wa).toISOString() : undefined,
    });
  }

  return (
    <section className="mb-6 rounded-md border hairline bg-surface p-4">
      <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3 mb-3">youtube</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="canal">
          <input
            type="text"
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value);
              emit({ channel: e.target.value });
            }}
            maxLength={120}
            className="w-full bg-transparent border-b hairline text-ink text-sm py-1.5 outline-none focus:border-accent transition-colors"
          />
        </Field>
        <Field label="visto em">
          <input
            type="datetime-local"
            value={watchedAt}
            onChange={(e) => {
              setWatchedAt(e.target.value);
              emit({ watchedAt: e.target.value });
            }}
            className="w-full bg-transparent border-b hairline text-ink text-sm py-1.5 outline-none focus:border-accent transition-colors"
          />
        </Field>
        <Field label="link" full>
          <input
            type="url"
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              emit({ link: e.target.value });
            }}
            placeholder="https://youtube.com/..."
            className="w-full bg-transparent border-b hairline text-ink text-sm py-1.5 outline-none focus:border-accent transition-colors"
          />
        </Field>
      </div>
    </section>
  );
}

// ---------------- shared bits ----------------

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? 'md:col-span-2' : ''}`}>
      <span className="font-mono text-[10px] uppercase tracking-mono text-ink-3 block mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function isValidUrl(v: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

function toLocalInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // datetime-local quer 'YYYY-MM-DDTHH:mm' no fuso local
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
