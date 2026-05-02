import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthBootstrap, RequireAuth, RequireGuest } from '@/components/auth/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { LoginPage } from '@/routes/auth/login';
import { RegisterPage } from '@/routes/auth/register';
import { ChatPage } from '@/routes/chat/index';
import { InboxPage } from '@/routes/inbox';
import { NoteDetailPage } from '@/routes/notes/detail';
import { ProfilePage } from '@/routes/profile';
import { TasksPage } from '@/routes/tasks';

// importa store pra ativar o configureApi side-effect
import '@/stores/auth';
import '@/stores/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>
          <Routes>
            <Route element={<RequireGuest />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<InboxPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/notes/:id" element={<NoteDetailPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:threadId" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthBootstrap>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
