// Nó "pensamento" do mind map. Texto editável inline, handles top/bottom/left/right
// pra conectar livre, swatch da categoria opcional. Tab cria nó filho à direita,
// Enter (sem shift) sai do edit-mode.

import { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface ThoughtNodeData extends Record<string, unknown> {
  text: string;
  color?: string | null;
  /** Marcado pelo MindMap quando o usuário acabou de criar e quer entrar em edit. */
  autoEdit?: boolean;
}

function ThoughtNodeImpl({ id, data, selected }: NodeProps) {
  const d = data as ThoughtNodeData;
  const [editing, setEditing] = useState(Boolean(d.autoEdit));
  const [text, setText] = useState(d.text ?? '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // sincroniza props externas → estado local quando node é re-renderizado externamente
  useEffect(() => {
    setText(d.text ?? '');
  }, [d.text]);

  function commit() {
    setEditing(false);
    // o MindMap escuta updates via window event (simples) — mas como o nó vive
    // dentro de useNodesState do MindMap, melhor expor via custom DOM event.
    const evt = new CustomEvent('thought:edit', { detail: { id, text } });
    window.dispatchEvent(evt);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setText(d.text ?? '');
      setEditing(false);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commit();
      window.dispatchEvent(new CustomEvent('thought:add-child', { detail: { id } }));
    }
  }

  const color = d.color ?? 'var(--ink-3)';

  return (
    <div
      onDoubleClick={() => setEditing(true)}
      className={`group rounded-md bg-surface border ${
        selected ? 'border-accent ring-2 ring-accent/30' : 'border-hair'
      } px-3 py-2 shadow-card min-w-[140px] max-w-[260px]`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <Handle type="target" position={Position.Left} className="!bg-ink-3 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-ink-3 !w-2 !h-2" />
      <Handle type="target" position={Position.Top} className="!bg-ink-3 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-ink-3 !w-2 !h-2" />

      {editing ? (
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          rows={1}
          className="w-full bg-transparent resize-none outline-none text-sm text-ink leading-snug"
        />
      ) : (
        <p className="text-sm text-ink leading-snug whitespace-pre-wrap break-words">
          {text || <span className="text-ink-3 italic">duplo-clique pra editar</span>}
        </p>
      )}
    </div>
  );
}

export const ThoughtNode = memo(ThoughtNodeImpl);
