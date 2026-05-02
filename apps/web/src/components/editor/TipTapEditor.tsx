import { useEffect, useMemo, useRef } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Typography from '@tiptap/extension-typography';
import { uploadAttachment } from '@/lib/upload';

export interface TipTapDoc {
  json: unknown; // ProseMirror JSON
  text: string; // texto plano (pra busca/preview)
}

interface TipTapEditorProps {
  initialJson?: unknown | null;
  initialText?: string | null;
  /** chamado a cada mudança (pra auto-save debounced fora). */
  onChange: (doc: TipTapDoc) => void;
  /** Necessário pra associar uploads ao note.id. Se ausente, anexos ficam órfãos
   *  até o complete subsequente — aceitável só pra criação rápida. */
  noteId?: string;
  placeholder?: string;
}

export function TipTapEditor({
  initialJson,
  initialText,
  onChange,
  noteId,
  placeholder = 'comece a escrever…',
}: TipTapEditorProps) {
  const lastSerialized = useRef<string>('');
  const editorRef = useRef<Editor | null>(null);
  const noteIdRef = useRef<string | undefined>(noteId);
  noteIdRef.current = noteId;

  const initialContent = useMemo<unknown>(() => {
    if (initialJson && typeof initialJson === 'object') return initialJson;
    if (initialText) return textToDoc(initialText);
    return undefined;
  }, [initialJson, initialText]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Image.configure({ inline: false, allowBase64: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
    ],
    content: (initialContent ?? '') as never,
    autofocus: false,
    editorProps: {
      attributes: {
        class:
          'tiptap min-h-[40vh] focus:outline-none text-ink text-base leading-relaxed display-serif',
      },
      handlePaste: (_view, event) =>
        handleImageInsert(editorRef.current, eventToImage(event), noteIdRef.current, event),
      handleDrop: (_view, event) =>
        handleImageInsert(
          editorRef.current,
          (event as DragEvent).dataTransfer
            ? Array.from((event as DragEvent).dataTransfer!.files).find((f) =>
                f.type.startsWith('image/'),
              ) ?? null
            : null,
          noteIdRef.current,
          event,
        ),
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();
      const serialized = JSON.stringify(json);
      if (serialized === lastSerialized.current) return;
      lastSerialized.current = serialized;
      onChange({ json, text });
    },
  });

  editorRef.current = editor ?? null;

  useEffect(() => () => editor?.destroy(), [editor]);

  if (!editor) return null;

  return (
    <div className="prose-savit">
      <Toolbar editor={editor} noteId={noteId} />
      <EditorContent editor={editor} />
    </div>
  );
}

// ---------- Toolbar ----------

function Toolbar({ editor, noteId }: { editor: Editor; noteId?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const { url } = await uploadAttachment({ blob: file, kind: 'PHOTO', noteId });
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      console.error('upload falhou', err);
      alert('Não foi possível enviar a imagem.');
    }
  }

  return (
    <div className="flex items-center gap-1 mb-3 pb-2 border-b hairline">
      <ToolBtn
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="Negrito"
      >
        <span className="font-bold">B</span>
      </ToolBtn>
      <ToolBtn
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="Itálico"
      >
        <span className="italic">I</span>
      </ToolBtn>
      <ToolBtn
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        label="Riscado"
      >
        <span className="line-through">S</span>
      </ToolBtn>
      <Sep />
      <ToolBtn
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        label="Título"
      >
        H
      </ToolBtn>
      <ToolBtn
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="Lista"
      >
        •
      </ToolBtn>
      <ToolBtn
        active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        label="Tarefas"
      >
        ☐
      </ToolBtn>
      <ToolBtn
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        label="Citação"
      >
        ❝
      </ToolBtn>
      <Sep />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="px-2 py-1 rounded text-sm text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
      >
        + imagem
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onPickImage}
        className="hidden"
      />
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`grid place-items-center h-8 w-8 rounded text-sm transition-colors ${
        active ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:text-ink hover:bg-surface-2'
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-hair" />;
}

// ---------- Helpers ----------

function textToDoc(text: string): unknown {
  return {
    type: 'doc',
    content: text
      .split(/\n\n+/)
      .filter(Boolean)
      .map((para) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: para }],
      })),
  };
}

// upload por paste/drag-drop (imagens)
function eventToImage(event: ClipboardEvent | Event): File | null {
  const ce = event as ClipboardEvent;
  if (!ce.clipboardData) return null;
  const item = Array.from(ce.clipboardData.items).find((i) => i.type.startsWith('image/'));
  return item?.getAsFile() ?? null;
}

function handleImageInsert(
  editor: Editor | null,
  file: File | null,
  noteId: string | undefined,
  domEvent: Event,
): boolean {
  if (!editor || !file) return false;
  domEvent.preventDefault();
  void uploadAttachment({ blob: file, kind: 'PHOTO', noteId })
    .then(({ url }) => editor.chain().focus().setImage({ src: url }).run())
    .catch((err) => console.error('upload inline falhou', err));
  return true;
}
