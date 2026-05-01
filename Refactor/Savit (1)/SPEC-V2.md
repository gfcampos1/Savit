# Savit · Spec de correção e complemento (V2)

> **Contexto.** Esta spec parte do canvas atual (`Savit Redesign.html`) e da `SPEC.md` original. Cobre **tudo que ainda não foi desenhado** + **todos os ajustes finos** dos artboards já existentes. É a lista mestra para fechar o redesign antes de passar pra implementação.
>
> **Como usar.** Cada item tem ID (`R-NN` correção / `N-NN` novo / `T-NN` tweak). Marque ✅ ao concluir. Faça commit por bloco (S0–S6).
>
> **Escopo do design.** Apenas mocks no canvas. Implementação de código (router, parser, SW) fica em `SPEC.md`.

---

## ÍNDICE

- §0 Princípios e tokens consolidados
- §1 Correções nos artboards existentes (R-01…R-22)
- §2 Telas novas a desenhar (N-01…N-18)
- §3 Estados (vazio / erro / offline / loading)
- §4 Componentes faltantes
- §5 Tweaks panel — definição completa
- §6 Speaker notes / handoff
- §7 Plano de execução em fases (S0–S6)
- §8 Critérios de aceite

---

## §0 · Princípios e tokens consolidados

### 0.1 Tons base (alinhar TODOS os artboards)

Hoje **Brief** e **Ideas** usam `#fafaf7`, mas Paper usa `#f6f1e8`. **Decisão:** unificar em `#f6f1e8` para todos os fundos "Paper-like". Cards/superfícies internas: `#fdfaf3`. Manter Linear (`#0a0c10`) e Playful (`#0e0a1a`) como estão.

| Token | Paper | Playful | Linear |
|---|---|---|---|
| `--bg` | `#f6f1e8` | `#0e0a1a` | `#0a0c10` |
| `--surface` | `#fdfaf3` | `#181228` | `#0f1218` |
| `--surface-2` | `#f0e9da` (novo) | `#221a36` | `#161922` |
| `--ink` | `#1d1a14` | `#f5f0ff` | `#e6e8ec` |
| `--ink-2` | `#5b5448` | `#a89cc4` | `#9097a6` |
| `--ink-3` | `#8a8270` | `#6b5e8a` | `#5a6172` |
| `--accent` | `#c0563a` | `#ff6b9d` | `#7c8bf5` |

### 0.2 Tipografia — escala mínima por tema

- **Linear em mobile (390px frame)**: subir fonte de feed de `13px` → `13.5px`, mono ID de `11px` → `11.5px`. Texto fica respirável sem perder densidade.
- **Paper categorias contador**: subir mono de `10px` → `11px` e separar `42` (count) e `8 tarefas` (sub) em duas linhas pequenas, não numa única `42 · 8 tarefas`.
- **Avatar do Perfil**: `B` de `38px` Instrument Serif → `46px` weight `500`. Caixa segue 80px.

### 0.3 Sistema de imagery

Onde houver "imagem" futura (perfil, share-target preview, OG, banner de categoria), usar **placeholder com listras diagonais sutis** + label mono explicando o que vai ali. **Nunca** desenhar SVG ilustrativo.

### 0.4 Densidade

Adicionar tweak global `density: comfortable | compact`. Em compact, padding de cards `-2px`, gap `-2px`, sem mudar fontes.

---

## §1 · Correções em artboards existentes

### Paper · Feed (`paper-feed`)

- **R-01** Composer: adicionar **chips de preview** acima do input quando o parser detecta categoria/data. Mostrar exemplo estático: `[Tarefa · Sex 1/5 09:00 · trabalho ✕]`. Texto do input simulado: "amanhã 9h #trabalho lembrar do PR". É a feature-âncora — precisa estar visível no mock.
- **R-02** Composer: adicionar segundo estado (artboard `paper-feed-typing`) — input expandido em 3 linhas, com chip de preview e botão `⌘↵ enviar`.
- **R-03** Tabs: adicionar contador também na aba "Categorias" (hoje só "Tudo" e "Tarefas" têm).
- **R-04** Header: adicionar hairline entre header e tabs (atualmente flutua).
- **R-05** Cards de nota: alinhar `font-size` da metadata com cards de tarefa (hoje 11px vs 11.5px). Padronizar em **11.5px**.

