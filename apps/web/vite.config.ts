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
        registerType: 'prompt', // mostra toast "Atualizar" quando há nova versão
        includeAssets: ['icons/favicon.svg'],
        injectRegister: false, // registramos manualmente em main.tsx pra controlar update prompt
        devOptions: {
          enabled: false, // SW só em prod (em dev usaríamos perdíamos hot-reload)
        },
        workbox: {
          // gerar pre-cache de TODOS os assets buildados (HTML, CSS, JS, fontes locais)
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          // navegate fallback pra SPA: se a rota não existir no cache, devolve index.html
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          // não interceptar uploads PUT (R2 / local) — passa direto pra rede
          runtimeCaching: [
            {
              // API: NetworkFirst com fallback ao cache em offline
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'savit-api',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
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
              src: '/icons/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: '/icons/icon-maskable.svg',
              sizes: 'any',
              type: 'image/svg+xml',
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
              icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
            },
            {
              name: 'Tarefas',
              short_name: 'Tarefas',
              url: '/tasks',
              icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
            },
            {
              name: 'Chat IA',
              short_name: 'Chat',
              url: '/chat',
              icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
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
