import { useAuthStore } from '@/stores/auth';

export function InboxPage() {
  const user = useAuthStore((s) => s.user);
  return (
    <section className="max-w-2xl mx-auto px-6 py-10">
      <p className="label-mono">F1 · INBOX (placeholder)</p>
      <h1 className="display-serif text-display mt-2">Olá, {user?.name?.split(' ')[0] ?? 'você'}.</h1>
      <p className="text-ink-2 text-md mt-3 max-w-prose">
        Esta tela vira o feed de verdade na F2 — captura rápida, parser de linguagem natural,
        cards de nota e tarefa.
      </p>
    </section>
  );
}