### Paper · Categorias (`paper-cat`)

- **R-06** Linha do contador: mudar de `42 · 8 tarefas` (single line, ilegível) para:
  - linha 1: `42` em mono `11px` (count)
  - linha 2 (se tasks > 0): `· 8 tarefas` em mono `10px`, cor da categoria
- **R-07** Avatar quadrado da categoria (44px): adicionar `border-radius: 12px` consistente, e a letra Instrument Serif **ascender opcional** (`font-feature-settings: "ss01"`) — mais editorial.
- **R-08** Adicionar **bottom nav** abaixo (vide N-01).

### Paper · Tarefas (`paper-task`)

- **R-09** Card "Foco do dia" no topo: o número `2` em Instrument Serif 24px parece pequeno dentro do quadrado 38px. Subir para 28px e baixar weight para 400.
- **R-10** Tag `· URGENTE` em vermelho está em mono 10px após o título. Mover para uma **linha de cima** (acima do título), à esquerda, como label `URGENTE` em pílula 4px radius com bg `#c0563a18`.

### Playful · Feed (`playful-feed`)

- **R-11** Card "Foco do dia" com gradiente roxo→rosa: melhorar contraste do texto do counter `26 ideias`. Texto branco sobre gradiente está OK, mas pílulas internas (`Revisar PR`, `Ligar João`) precisam de borda `1px solid rgba(255,255,255,0.18)` para destacar.
- **R-12** Story-pills horizontais: adicionar **scroll fade** (mask-image gradient) à direita para mostrar que tem mais.
- **R-13** Cards do feed: hoje a barra colorida da esquerda tem `width: 3px` e `top: 16px / bottom: 16px`. Aumentar para `4px` e ir de `top: 0` a `bottom: 0` (toda a altura). Mais "Linear-like" e mais legível.
- **R-14** Composer Playful: o ícone de microfone tem stroke `1.7` mas o de envio tem `2.2`. Padronizar tudo em `2`.

### Playful · Categorias (`playful-cat`)

- **R-15** Cards 130px: o emoji-icon usa cor do fundo `c.color` que em alguns casos (amarelo `#ffb84a`) tem contraste baixo com o glyph branco. Aplicar `text-shadow: 0 1px 2px rgba(0,0,0,0.25)` ou trocar para preto quando luminance > 0.7.
- **R-16** Card "Novo espaço" (dashed): adicionar copy abaixo do `+`: `crie um novo espaço da sua vida` em 11px ink-3.

### Playful · Capture (`playful-task`)

- **R-17** Textarea grande tem `font-size: 26px` mas o cursor em mobile real fica enorme. Para mock, OK. Adicionar **placeholder visível** quando vazio: `Sobre o que é?` (estado alternativo, criar artboard `playful-task-empty`).

### Linear · Feed (`linear-feed`)

- **R-18** Subir fonte do texto principal de `13px` → `13.5px`. Subir IDs `SAV-128` de `11px` → `11.5px`.
- **R-19** Composer: o atalho `⌘N` está como pílula bg `surfHi` à esquerda. Adicionar segundo atalho `⌘↵` (save) próximo ao botão "Save" para coerência.

### Linear · Command (`linear-cmd`)

- **R-20** Smart preview: o pill "Tarefa · Sex 1/5, 09:00 · trabalho" está com a categoria "trabalho" em texto branco, sem o swatch. Adicionar `width: 6px; height: 6px; border-radius: 2px; background: var(--accent)` ao lado do texto, alinhando com o resto do app.

### Linear · Dashboard (`linear-dash`)

- **R-21** Heatmap usa `Math.random()` no render — pode parecer instável entre reloads. Substituir por array fixo de 7×24 valores hardcoded para o mock ser determinístico.

### Desktop (todas)

- **R-22** O badge `v2` no canto da sidebar está em `9px` — sobe para `10px`.
- **R-23** Quadro de Tarefas (`desk-task`): coluna "Hoje" tem `count: 2` no header, mas a copy diz "5 PENDENTES · 1 CONCLUÍDA" no header da página. Ajustar para refletir realmente o conteúdo das colunas (2+2+1+3 = 8 tarefas mocadas).
- **R-24** Painel de detalhe (`desk-home` direito): adicionar atividade/comentários abaixo de "Relacionadas" — log com `Capturado · 10:15` e `Editado · 11:02`.

