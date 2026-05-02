import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ThreadList } from '@/components/chat/ThreadList';
import { Conversation } from '@/components/chat/Conversation';
import { useThreads, useCreateThread } from '@/hooks/useChat';

export function ChatPage() {
  const params = useParams();
  const threadId = params.threadId;
  const navigate = useNavigate();
  const threads = useThreads();
  const create = useCreateThread();

  // Sem thread aberta E há threads → abre a primeira; sem threads → cria uma.
  useEffect(() => {
    if (threadId) return;
    if (threads.isLoading) return;
    const first = threads.data?.[0];
    if (first) {
      navigate(`/chat/${first.id}`, { replace: true });
    } else if (!create.isPending) {
      void create.mutateAsync({}).then((t) => navigate(`/chat/${t.id}`, { replace: true }));
    }
  }, [threadId, threads.isLoading, threads.data, create, navigate]);

  return (
    <div
      className="grid border-b hairline"
      style={{ gridTemplateColumns: 'auto 1fr', height: 'calc(100vh - 57px)' }}
    >
      <ThreadList />
      <div className="overflow-hidden">
        {threadId ? <Conversation threadId={threadId} /> : null}
      </div>
    </div>
  );
}
