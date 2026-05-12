import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:3001';

  return {
    plugins: [
      react(),
      VitePWA({
        // prompt: o SW novo fica em "waiting" até o usuário aceitar atualizar
        // (toast em onPWAState → updateNow). Evita reload-surpresa que zerava
        // o access token em memória e empurrava o user pra tela de login no
        // meio de uma sessão.
        registerType: 'prompt',
        includeAssets: ['icons/logo-light.png', 'icons/logo-dark.png', 'icons/logo-accent.png'],
        injectRegister: false, // registramos manualmente em main.tsx
        devOptions: {
          enabled: false, // SW só em prod (em dev usaríamos perdíamos hot-reload)
        },
        workbox: {
          // gerar pre-cache de TODOS os assets buildados (HTML, CSS, JS, fontes locais)
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          // navegate fallback pra SPA: se a rota não existir no cache, devolve index.html
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          // SW novo assume controle dos clientes abertos imediatamente ao ativar.
          // Sem isso, abas antigas continuariam servindo o SW antigo até reload.
          clientsClaim: true,
          skipWaiting: true,
          // Limpa precaches de versões anteriores.
          cleanupOutdatedCaches: true,
          // /api/* fica de fora do SW de propósito: NetworkFirst antes cacheava
          // 401 do /api/auth/refresh e quebrava o login do PWA (timeout de 5s
          // servia resposta stale). React Query gerencia cache em memória.
          // Uploads PUT (R2/local) também passam direto pela rede.
          runtimeCaching: [
            {
              // Google Fonts CSS
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-css' },
            },
            {
              // Google Fonts arquivos woff2
              urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-files',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
        manifest: {
          name: 'Savit · suas ideias, sempre à mão',
          short_name: 'Savit',
          description: 'Notas, tarefas e mapa mental com IA. PT-BR.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#f6f1e8',
          background_color: '#f6f1e8',
          lang: 'pt-BR',
          dir: 'ltr',
          icons: [
            {
              src: '/icons/logo-light.png',
              sizes: '192x192 512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/logo-dark.png',
              sizes: '192x192 512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          // Permite "compartilhar pra Savit" do navegador/outros apps no Android
          share_target: {
            action: '/',
            method: 'GET',
            params: { title: 'title', text: 'text', url: 'url' },
          },
          // Atalhos no long-press do ícone (Android)
          shortcuts: [
            {
              name: 'Inbox',
              short_name: 'Inbox',
              url: '/',
              icons: [{ src: '/icons/logo-light.png', sizes: '192x192 512x512', type: 'image/png' }],
            },
            {
              name: 'Tarefas',
              short_name: 'Tarefas',
              url: '/tasks',
              icons: [{ src: '/icons/logo-light.png', sizes: '192x192 512x512', type: 'image/png' }],
            },
            {
              name: 'Chat IA',
              short_name: 'Chat',
              url: '/chat',
              icons: [{ src: '/icons/logo-light.png', sizes: '192x192 512x512', type: 'image/png' }],
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    envDir: path.resolve(__dirname, '../..'),
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      target: 'es2022',
    },
  };
});