### Auth

- **R-25** Login: o link "Esqueci" no campo de senha está em accent `#c0563a` 11px — quase imperceptível. Adicionar `border-bottom: 1px dashed currentColor` para ficar "linkável".
- **R-26** Register: barra de força (5 segmentos) está OK, mas o segmento "off" usa `color: hair` (rgba 0.10) — fica quase invisível no creme. Subir para `rgba(29,26,20,0.18)`.
- **R-27** Adicionar artboard de **MFA** (6 inputs de 1 dígito, bottom-sheet sobre o login) — `auth-mfa`.

### Profile (`profile`)

- **R-28** Avatar "B": Instrument Serif `38px` → `46px`, weight `500`.
- **R-29** Stats strip: os 3 números (`128`, `84`, `12d`) ficam encostados nas extremidades. Adicionar `padding: 0 8px` interno em cada coluna.
- **R-30** "Sair" outline está em ink-2 (`#5b5448`) com border hair — visualmente fraco. Trocar para texto `#c0563a` (danger) com border `1px solid #c0563a44`. Sair é destrutivo em UX.

---

## §2 · Telas novas (faltam mockar)

### N-01 — Bottom nav mobile (3 versões, uma por tema)

5 itens: **Inbox · Hoje · [+ Capturar] · Tarefas · Perfil**. Botão central elevado 56px com gradiente/accent (depende do tema). Toque longo no botão central abre command palette.

- Altura total: 72px (incluindo safe area inset bottom 16px).
- Itens laterais: ícone 22px + label 10px mono, gap 4px.
- Item ativo: ícone preenchido (não outline) + label em ink (não ink-3).
- Botão central: 56×56, eleva 12px acima da nav, sombra do tema.

**Artboards a criar:**
- `paper-nav` (390×844) — feed Paper com nav fixa
- `playful-nav` (390×844) — feed Playful com nav fixa
- `linear-nav` (390×844) — feed Linear com nav fixa

### N-02 — Modo foco do dia (#/focus)

Tela cheia. Frase grande em serif: "Hoje você quer fechar **N tarefas**." + cards swipeable (1 por vez), com ações ✓ concluir / ⟳ adiar 1h / → próxima / 🗑 arquivar. Timer Pomodoro opcional destacando descanso.

- Header: X canto superior esquerdo, contador `2 / 5` mono à direita.
- Card central ocupa 70% da viewport, com `transform: translateX()` indicando o swipe.
- Footer: 4 botões grandes (44px cada) lado a lado.
- Versão Pomodoro: anel circular SVG (não desenhar manual — criar como circle stroke-dashoffset) com tempo grande no centro em Instrument Serif 56px.

**Artboards:**
- `focus-paper` (390×844) — Paper aesthetic, modo padrão
- `focus-pomodoro` (390×844) — Paper, com timer ativo no descanso
- `focus-empty` (390×844) — sem tarefas hoje, frase: "Nada pendente. Aproveita."

### N-03 — Categoria-como-espaço (#/category/:id)

Header com cor da categoria como background sutil (10% opacity). Nome em Instrument Serif 36px. Sub: contadores mono `42 NOTAS · 8 TAREFAS`. Banner editorial (Paper) com primeira nota recente em itálico serif 19px. Lista filtrada abaixo.

**Artboards:**
- `paper-cat-space` (390×844) — categoria "Trabalho" aberta, banner com "Refresh token rotation" em itálico
- `playful-cat-space` (390×844) — categoria "Pessoal" com glow da cor + grid 2 colunas das notas
- `linear-cat-space` (390×844) — categoria "trabalho" densa, com 8 itens listados e filtro "Tasks/Notes" no topo

### N-04 — Dashboard mobile (Paper + Playful)

Hoje só Linear tem. Adicionar:

- `paper-dash` (390×844) — KPIs em coluna única, números grandes em Instrument Serif (40px), atividade simples (sparkline horizontal), "Resumo da semana" como card editorial em serif.
- `playful-dash` (390×844) — KPIs em grid 2×2, cards com glow da cor, gráfico de barras com gradient, top categorias.

### N-05 — Resumo da semana (card no Inbox)

