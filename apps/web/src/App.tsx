import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import {
  AuthBootstrap,
  RequireAdmin,
  RequireAuth,
  RequireGuest,
} from '@/components/auth/AuthGuard';
import { AppShell } from '@/components/AppShell';
import { CommandPalette } from '@/components/CommandPalette';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PaywallModal } from '@/components/PaywallModal';
import { PWAStatus } from '@/components/PWAStatus';
import { Toaster } from '@/components/Toaster';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';

// Eager: caminho crítico (auth + telas mais visitadas).
import { LoginPage } from '@/routes/auth/login';
import { RegisterPage } from '@/routes/auth/register';
import { InboxPage } from '@/routes/inbox';
import { TasksPage } from '@/routes/tasks';

// Lazy: telas pesadas (TipTap, tldraw, charts, billing) ou pouco visitadas.
// Reduz o bundle inicial e acelera o FCP.
const NoteDetailPage = lazy(() =>
  import('@/routes/notes/detail').then((m) => ({ default: m.NoteDetailPage })),
);
const CategoriesPage = lazy(() =>
  import('@/routes/categories').then((m) => ({ default: m.CategoriesPage })),
);
const ChatPage = lazy(() => import('@/routes/chat/index').then((m) => ({ default: m.ChatPage })));
const DashboardPage = lazy(() =>
  import('@/routes/dashboard').then((m) => ({ default: m.DashboardPage })),
);
const FocusPage = lazy(() => import('@/routes/focus').then((m) => ({ default: m.FocusPage })));
const BillingPage = lazy(() =>
  import('@/routes/billing').then((m) => ({ default: m.BillingPage })),
);
const ProfilePage = lazy(() =>
  import('@/routes/profile').then((m) => ({ default: m.ProfilePage })),
);
const AdminPage = lazy(() =>
  import('@/routes/admin/index').then((m) => ({ default: m.AdminPage })),
);

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

function RouteFallback() {
  return (
    <div className="min-h-svh grid place-items-center bg-bg text-ink-3">
      <p className="label-mono">carregando…</p>
    </div>
  );
}

function AppInner({ children }: { children: React.ReactNode }) {
  // Atalhos globais precisam de useNavigate (CommandPalette usa) → tem que
  // estar dentro do BrowserRouter.
  useGlobalShortcuts();
  return (
    <>
      <CommandPalette />
      <PaywallModal />
      <ConfirmDialog />
      <Toaster />
      {children}
    </>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PWAStatus />
        <AppInner>
        <AuthBootstrap>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<RequireGuest />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<InboxPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/notes/:id" element={<NoteDetailPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/chat/:threadId" element={<ChatPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route element={<RequireAdmin />}>
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>
                </Route>
                {/* /focus é tela cheia — fora do AppShell */}
                <Route path="/focus" element={<FocusPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthBootstrap>
        </AppInner>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
