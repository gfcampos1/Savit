import { Link, useParams } from 'react-router-dom';
import { useThreads, useDeleteThread, useCreateThread } from '@/hooks/useChat';
import { useNavigate } from 'react-router-dom';
import { dayHeading, formatTime } from '@/lib/format-date';
import { confirm } from '@/stores/confirm';

export function ThreadList() {
  const params = useParams();
  const activeId = params.threadId;
  const threads = useThreads();
  const create = useCreateThread();
  const del = useDeleteThread();
  const navigate = useNavigate();

  async function onNew() {
    const t = await create.mutateAsync({});
    navigate(`/chat/${t.id}`);
  }

  return (
    <aside className="w-full md:border-r md:hairline bg-bg flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 border-b hairline">
        <span className="font-mono text-[11px] uppercase tracking-mono text-ink-3">conversas</span>
        <button
          type="button"
          onClick={() => void onNew()}
          disabled={create.isPending}
          className="text-xs text-accent hover:underline underline-offset-2"
        >
          + nova
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {threads.isLoading ? (
          <p className="text-xs text-ink-3 text-center py-6">carregando…</p>
        ) : threads.data?.length === 0 ? (
          <p className="text-xs text-ink-3 text-center py-6 px-4">
            sem conversas. clique em <span className="text-accent">+ nova</span>.
          </p>
        ) : (
          <ul>
            {threads.data?.map((t) => (
              <li
                key={t.id}
                className={`group flex items-center gap-2 px-4 py-2 border-b hairline hover:bg-surface-2/40 ${
                  activeId === t.id ? 'bg-surface' : ''
                }`}
              >
                <Link to={`/chat/${t.id}`} className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{t.title ?? 'Sem título'}</p>
                  <p className="text-[10px] font-mono uppercase tracking-mono text-ink-3 mt-0.5">
                    {dayHeading(t.updatedAt)} · {formatTime(new Date(t.updatedAt))} · {t.messageCount} msgs
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Excluir esta conversa?',
                      body: 'Todo o histórico será removido.',
                      confirmLabel: 'Excluir',
                      tone: 'danger',
                    });
                    if (!ok) return;
                    del.mutate(t.id);
                    if (activeId === t.id) navigate('/chat');
                  }}
                  aria-label="excluir conversa"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-ink-3 hover:text-danger transition-opacity text-xs"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