Aparece como **primeiro card** do Inbox toda segunda. Pode ser dispensado (X canto superior). Frase em Instrument Serif:

> "Você capturou **26 ideias** essa semana — quase tudo de manhã, principalmente de **trabalho**. Seis viraram tarefa."

- `paper-feed-monday` (390×844) — Inbox de segunda com o card no topo
- `playful-feed-monday` (390×844) — idem, com gradient sutil no card

### N-06 — Search (busca aberta)

Spec §3.2 menciona busca, mas não está mockada.

- Header colapsa, input expande para full-width com cursor visível.
- Resultados agrupados: **Tarefas** (com contador) → **Notas** → **Categorias**.
- Empty state: "Nenhum resultado para *amanhã*" + botão "Limpar busca".

**Artboards:**
- `paper-search` (390×844) — busca com 3 grupos de resultado
- `paper-search-empty` (390×844) — empty state

### N-07 — Long-press / context sheet

Bottom-sheet aberto após long-press num card. Lista de ações: **Editar** · **Mudar categoria** · **Mudar prazo** · **Copiar texto** · **Compartilhar** · **Arquivar** · **Excluir** (danger).

- `paper-context-sheet` (390×844) — sheet aberto sobre o feed, backdrop 0.4

### N-08 — Editar mensagem (modal)

Hoje é texto + checkbox "É uma tarefa" + data/hora separados (bug §5 da spec). Substituir por:

- Toggle visual em chip no topo: `Nota | Tarefa` (segmented control).
- Se Tarefa: datepicker inline (não nativo do navegador), opções rápidas (Hoje / Amanhã / Sex 17h / Próxima seg / Sem prazo).
- Categoria: chip clicável que abre seletor inline (não modal sobre modal).

**Artboards:**
- `paper-edit` (390×844) — bottom-sheet de edição, modo Tarefa selecionado

### N-09 — Color picker (categoria)

Spec §1.5 lista 12 cores. Picker atual (na categoria) está sem indicação clara do selecionado.

- Grid 6×2 de círculos 32px.
- Selecionado: outline 2px ink-2 + scale 1.1.
- Hover (desktop): scale 1.05.

- `paper-color-picker` (390×600 — pode ser shorter) — grid de cores, "Trabalho" sendo editado

### N-10 — Toast / Snackbar

Componente flutuante (bottom-center mobile / bottom-right desktop). 3s auto-dismiss. Variantes:

- Success: "Tarefa criada" + chip "Desfazer" 5s
- Info: "Categoria atualizada"
- Danger: "Erro de rede" + chip "Tentar de novo"
- Update: "Nova versão · **Recarregar**" (sticky até clicar)

- `paper-toast` (390×120) — três variantes empilhadas em uma linha

### N-11 — Estado offline

Banner sticky no topo: `· sem conexão · suas alterações estão salvas localmente`. Cor amber (`#e6b540`) com bg `#e6b54012`. Some quando volta online com `· de volta online ✓` em verde por 2s.

- `paper-offline` (390×120) — banner

### N-12 — Tela vazia (3 estados)

- `paper-empty-feed` (390×844) — feed vazio inicial: "Sua primeira ideia mora aqui." + CTA grande "Capturar"
- `paper-empty-tasks` (390×844) — sem tarefas: "Nenhuma tarefa por aqui." + botão "Limpar filtro"
- `paper-empty-search` (390×844) — busca sem resultado (já em N-06)

### N-13 — 404 / Erro

- `paper-404` (390×844) — "Esta página fugiu." em serif + link "Voltar pro inbox"
- `paper-error` (390×844) — erro 500: "Algo deu errado. Já fomos avisados." + retry

### N-14 — Onboarding (3 telas)

Para novos usuários após register:

- `onboarding-1` — "Capture qualquer pensamento em 2 segundos." + ilustração placeholder
- `onboarding-2` — "Categorias dão cor à sua vida." + 6 swatches grandes selecionáveis
- `onboarding-3` — "Use linguagem natural." + exemplos de comando

### N-15 — Compartilhar (share target landing)

Quando o usuário compartilha de outro app (PWA share_target). Composer abre pré-preenchido com `text + url`. Header sticky: `· vindo de Safari ·` em mono.

- `paper-share-incoming` (390×844)

