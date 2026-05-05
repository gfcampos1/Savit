import { lazy, Suspense, useEffect } from 'react';
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
// Reduz o bundle inicial e acelera o FCP. Chunks são pré-carregados em
// idle (ver useEffect abaixo) — subsequentes navs ficam instantâneas.
const importNoteDetail = () => import('@/routes/notes/detail');
const importCategories = () => import('@/routes/categories');
const importChat = () => import('@/routes/chat/index');
const importDashboard = () => import('@/routes/dashboard');
const importFocus = () => import('@/routes/focus');
const importBilling = () => import('@/routes/billing');
const importProfile = () => import('@/routes/profile');
const importAdmin = () => import('@/routes/admin/index');

const NoteDetailPage = lazy(() => importNoteDetail().then((m) => ({ default: m.NoteDetailPage })));
const CategoriesPage = lazy(() => importCategories().then((m) => ({ default: m.CategoriesPage })));
const ChatPage = lazy(() => importChat().then((m) => ({ default: m.ChatPage })));
const DashboardPage = lazy(() => importDashboard().then((m) => ({ default: m.DashboardPage })));
const FocusPage = lazy(() => importFocus().then((m) => ({ default: m.FocusPage })));
const BillingPage = lazy(() => importBilling().then((m) => ({ default: m.BillingPage })));
const ProfilePage = lazy(() => importProfile().then((m) => ({ default: m.ProfilePage })));
const AdminPage = lazy(() => importAdmin().then((m) => ({ default: m.AdminPage })));

// importa store pra ativar o configureApi side-effect
import '@/stores/auth';
import '@/stores/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // 5 min — dados ficam fresh entre navegações de rota. Sem isso cada
      // mount remontava queries e disparava round-trip pro Railway (cold
      // start ~3-8s no plano Hobby) → navegação ficava lenta perceptível.
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
    },
  },
});

/**
 * Pré-carrega chunks lazy depois que o app está interativo. Chunks ficam no
 * cache de módulos do Vite e o React.lazy resolve instantâneo na navegação.
 * Roda em requestIdleCallback pra não competir com renderização inicial.
 */
function useChunkPrefetch() {
  useEffect(() => {
    const ric =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? window.requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 1500);
    const handle = ric(() => {
      void importNoteDetail();
      void importCategories();
      void importChat();
      void importDashboard();
      void importProfile();
      // billing/focus/admin ficam pra quando o user navegar — pouco frequentes
    });
    return () => {
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(handle as number);
      } else {
        clearTimeout(handle as unknown as number);
      }
    };
  }, []);
}

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
  useChunkPrefetch();
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
