import { useEffect, useRef, useState } from 'react';
import type { Category } from '@savit/shared';

interface CategoryPickerProps {
  categories: Category[];
  value: string | null;
  onChange: (id: string | null) => void;
  /** Categoria detectada pelo parser (#hashtag) — mostrada quando nada foi fixado. */
  autoCategoryName?: string | null;
}

// Altura aproximada do dropdown (8+1 itens × ~32px + paddings). Usada pra
// decidir abrir pra cima/baixo conforme o espaço disponível na viewport.
const DROPDOWN_APPROX_H = 280;

export function CategoryPicker({
  categories,
  value,
  onChange,
  autoCategoryName,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = value ? categories.find((c) => c.id === value) : null;

  function toggle() {
    if (!open && buttonRef.current) {
      // Abre pra baixo se houver espaço; senão pra cima. Composer (rodapé)
      // tem ~0px abaixo → abre pra cima. Nota detalhe (topo) tem viewport
      // inteira abaixo → abre pra baixo. Evita clipping atrás do AppShell.
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < DROPDOWN_APPROX_H && spaceAbove > spaceBelow);
    }
    setOpen((v) => !v);
  }

  // Fecha ao clicar fora (substitui o onMouseLeave que era ruim em mobile).
  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: Event) {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        buttonRef.current?.contains(target) === false &&
        menuRef.current?.contains(target) === false
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocPointer);
    document.addEventListener('touchstart', onDocPointer);
    return () => {
      document.removeEventListener('mousedown', onDocPointer);
      document.removeEventListener('touchstart', onDocPointer);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-2 rounded-pill border hairline px-2.5 py-1 text-xs text-ink-2 hover:text-ink transition-colors"
      >
        {selected ? (
          <>
            <span className="h-2 w-2 rounded-sm" style={{ background: selected.color }} aria-hidden />
            <span>{selected.name}</span>
          </>
        ) : autoCategoryName ? (
          <>
            <span className="font-mono text-[10px] uppercase tracking-mono text-ink-3">via #</span>
            <span>{autoCategoryName}</span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-sm border hairline" aria-hidden />
            <span>sem categoria</span>
          </>
        )}
        <span className="text-ink-3">▾</span>
      </button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          // z-40 fica acima do AppShell (z-30) sem competir com modais (z-50).
          // Abre pra cima/baixo conforme posição na viewport.
          className={`absolute ${
            openUp ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-0 w-56 max-h-[60vh] overflow-y-auto rounded-md border hairline bg-surface shadow-card p-1 z-40`}
        >
          <button
            role="menuitem"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="w-full text-left px-2 py-1.5 text-sm text-ink-2 rounded hover:bg-surface-2"
          >
            sem categoria
          </button>
          {categories.map((c) => (
            <button
              role="menuitem"
              key={c.id}
              onClick={() => {
                onChange(c.id);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 text-sm text-ink rounded hover:bg-surface-2 flex items-center gap-2"
            >
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} aria-hidden />
              {c.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