### N-16 — Auth Linear / Playful (decisão)

A spec original dizia "Auth sempre Paper". Mas se o usuário escolher Linear/Playful, o app inteiro muda — exceto auth, o que é **estranho** se ele já tinha logado uma vez.

**Decisão recomendada:** Auth respeita o último tema usado (lido de `localStorage.savit_theme`). Default = Paper.

- `auth-login-linear` (390×844)
- `auth-login-playful` (390×844)

### N-17 — Sessões ativas (subscreen do perfil)

Lista de dispositivos logados, com swipe-to-revoke.

- `profile-sessions` (390×844)

### N-18 — Exportar / Importar JSON

Telas de confirmação:

- `profile-export` (390×844) — "Exportar 128 mensagens?" + botão grande "Baixar .json"
- `profile-import` (390×844) — "Cole seu JSON ou solte um arquivo aqui" (dropzone tracejada) + validação live: ✓ 128 mensagens detectadas

---

## §3 · Estados (cobertura completa)

Para CADA tela principal, temos que ter:

| Tela | Vazio | Carregando | Erro | Offline |
|---|---|---|---|---|
| Inbox | N-12a | skeleton 5 cards | banner topo | N-11 |
| Tarefas | N-12b | skeleton kanban | banner topo | N-11 |
| Categorias | "crie sua primeira" | skeleton 4 rows | inline | N-11 |
| Dashboard | "Volte daqui 7 dias" | skeleton bars | inline | N-11 |
| Foco | N-02 (foco-empty) | — | — | N-11 |
| Search | N-06 (search-empty) | — | inline | inline |

Mockar **pelo menos** os de Inbox, Tarefas, Search (já em N-06/12).

---

## §4 · Componentes faltantes

### 4.1 Skeleton loaders

3 variantes: linha (1 card), grid (4 cards), kanban (4 colunas com 2-3 cards). Cor: `surface-2` com shimmer linear-gradient animado.

- `comp-skeleton` (1280×400) — todas as variantes lado a lado

### 4.2 Progress bar (top-loader)

3px no topo, cor accent, indeterminado quando uma req está em vôo.

### 4.3 Tooltip

Apenas desktop. Bg `surfHi`, fonte 11px ink-2, border 1px hair, radius 6, padding 4×8, delay 400ms.

### 4.4 Confirmation dialog

Para ações destrutivas (excluir, sair, limpar histórico). Modal centrado, copy clara: "Excluir esta nota? Não dá pra desfazer." + 2 botões ("Cancelar" outline / "Excluir" danger fill).

- `comp-dialog` (390×400 + 1280×400)

### 4.5 Date picker inline

Calendário mensal pequeno (7×6 grid de 32px), header com `< Maio 2026 >`. Dia hoje marcado com círculo accent. Selecionado preenchido. Atalhos: "Hoje" "Amanhã" "Sex" "Próxima seg" "Sem prazo" como pílulas acima.

- `comp-datepicker` (320×420)

---

## §5 · Tweaks panel — definição completa

O panel `tweaks-panel.jsx` está importado mas inerte. Ligar com:

```js
const TWEAK_DEFAULS = /*EDITMODE-BEGIN*/{
  "theme": "paper",       // paper | playful | linear
  "accent": "citrus",     // citrus | terra | amber | mint | purple | blue (Paper only)
  "density": "comfortable", // comfortable | compact
  "showGrid": false,      // overlay 4px grid sobre artboards (debug)
  "showLabels": true,     // mostra labels dos artboards
  "lang": "pt-BR"         // pt-BR | en (futuro)
}/*EDITMODE-END*/;
```

### Controles

1. **TweakRadio** "Tema" — Paper / Playful / Linear (3 opções, segmented)
2. **TweakRadio** "Accent (Paper)" — 6 swatches coloridos (citrus/terra/amber/mint/purple/blue) — habilitado só quando theme = paper
3. **TweakRadio** "Densidade" — Comfortable / Compact
4. **TweakToggle** "Mostrar grid 4px" (debug)
5. **TweakToggle** "Mostrar labels" (debug)
6. **TweakSelect** "Idioma" — pt-BR / en (en placeholder)

### Comportamento

