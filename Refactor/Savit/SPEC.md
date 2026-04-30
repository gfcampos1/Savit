# Savit · Redesign Spec & Implementation Prompt

> **Cole isto no Claude Code, no diretório do repo Savit, como mensagem inicial.**
> A spec é completa: design system, telas, novas funcionalidades de UX e fixes de bugs. Implemente em fases (S0 → S5). Pergunte antes de cada fase.

---

## CONTEXTO DO PROJETO

Você está trabalhando no **Savit** — um PWA mobile-first para capturar ideias, tarefas e pensamentos como "mensagens para você mesmo", organizados por categorias coloridas. Stack atual: **Node.js + Express + Prisma + PostgreSQL** no backend; **HTML/CSS/JS vanilla + Service Worker** no frontend; auth JWT com refresh + MFA; rotas `/api/auth`, `/api/messages`, `/api/categories`, `/api/stats`.

**Estrutura existente** (preservar):
```
public/{index.html, css/styles.css, js/app.js, sw.js, manifest.json}
server/{index.js, routes/*, middleware/*, utils/*}
prisma/schema.prisma
```

O design atual é um clone visual do WhatsApp (verde #075E54, bolhas duras, hierarquia plana). O usuário relatou que o app está **"muito quadrado e com vários bugs de usabilidade"**. Esta spec resolve isso sem quebrar a API nem o schema.

---

## OBJETIVOS

1. **Substituir** completamente o design system pelo novo (3 temas selecionáveis).
2. **Adicionar 6 novas funcionalidades de UX** que tornam o app intuitivo.
3. **Corrigir bugs de usabilidade conhecidos** listados em §7.
4. **Manter** a API REST atual e o schema Prisma intactos. Adições no schema são permitidas (campos opcionais).
5. **Não quebrar** PWA, auth, MFA, exportação JSON.

---

## 1. DESIGN SYSTEM (token-first)

Crie `public/css/tokens.css` com **três temas** selecionáveis via `data-theme="paper|playful|linear"` no `<html>`. Persistir em `localStorage.savit_theme`. Default: `paper`.

### 1.1 Tipografia (todos os temas)

```
Geist (UI, 400/500/600/700)         — texto, botões, formulários
Instrument Serif (display, 400/400i)— numerais grandes, títulos editoriais, marcações
JetBrains Mono (técnico, 400/500)   — labels MAIÚSCULOS, IDs, timestamps, atalhos
```

Carregar via Google Fonts com `&display=swap`. Nunca use Inter, Roboto, Arial.

**Escala:**
```
--fs-xs: 11px   /* labels mono */
--fs-sm: 13px   /* metadata */
--fs-md: 14-15px/* body */
--fs-lg: 17px   /* card titles */
--fs-xl: 22-26px/* screen titles */
--fs-display: 36-44px /* moments */
```

Letter-spacing: `-0.02em` em displays, `0.12-0.18em` em mono labels MAIÚSCULAS.

### 1.2 Tema A — Paper (default, mobile-first, calmo)

```css
[data-theme="paper"] {
  --bg: #f6f1e8;          /* creme */
  --surface: #fdfaf3;     /* card */
  --ink: #1d1a14;         /* texto */
  --ink-2: #5b5448;       /* secundário */
  --ink-3: #8a8270;       /* terciário/mono */
  --hair: rgba(29,26,20,0.10);
  --accent: #c0563a;      /* terra/citrus */
  --accent-2: #e6b540;    /* amber */
  --success: #3a8a6a;
  --danger: #c0563a;
  --shadow-card: 0 1px 0 rgba(29,26,20,0.04), 0 12px 24px -16px rgba(29,26,20,0.18);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-pill: 999px;
}
```

**Personalidade:** anotação de caderno. Notas usam Instrument Serif 19px. Bordas tracejadas (`dashed`) entre notas. Tarefas viram cards com checkbox quadrado de 20px e cor da categoria.

### 1.3 Tema B — Playful (vibrante, dark roxo)

```css
[data-theme="playful"] {
  --bg: #0e0a1a;
  --surface: #181228;
  --surface-2: #221a36;
  --ink: #f5f0ff;
  --ink-2: #a89cc4;
  --ink-3: #6b5e8a;
  --hair: rgba(255,255,255,0.08);
  --accent: #ff6b9d;       /* pink */
  --accent-2: #7c5cff;     /* purple */
  --accent-3: #5cd6c0;     /* mint */
  --accent-4: #ffb84a;     /* amber */
  --grad-primary: linear-gradient(135deg, #7c5cff 0%, #ff6b9d 100%);
  --grad-secondary: linear-gradient(135deg, #5cd6c0 0%, #7c5cff 100%);
  --shadow-card: 0 8px 24px -6px rgba(255,107,157,0.25);
  --radius-md: 14px;
  --radius-lg: 22px;
}
```

**Personalidade:** glow blobs radiais no fundo, story-pills de categoria horizontais, "foco do dia" como featured card com gradiente e pílulas de tarefas embutidas. Cards de feed com barra colorida na esquerda (3px).

### 1.4 Tema C — Linear (denso, dark blue-gray, power-user)

```css
[data-theme="linear"] {
  --bg: #0a0c10;
  --surface: #0f1218;
  --surface-2: #161922;
  --surface-hi: #1c2030;
  --ink: #e6e8ec;
  --ink-2: #9097a6;
  --ink-3: #5a6172;
  --hair: rgba(255,255,255,0.06);
  --hair-hi: rgba(255,255,255,0.10);
  --accent: #7c8bf5;
  --accent-dim: #4d5db5;
  --success: #5cd49c;
  --warning: #f0b95c;
  --danger: #f06c7c;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
}
```

**Personalidade:** linhas, monoespaçado para IDs (SAV-128), linha selecionada com borda esquerda accent + bg `rgba(124,139,245,0.06)`, atalhos de teclado visíveis em badges (⌘K, ↑↓, ↵).

### 1.5 Cores das categorias (todos os temas)

```js
const CATEGORY_COLORS = [
  '#c0563a', '#e6b540', '#3a8a6a', '#7a5cc7', '#5b8cff',
  '#d96fa0', '#1d4ed8', '#ff8a5b', '#5cd6c0', '#ff6b9d',
  '#7c5cff', '#f0b95c'
];
```

A cor da categoria salva no banco já é renderizada no tema escolhido — não traduza.

### 1.6 Espaçamento, raios, sombras

- Base 4px. Padding interno de cards: 14–18px.
- Radii: usar tokens. **Nunca** raio < 8px em superfícies (exceto Linear, que usa 4–6px).
- Hit targets ≥ 44x44px em mobile. Botão de envio circular ≥ 40px.
- Shadows: usar `--shadow-card`. Em Linear: nada de shadow, só borders.

---

## 2. ARQUITETURA DO FRONTEND

O JS atual está num único `app.js`. Não precisa virar SPA framework, mas **modularize** em ESM:

```
public/js/
  api.js              # fetch wrapper + auth refresh (já existe)
  state.js            # store reativa simples (subscribe/notify)
  router.js           # hash router: #/inbox, #/today, #/tasks, #/dashboard, #/profile, #/category/:id
  components/
    composer.js       # smart capture (parse natural)
    feed.js           # render lista
    card.js           # nota / tarefa
    category-chip.js
    command-palette.js# ⌘K
    toast.js
    sheet.js          # bottom-sheet mobile
    drawer.js         # side-drawer
    modal.js
  pages/
    inbox.js
    today.js
    tasks.js
    dashboard.js
    profile.js
    auth.js
  utils/
    parse-natural.js  # "amanhã 9h #trabalho" → {date, time, categoryId}
    format-date.js
    keyboard.js       # registry de atalhos
```

Cada módulo exporta uma função `mount(rootEl, props) → unmount`. Sem JSX, sem build.

---

## 3. TELAS E COMPONENTES (especificação completa)

### 3.1 Header global (mobile)

```
[avatar 36] [olá, {nome} ✦ / título da página]    [busca 36] [···]
            [N ideias hoje / sub mono]
```

- Altura 56px, sticky.
- Em Paper: título em Instrument Serif 36px, sublabel mono 10px MAIÚSCULA.
- Em Playful: avatar com gradiente, título 15px medium.
- Em Linear: chip 26x26 com S, título 14px medium, ID/contador mono.

### 3.2 Inbox (feed principal) — `#/inbox`

**Estrutura:**
1. Header.
2. Filter row sticky (Tudo / Tarefas / Notas) com contadores mono.
3. Lista agrupada por **dia** (hoje, ontem, datas relativas em mono MAIÚSCULA + linha hairline).
4. Cards:
   - **Nota:** texto principal grande (Paper: serif 19px; Playful: 14–17px; Linear: 13px), metadata em linha (chip categoria + timestamp).
   - **Tarefa:** checkbox 20px (Paper/Playful) ou 14px (Linear) com cor da categoria, texto, metadata + prazo. Concluídas: opacidade 0.5, line-through.
5. Composer fixo no rodapé (ver 3.3).

**Estado vazio:** ilustração simples (placeholder) + frase em serif: "Sua primeira ideia mora aqui." + CTA.

**Empty state de filtro:** "Nenhuma tarefa por aqui." sem ilustração, com botão "limpar filtro".

### 3.3 Composer (smart capture)

Barra fixa no rodapé. Comportamento:

- **1 toque** no input → expande o textarea (max 5 linhas, scroll).
- **Parser de texto natural** roda enquanto digita. Detecta:
  - `#nome` → categoria (autocomplete dropdown sobre o input)
  - `amanhã 9h`, `sex 17h`, `próxima segunda`, `30/4 14h`, `daqui 2h` → vira tarefa com prazo
  - Sem nada disso → nota
- Chips de preview aparecem **acima** do input mostrando o que será criado: `[Tarefa · Sex 1/5 09:00 · trabalho]`. Clicar num chip abre o editor daquele campo.
- Botão de envio circular (40px), à direita.
- Botão de microfone (futuro placeholder, pode ficar visualmente presente).
- Atalho: `Ctrl/Cmd + Enter` envia. `Esc` colapsa.

### 3.4 Categorias — `#/categories`

Em **Paper:** lista vertical, item de 44px com avatar quadrado colorido (letra Instrument Serif), nome, contador mono, recente em uma linha.

Em **Playful:** **grid 2 colunas** de cards 130px com glow radial da cor, ícone/emoji, contador grande, contador de tarefas se > 0. Card "Novo espaço" tracejado.

Em **Linear:** lateral fixa (no desktop) ou lista densa (mobile) com swatch 7x7 + nome + contador mono.

**Editar/criar categoria:** bottom-sheet mobile / modal desktop. Campos: nome, cor (paleta de 12), `data-icon` opcional (futuro). Validação: nome único por usuário.

### 3.5 Tarefas — `#/tasks`

**Mobile:** lista agrupada por **Hoje / Amanhã / Esta semana / Sem prazo**. Header tem cartão "Foco do dia" (Paper/Playful) que ao tocar inicia modo foco (3.10).

**Desktop:** **3 visualizações** (toggle no header):
- **Quadro Kanban:** colunas Hoje · Amanhã · Esta semana · Sem prazo, drag-and-drop entre colunas atualiza o prazo automaticamente (manhã do dia destino).
- **Lista:** mesma da mobile, mais densa.
- **Calendário:** mês com pontos coloridos por categoria; tarefas overdue em vermelho.

### 3.6 Dashboard — `#/dashboard`

Endpoint `GET /api/stats` já existe. Estender se necessário para devolver:
- `totals: { notes, tasks, tasksCompleted, pending }`
- `streak: { currentDays, recordDays, lastActive }`
- `daily: [{ date, count }] // últimos 30 dias`
- `byCategory: [{ id, name, color, count, pct }]`
- `byHourDay: [{ dow: 0-6, hour: 0-23, count }]`
- `weekSummary: { capturedThisWeek, becameTask, topCategories[2], deltaVsLastWeek }`

**Layout (desktop):**
```
[KPIs: Capturadas | Concluídas | Pendentes | Streak]   ← 4 colunas
[Atividade · gráfico de barras 30 dias               ][Top categorias · barras horizontais]   ← 2:1
[Heatmap hora × dia                                  ][Resumo editorial da semana            ] ← 1:1
```

**Resumo editorial (semana):** card destacado com texto em Instrument Serif 22px:
> "Você capturou **26 ideias** essa semana — quase tudo de manhã, principalmente de trabalho. Seis viraram tarefa."

Construído server-side a partir de `weekSummary`. Tags abaixo: `+30% manhãs · 6 viraram tarefa · streak 12d`.

### 3.7 Perfil — `#/profile`

Avatar 80px (iniciais em Instrument Serif sobre fundo sólido, no Linear: gradiente accent).

**Stats strip:** 3 números grandes (notas, tarefas, streak) em Instrument Serif 28px + label mono.

**Grupos de configuração** (com label mono MAIÚSCULA):
- Conta: Editar perfil · Email e senha · 2FA · Sessões ativas
- Dados: Exportar tudo · Importar JSON · Limpar histórico (danger)
- Aparência: Tema (Paper/Playful/Linear) · Cor de destaque (apenas Paper)
- Sobre: Versão · Política de privacidade · Termos

Botão **Sair** outline no fim. **Não** misturar com lista de configs.

### 3.8 Auth — `#/auth/login` e `#/auth/register`

Sem gradiente. Usar Tema Paper como base de auth (independente do tema escolhido pelo usuário antes do login).

**Login:**
- Logo S 44px sobre fundo sólido ink.
- Título em Instrument Serif: "Suas ideias, *sempre à mão.*" (segunda linha em itálico + accent).
- Campos com **labels MONO MAIÚSCULAS** acima da linha (sem caixa), valor abaixo, hairline embaixo.
- Botão entrar 14px, ink full-width.
- Link de "esqueci senha" inline no campo de senha (à direita do label).
- Toggle no rodapé: "Sem conta? **Criar uma**" sublinhada.

**Register:** idem com 3 campos (nome, email, senha) + barra de força com 5 segmentos (vermelho → amarelo → verde) + texto explicativo abaixo. Política: ≥10 chars, letras+números, sem espaços, lista negra de senhas comuns (igual ao backend).

**MFA:** se backend pedir, abrir bottom-sheet com 6 inputs de 1 dígito ou 1 input com `inputmode="numeric"` e `autocomplete="one-time-code"`.

### 3.9 Modo foco do dia — `#/focus`

Tela cheia, fundo levemente diferente do normal (`bg-2`). Mostra:
- Frase grande em serif: "Hoje você quer fechar **N tarefas**."
- Cards das tarefas de hoje, **uma por uma** (swipe horizontal entre elas, ou setas no desktop).
- Ações: ✓ concluir · ⟳ adiar 1h · → próxima · 🗑 arquivar
- Timer Pomodoro **opcional** ativo (25/5min, mas que destaca o **descanso** com mensagem calma — não a urgência).
- Sair do modo: X no canto, ou Esc.

### 3.10 Command Palette — `⌘K` / `Ctrl+K`

Overlay com blur de fundo (8px). Caixa central 560px (desktop), full-width inset 16px (mobile).

**Comportamento:**
- Input grande no topo. Enquanto digita, parser detecta intent.
- Linha de "Smart preview" abaixo do input mostra o que vai criar/buscar (cor `--accent`, label mono "SMART").
- Lista de resultados agrupada: **Ações** → **Categorias** → **Recentes** → **Buscas**.
- Navegação ↑↓, Enter aceita, ⌥Enter alterna ação, Esc fecha.
- Atalhos: `⌘N` capturar (default), `⌘F` buscar, `⌘T` ir pra tarefas, `⌘D` dashboard, `⌘B` toggle tema.

### 3.11 Bottom navigation (mobile)

5 itens: **Inbox · Hoje · [+ Capturar] · Tarefas · Perfil**. Botão central elevado 56px com gradiente/accent (depende do tema). Toque longo no botão central abre o command palette.

### 3.12 Sidebar (desktop)

220px largura. Topo: logo + selo de versão. Busca/captura unificada (linha sutil tipo input com `⌘K` à direita). Itens: Inbox · Hoje · Tarefas · Dashboard. Grupo CATEGORIAS (mono label) com lista. Rodapé: avatar + nome + plano.

---

## 4. SEIS NOVAS FUNCIONALIDADES DE UX (implementar nesta ordem)

### F1 — Smart Capture (parser de texto natural)
- `utils/parse-natural.js` recebe string e devolve `{ text, isTask, dueAt?, categoryId?, reminderMin? }`.
- Padrões em PT-BR: `hoje`, `amanhã`, `depois de amanhã`, dias da semana (`seg`, `terça`...), `próxima segunda`, `daqui 2h`, `30/4`, `30/04/2026`, `às 14h`, `9:30`, `manhã`, `tarde`, `noite`.
- `#nome` casa categoria por nome (case-insensitive) e remove do texto.
- `!`, `!!`, `!!!` no fim → priority `low|med|high` (campo novo opcional).
- Chips de preview removíveis acima do composer (clicar X cancela aquele match).

### F2 — Command Palette
- Componente `command-palette.js`. Globalmente acessível por `⌘K`.
- Comandos: capturar, buscar, criar categoria, ir para página, alternar tema, exportar dados, sair.
- Indexa títulos das últimas 50 mensagens para busca rápida.

### F3 — Modo foco do dia
- Botão "Iniciar foco" em qualquer tela quando há tarefas de hoje pendentes.
- Persiste qual tarefa está ativa em `localStorage.savit_focus_idx` para retomar.

### F4 — Categorias-como-espaços
- Cada categoria tem **página própria** `#/category/:id`: header com cor e nome em serif, sub com contadores, feed filtrado.
- Banner editorial (Paper) com primeira linha de notas recentes em itálico.
- Botão "Adicionar nota nesta categoria" com cat pré-selecionada no composer.

### F5 — Swipe semântico
- **Mobile only** nos cards do feed (toques longos no desktop):
  - Swipe direita → vira tarefa (se nota) / conclui (se tarefa). Toast com **Desfazer** 5s.
  - Swipe esquerda → arquiva. Mesmo toast.
  - Long-press → bottom-sheet com ações: editar, categoria, prazo, copiar, excluir.
- Implementação com `pointerdown/pointermove/pointerup`, threshold 80px, animação de translate + fade do bg colorido (verde ✓ direita, cinza ▢ esquerda).

### F6 — Resumo editorial da semana
- Toda segunda às 9h (server-side), gerar registro `weekly_summary` com texto template:
  > "Você capturou **{n}** ideias essa semana — {when_pattern}, principalmente de **{top_cat}**. {tasks_n} viraram tarefa."
- Mostrar como **primeiro card no Inbox** das segundas-feiras, dispensável (X). Ficar acessível em Dashboard.

---

## 5. PWA, SHARE TARGET E CAPTURA INSTANTÂNEA

Em `manifest.json`, adicionar:

```json
"share_target": {
  "action": "/?share-target",
  "method": "GET",
  "params": { "title": "title", "text": "text", "url": "url" }
}
```

No `app.js`, ao detectar `?share-target`, abrir composer já preenchido com `text + url`. Permite "compartilhar do navegador → Savit" no Android/iOS.

**Notificação fixa de captura** (PWA Android via Service Worker `push` simulado local): out-of-scope, mas adicione um comentário `// TODO P2` no SW.

---

## 6. ACESSIBILIDADE & I18N

- Todos os botões com `aria-label`. Ícones decorativos com `aria-hidden`.
- Foco visível: `:focus-visible` com `outline: 2px solid var(--accent); outline-offset: 2px`.
- Contraste mínimo AA: ink/bg ≥ 4.5:1 em todos os temas (verificar Linear `--ink-2` sobre `--surface`).
- Mobile: respeitar `prefers-reduced-motion` desativando animações > 200ms.
- I18n: copy 100% PT-BR. Manter strings em `public/js/i18n/pt-BR.js` para futuro EN.

---

## 7. BUGS DE USABILIDADE A CORRIGIR

> Listados por sintoma. Verifique cada um e corrija.

1. **Cantos quadrados** em modals/cards/inputs. Aplicar `--radius-md/lg`.
2. **Hit targets pequenos** nos botões do header (40x40 já é OK; checar `.option-btn` no composer e `.color-option` no picker).
3. **Painéis laterais** abrem sem animação ou abrem por cima do conteúdo sem backdrop. Adicionar overlay `rgba(0,0,0,0.4)` clicável + slide 250ms ease.
4. **Categoria selecionada no composer** não tem como ser **trocada** sem remover primeiro. Permitir clique no chip para abrir o seletor.
5. **Modal de editar mensagem** mostra checkbox "É uma tarefa" + campos de data/hora separados. Substituir por toggle visual (chip) + datepicker inline.
6. **Date input nativo** no mobile abre teclado inadequado. Usar `<input type="datetime-local">` ou um picker custom.
7. **Search bar** quando aberto **não recebe foco automático**. Adicionar `requestAnimationFrame(() => input.focus())`.
8. **Empty state do search** não existe (mostra a lista vazia). Adicionar "Nenhum resultado para *{query}*" + botão limpar.
9. **Service Worker** cacheia versão antiga e usuário fica preso. Implementar `skipWaiting()` + toast "Nova versão disponível, recarregar?".
10. **Logout** mata o token local mas não o refresh cookie em algumas situações. Garantir chamada a `/api/auth/logout` antes de limpar storage e redirect.
11. **Importar JSON** não valida formato; quebra silenciosamente. Adicionar validação Zod no client + mensagem de erro clara.
12. **Color picker** tem cores fixas, sem indicação de qual está selecionada. Usar `outline` + scale 1.1 no item ativo.
13. **Toast/feedback** inexistente após criar/editar/deletar. Adicionar componente `toast.js` no canto inferior, 3s auto-dismiss.
14. **Scroll position** do feed reseta ao voltar de outra página. Salvar em `sessionStorage` e restaurar.
15. **Long-press no mobile** dispara menu de contexto do navegador. Adicionar `touch-action: manipulation` + `user-select: none` em cards.
16. **Tarefa concluída no feed** continua misturada com pendentes. Mover concluídas pro fim (ou esconder com toggle "mostrar concluídas").
17. **Notificação de erro de rede** inexistente. Banner sticky no topo "Sem conexão · suas alterações estão salvas localmente" quando `navigator.onLine === false`.
18. **Header z-index** conflita com modais ao rolar; modais ficam atrás. Corrigir `--z-modal > --z-header`.
19. **Form de login** envia mesmo com campos vazios em alguns navegadores. Adicionar `required` real + validação client-side.
20. **Atalho de teclado** inexistente no desktop. Implementar pelo menos `⌘K`, `⌘N`, `Esc`, `↑↓` no feed para navegar entre cards.

---

## 8. SCHEMA — adições compatíveis

Adicionar no `schema.prisma` **sem quebrar**:

```prisma
model Message {
  // ... campos existentes
  priority   String?  // "low" | "med" | "high"
  archivedAt DateTime?
  reminderMinBefore Int?
}

model Category {
  // ... campos existentes
  icon String? // futuro
  sortOrder Int @default(0)
}

model WeeklySummary {
  id        String   @id @default(cuid())
  userId    String
  weekStart DateTime
  payload   Json
  text      String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  @@unique([userId, weekStart])
}
```

Migration: `prisma migrate dev --name redesign_v2`.

---

## 9. ENTREGA EM FASES

> **Antes de cada fase**, mostrar o plano de arquivos a criar/editar e pedir confirmação. Após cada fase, fazer commit isolado.

- **S0 — Tokens & temas:** `tokens.css` + 3 temas + toggle no perfil + persistência. Migrar variáveis existentes em `styles.css` para os novos tokens. Sem mudar HTML.
- **S1 — Frame & navegação:** novo header, bottom nav (mobile), sidebar (desktop), router hash, persistir tema/sessão. Modais com backdrop animado.
- **S2 — Inbox + Composer:** redesenhar feed (cards de nota e tarefa), composer com chips, parser natural (F1), swipe (F5), toast.
- **S3 — Categorias + Tarefas + Foco:** páginas de categoria como espaço (F4), tarefas em 3 views, modo foco (F3).
- **S4 — Dashboard + Resumo:** estender `/api/stats`, render dashboard, gerar resumo semanal (F6).
- **S5 — Command Palette + Polish + Bugs:** ⌘K (F2), todos os bugs §7, share target PWA, a11y final, smoke tests manuais.

---

## 10. CRITÉRIOS DE ACEITE GLOBAIS

- [ ] Os 3 temas alternam sem reload e persistem.
- [ ] Captura natural funciona para os 10 padrões mais comuns em PT-BR.
- [ ] Nenhum corner < 8px (exceto Linear).
- [ ] `lighthouse` PWA score ≥ 90, A11y ≥ 95.
- [ ] Tudo navegável por teclado.
- [ ] Sem chamada a CDN externa não-versionada (FontAwesome local OK).
- [ ] Sem regressão em endpoints existentes.
- [ ] Cada bug em §7 tem teste manual descrito no PR.

---

## 11. NÃO FAZER

- Não introduzir React/Vue/build step.
- Não trocar Express por Fastify.
- Não mudar nomes de campos do Prisma já existentes.
- Não usar Tailwind. Tokens CSS + classes utilitárias minimalistas.
- Não usar emoji decorativo na UI (ok em copy de erros amigáveis).
- Não usar gradientes em Paper.
- Não importar Inter, Roboto ou system fonts como família principal.

---

## INÍCIO

Comece confirmando o plano da **Fase S0** (lista exata de arquivos a criar/editar e diff alto-nível do `styles.css`). **Não escreva código ainda.** Aguarde meu OK.
