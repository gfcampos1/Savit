import { useEffect, useMemo, useRef } from 'react';

/**
 * Devolve uma versão estável da callback que só dispara após `delayMs` sem
 * novas invocações. `flush()` força execução imediata da última pendente.
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number,
) {
  const fnRef = useRef(fn);
  const argsRef = useRef<TArgs | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return useMemo(() => {
    const debounced = (...args: TArgs) => {
      argsRef.current = args;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (argsRef.current) fnRef.current(...argsRef.current);
        argsRef.current = null;
      }, delayMs);
    };
    debounced.flush = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (argsRef.current) fnRef.current(...argsRef.current);
      argsRef.current = null;
    };
    debounced.cancel = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      argsRef.current = null;
    };
    return debounced;
  }, [delayMs]);
}
