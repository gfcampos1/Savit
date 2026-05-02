import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ThreadList } from '@/components/chat/ThreadList';
import { Conversation } from '@/components/chat/Conversation';
import { useThreads, useCreateThread } from '@/hooks/useChat';

/**
 * Layout responsive:
 * - Mobile (`<md`): drilldown — `/chat` mostra lista; `/chat/:id` mostra só
 *   conversa (com botão "voltar" no header da Conversation).
 * - Desktop (`≥md`): split fixo (lista 18rem + conversa 1fr).
 *
 * Em mobile NÃO auto-navegamos pra primeira thread — a lista E a entrada
 * "+ nova" dão a porta de entrada.
 */
export function ChatPage() {
  const params = useParams();
  const threadId = params.threadId;
  const navigate = useNavigate();
  const threads = useThreads();
  const create = useCreateThread();

  // Em desktop sem thread aberta + há threads → abre a primeira (UX de split).
  // Em mobile, deixa o usuário ver a lista.
  useEffect(() => {
    if (threadId) return;
    if (threads.isLoading) return;
    if (typeof window === 'undefined') return;
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (!isDesktop) return;
    const first = threads.data?.[0];
    if (first) {
      navigate(`/chat/${first.id}`, { replace: true });
    } else if (!create.isPending) {
      void create.mutateAsync({}).then((t) => navigate(`/chat/${t.id}`, { replace: true }));
    }
  }, [threadId, threads.isLoading, threads.data, create, navigate]);

  return (
    <div
      className="md:grid md:grid-cols-[18rem_1fr] md:border-b md:hairline"
      style={{ height: 'calc(100vh - 57px)' }}
    >
      {/* Mobile: lista esconde quando há threadId aberta */}
      <div className={`${threadId ? 'hidden md:block' : 'block'} h-full`}>
        <ThreadList />
      </div>
      {/* Mobile: conversa esconde quando NÃO há threadId */}
      <div className={`${threadId ? 'block' : 'hidden md:block'} overflow-hidden h-full`}>
        {threadId ? <Conversation threadId={threadId} /> : null}
      </div>
    </div>
  );
}
