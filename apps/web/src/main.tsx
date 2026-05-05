import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { App } from './App.tsx';
import { registerSW } from './lib/pwa';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

// Recovery contra chunk hash mismatch após deploy: se o browser cachear
// um index.html antigo apontando pra chunks que sumiram, o React.lazy()
// falha silenciosamente. Recarrega 1x — o reload pega o index.html novo
// com os hashes corretos. Flag em sessionStorage evita loop.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('savit_chunk_reload') !== 'done') {
    sessionStorage.setItem('savit_chunk_reload', 'done');
    window.location.reload();
  }
});

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void registerSW();
