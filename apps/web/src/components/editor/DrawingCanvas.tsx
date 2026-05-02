// Wrapper do tldraw com auto-save de snapshot via callback debounced.
// Snapshot é serializado pra contentJson da Note. Sem export de PNG por
// enquanto — o próprio tldraw renderiza o thumbnail no detalhe.

import { useCallback, useEffect, useRef } from 'react';
import { Tldraw, type Editor as TldrawEditor, type StoreSnapshot, type TLRecord } from 'tldraw';
import 'tldraw/tldraw.css';

interface DrawingCanvasProps {
  initialSnapshot?: unknown | null;
  onChange: (snapshot: StoreSnapshot<TLRecord>) => void;
  /** ms entre auto-saves */
  saveDebounceMs?: number;
}

export function DrawingCanvas({
  initialSnapshot,
  onChange,
  saveDebounceMs = 1000,
}: DrawingCanvasProps) {
  const editorRef = useRef<TldrawEditor | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerialized = useRef<string>('');

  const handleMount = useCallback(
    (editor: TldrawEditor) => {
      editorRef.current = editor;

      // Carrega snapshot inicial (se existir)
      if (initialSnapshot && typeof initialSnapshot === 'object') {
        try {
          editor.store.loadStoreSnapshot(initialSnapshot as StoreSnapshot<TLRecord>);
        } catch (err) {
          console.error('tldraw: falha ao carregar snapshot inicial', err);
        }
      }

      // Auto-save debounced em qualquer mudança no store
      const dispose = editor.store.listen(
        () => {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            const snap = editor.store.getStoreSnapshot();
            const serialized = JSON.stringify(snap);
            if (serialized === lastSerialized.current) return;
            lastSerialized.current = serialized;
            onChange(snap);
          }, saveDebounceMs);
        },
        { source: 'user', scope: 'document' },
      );

      return () => {
        dispose();
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    },
    [initialSnapshot, onChange, saveDebounceMs],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div className="rounded-md border hairline overflow-hidden" style={{ height: '70vh' }}>
      <Tldraw onMount={handleMount} />
    </div>
  );
}