- Mudar tema **filtra os artboards** mostrados (esconde os que não são daquele tema, mostra todos os outros como "outro tema, ver canvas").
- Ou alternativamente: muda o TEMA dos artboards "neutros" (auth, profile) para o escolhido.
- Mostrar grid: overlay CSS `background-image: repeating-linear-gradient(...)` em todos os DCArtboard.

---

## §6 · Speaker notes / handoff

Adicionar bloco no `app.jsx` com **decisões de design** que não cabem no canvas, para o desenvolvedor:

- Por que Paper é o default (calmo, mobile-first, vendável a usuário casual)
- Por que Linear existe (power users, desktop, atende quem reclamou de "muito quadrado")
- Por que Playful (ganchos visuais para reter usuários jovens, opcional)
- Tradeoffs: 3 temas = 3× CSS = bundle +6kb. Aceitável.
- Métricas: quero ver % de usuários por tema em 30 dias.

---

## §7 · Plano de execução em fases

### S0 — Tokens e correções rápidas (1-2h)
- R-01 a R-30 (todos os ajustes em artboards existentes)
- Unificar fundos Paper
- Fix R-21 (heatmap determinístico)

### S1 — Bottom nav (3 versões) e Modo foco (2-3h)
- N-01 (3 navs)
- N-02 (3 telas de foco)

### S2 — Categoria-espaço e Dashboards mobile (2h)
- N-03 (3 categorias-espaço)
- N-04 (Paper + Playful dash)

### S3 — Estados, Search e Resumo (2h)
- N-05 (resumo segunda)
- N-06 (search + empty)
- N-12 (3 telas vazias)
- N-11 (offline)
- N-10 (toast)

### S4 — Edição, contexto, color picker (1-2h)
- N-07 (long-press sheet)
- N-08 (editar tarefa/nota)
- N-09 (color picker)

### S5 — Auth completo, Perfil expandido (1-2h)
- R-27 (MFA)
- N-16 (auth Linear/Playful)
- N-17 (sessões)
- N-18 (export/import)
- N-13 (404/erro)
- N-14 (onboarding 3 telas)

### S6 — Tweaks ligado, componentes utilitários (1h)
- §5 (tweaks completo)
- §4 (skeletons, dialog, datepicker, tooltip)

**Total estimado: 10–14 horas de design.**

---

## §8 · Critérios de aceite

- [ ] Todos os 30 itens R-NN aplicados nos artboards atuais.
- [ ] Todas as 18 telas N-NN mockadas como artboards.
- [ ] Cobertura de estados (vazio/erro/offline) para Inbox, Tarefas e Search.
- [ ] Tweaks panel funcional com 6 controles.
- [ ] Nenhum artboard com `Math.random()` no render (determinismo de mock).
- [ ] Avaliação visual (`review-card`) atualizada com novo % de cobertura por área.
- [ ] Brief atualizado: incluir "estados" e "tweaks" como pilares.

---

## ANEXO A · Mapa de artboards finais

```
review-card · brief · ideas-card

A · Paper (mobile)
  paper-feed · paper-feed-typing · paper-feed-monday
  paper-cat · paper-cat-space
  paper-task
  paper-search · paper-search-empty
  paper-empty-feed · paper-empty-tasks
  paper-context-sheet · paper-edit · paper-color-picker
  paper-offline · paper-toast
  paper-nav
  focus-paper · focus-pomodoro · focus-empty
  paper-dash
  paper-share-incoming
  paper-404 · paper-error

B · Playful (mobile)
  playful-feed · playful-feed-monday
  playful-cat · playful-cat-space
  playful-task · playful-task-empty
  playful-nav
  playful-dash

C · Linear (mobile)
  linear-feed · linear-cat-space
  linear-cmd · linear-dash
  linear-nav

Desktop
  desk-home · desk-task · desk-dash
  comp-skeleton · comp-dialog · comp-datepicker

Auth + Perfil
  auth-login · auth-register · auth-mfa
  auth-login-linear · auth-login-playful
  profile · profile-sessions · profile-export · profile-import
  onboarding-1 · onboarding-2 · onboarding-3
```

**Total: ~50 artboards.** Hoje o canvas tem ~17. Faltam **~33**.

---

> Final dessa spec. Ao concluir, atualizar a seção `review-card` do canvas com o novo veredito e gerar PDF do canvas inteiro como artefato de handoff.
