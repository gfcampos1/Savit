// Savit Redesign — top-level orchestrator

const { useState } = React;

// Phone frame helper — 390x844 iOS frame with status bar
function Phone({ children, dark = false, statusTime = '9:41', bg = '#fff' }) {
  return (
    <IOSDevice scale={1}>
      <div style={{
        position: 'absolute', inset: 0,
        background: bg,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <IOSStatusBar dark={dark} time={statusTime} />
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </IOSDevice>
  );
}

// §5 — Tweaks defaults & accent palette (Paper only)
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "paper",
  "accent": "citrus",
  "density": "comfortable",
  "showGrid": false,
  "showLabels": true,
  "lang": "pt-BR"
}/*EDITMODE-END*/;

const PAPER_ACCENTS = {
  citrus: '#c0563a',
  terra:  '#a0533c',
  amber:  '#e6b540',
  mint:   '#3a8a6a',
  purple: '#7a5cc7',
  blue:   '#5b8cff',
};

// Section header for the canvas
function App() {
  const [tweaks, setTweak] = (typeof useTweaks === 'function')
    ? useTweaks(TWEAK_DEFAULTS)
    : [TWEAK_DEFAULTS, () => {}];

  // 4px debug grid overlay (toggle via tweaks panel)
  const debugGrid = tweaks.showGrid ? (
    <style>{`
      [data-dc-artboard] { position: relative; }
      [data-dc-artboard]::after {
        content: ''; position: absolute; inset: 0; pointer-events: none;
        background-image:
          repeating-linear-gradient(0deg, rgba(192,86,58,0.10) 0 1px, transparent 1px 4px),
          repeating-linear-gradient(90deg, rgba(192,86,58,0.10) 0 1px, transparent 1px 4px);
      }
    `}</style>
  ) : null;

  // Hide artboard labels when toggle is off
  const labelsStyle = !tweaks.showLabels ? (
    <style>{`[data-dc-artboard-label] { display: none !important; }`}</style>
  ) : null;

  return (
    <>
      {debugGrid}
      {labelsStyle}
      <TweaksPanel title="Savit · Tweaks">
        <TweakSection label="Tema"/>
        <TweakRadio
          label="Variante"
          value={tweaks.theme}
          options={[
            { value: 'paper',   label: 'Paper' },
            { value: 'playful', label: 'Vibrante' },
            { value: 'linear',  label: 'Linear' },
          ]}
          onChange={(v) => setTweak('theme', v)}
        />
        <TweakRadio
          label="Accent (Paper)"
          value={tweaks.accent}
          options={[
            { value: 'citrus', label: 'Citrus' },
            { value: 'terra',  label: 'Terra' },
            { value: 'amber',  label: 'Amber' },
            { value: 'mint',   label: 'Mint' },
            { value: 'purple', label: 'Purple' },
            { value: 'blue',   label: 'Blue' },
          ]}
          onChange={(v) => setTweak('accent', v)}
        />

        <TweakSection label="Layout"/>
        <TweakRadio
          label="Densidade"
          value={tweaks.density}
          options={[
            { value: 'comfortable', label: 'Conforto' },
            { value: 'compact',     label: 'Denso' },
          ]}
          onChange={(v) => setTweak('density', v)}
        />

        <TweakSection label="Debug"/>
        <TweakToggle
          label="Mostrar grid 4px"
          value={tweaks.showGrid}
          onChange={(v) => setTweak('showGrid', v)}
        />
        <TweakToggle
          label="Mostrar labels"
          value={tweaks.showLabels}
          onChange={(v) => setTweak('showLabels', v)}
        />

        <TweakSection label="Idioma"/>
        <TweakSelect
          label="Locale"
          value={tweaks.lang}
          options={[
            { value: 'pt-BR', label: 'Português (BR)' },
            { value: 'en',    label: 'English (em breve)' },
          ]}
          onChange={(v) => setTweak('lang', v)}
        />
      </TweaksPanel>
      <DesignCanvas>
        <DCSection
          id="review"
          title="Avaliação · 30 abr"
          subtitle="O que está pronto e o que falta corrigir, comparando com a SPEC.md."
        >
          <DCArtboard id="review-card" label="Avaliação atual" width={1280} height={760}>
            <EvalReview />
          </DCArtboard>
        </DCSection>

        <DCSection
          id="intro"
          title="Savit — Redesign"
          subtitle="O app é uma metáfora linda (chat consigo mesmo) presa num clone do WhatsApp. Aqui tem 3 direções de mobile, um desktop denso novo, e auth/dashboard repensados."
        >
          <DCArtboard id="brief" label="Brief" width={640} height={480}>
            <Brief />
          </DCArtboard>
        </DCSection>

        <DCSection
          id="mobile"
          title="Mobile · 3 direções"
          subtitle="Mesmo produto, três personalidades. Toque qualquer artboard pra abrir em foco."
        >
          <DCArtboard id="paper-feed" label="A · Paper — feed" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperFeed /></Phone>
          </DCArtboard>
          <DCArtboard id="paper-feed-typing" label="A · Paper — feed (typing + chips)" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperFeedTyping /></Phone>
          </DCArtboard>
          <DCArtboard id="paper-cat" label="A · Paper — categorias" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperCategories /></Phone>
          </DCArtboard>
          <DCArtboard id="paper-task" label="A · Paper — tarefas" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperTasks /></Phone>
          </DCArtboard>

          <DCArtboard id="playful-feed" label="B · Playful — feed" width={390} height={844}>
            <Phone dark bg="#0e0a1a"><PlayfulFeed /></Phone>
          </DCArtboard>
          <DCArtboard id="playful-cat" label="B · Playful — categorias" width={390} height={844}>
            <Phone dark bg="#0e0a1a"><PlayfulCategories /></Phone>
          </DCArtboard>
          <DCArtboard id="playful-task" label="B · Playful — capture/tarefa" width={390} height={844}>
            <Phone dark bg="#0e0a1a"><PlayfulCapture /></Phone>
          </DCArtboard>
          <DCArtboard id="playful-task-empty" label="B · Playful — capture (placeholder)" width={390} height={844}>
            <Phone dark bg="#0e0a1a"><PlayfulCaptureEmpty /></Phone>
          </DCArtboard>

          <DCArtboard id="linear-feed" label="C · Linear — feed" width={390} height={844}>
            <Phone dark bg="#0a0c10"><LinearFeed /></Phone>
          </DCArtboard>
          <DCArtboard id="linear-cmd" label="C · Linear — command" width={390} height={844}>
            <Phone dark bg="#0a0c10"><LinearCommand /></Phone>
          </DCArtboard>
          <DCArtboard id="linear-dash" label="C · Linear — dashboard" width={390} height={844}>
            <Phone dark bg="#0a0c10"><LinearDash /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="bottom-nav"
          title="Bottom navigation · 5 itens · 3 temas"
          subtitle="Inbox · Hoje · [+ Capturar] · Tarefas · Perfil. FAB central elevado, segue o tema. Long-press abre command palette."
        >
          <DCArtboard id="paper-nav" label="A · Paper — feed + nav" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperFeedWithNav /></Phone>
          </DCArtboard>
          <DCArtboard id="playful-nav" label="B · Playful — feed + nav" width={390} height={844}>
            <Phone dark bg="#0e0a1a"><PlayfulFeedWithNav /></Phone>
          </DCArtboard>
          <DCArtboard id="linear-nav" label="C · Linear — feed + nav" width={390} height={844}>
            <Phone dark bg="#0a0c10"><LinearFeedWithNav /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="focus"
          title="Modo foco do dia"
          subtitle="Tela cheia. Uma tarefa por vez. Pomodoro opcional destaca o descanso, não a urgência. Empty state convida a desligar."
        >
          <DCArtboard id="focus-paper" label="Foco — padrão (Paper)" width={390} height={844}>
            <Phone bg="#f0e9da"><PaperFocus /></Phone>
          </DCArtboard>
          <DCArtboard id="focus-pomodoro" label="Foco — Pomodoro (descanso)" width={390} height={844}>
            <Phone bg="#f0e9da"><PaperFocusPomodoro /></Phone>
          </DCArtboard>
          <DCArtboard id="focus-empty" label="Foco — vazio" width={390} height={844}>
            <Phone bg="#f0e9da"><PaperFocusEmpty /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="cat-space"
          title="Categoria-como-espaço · 3 temas"
          subtitle="Cada categoria vira um lugar com sua cor, contadores e (no Paper) banner editorial. Não é só uma tag — é um cômodo."
        >
          <DCArtboard id="paper-cat-space" label="A · Paper — Trabalho (banner editorial)" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperCatSpace /></Phone>
          </DCArtboard>
          <DCArtboard id="playful-cat-space" label="B · Playful — Pessoal (glow + grid)" width={390} height={844}>
            <Phone dark bg="#0e0a1a"><PlayfulCatSpace /></Phone>
          </DCArtboard>
          <DCArtboard id="linear-cat-space" label="C · Linear — trabalho (densa, filtro)" width={390} height={844}>
            <Phone dark bg="#0a0c10"><LinearCatSpace /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="dash-mobile"
          title="Dashboard mobile · Paper + Playful"
          subtitle="Linear já existe (linear-dash). Aqui Paper como diário editorial, Playful como gráfico vibrante."
        >
          <DCArtboard id="paper-dash" label="A · Paper — dashboard (KPI serif + resumo)" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperMobileDash /></Phone>
          </DCArtboard>
          <DCArtboard id="playful-dash" label="B · Playful — dashboard (KPI grid 2×2)" width={390} height={844}>
            <Phone dark bg="#0e0a1a"><PlayfulMobileDash /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="states"
          title="Estados, busca e resumo"
          subtitle="O que torna o app fácil de usar quando dá errado: vazios convidativos, busca clara, resumo dispensável, toast e offline."
        >
          <DCArtboard id="paper-feed-monday" label="Paper — Inbox segunda (resumo no topo)" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperFeedMonday /></Phone>
          </DCArtboard>
          <DCArtboard id="playful-feed-monday" label="Playful — Inbox segunda (gradient)" width={390} height={844}>
            <Phone dark bg="#0e0a1a"><PlayfulFeedMonday /></Phone>
          </DCArtboard>
          <DCArtboard id="paper-search" label="Paper — busca aberta (3 grupos)" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperSearch /></Phone>
          </DCArtboard>
          <DCArtboard id="paper-search-empty" label="Paper — busca sem resultado" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperSearchEmpty /></Phone>
          </DCArtboard>
          <DCArtboard id="paper-empty-feed" label="Paper — feed vazio (primeira ideia)" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperEmptyFeed /></Phone>
          </DCArtboard>
          <DCArtboard id="paper-empty-tasks" label="Paper — tarefas vazias com filtro ativo" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperEmptyTasks /></Phone>
          </DCArtboard>
          <DCArtboard id="paper-toast" label="Paper — toast (4 variantes)" width={390} height={400}>
            <Phone bg="#f6f1e8"><PaperToastShowcase /></Phone>
          </DCArtboard>
          <DCArtboard id="paper-offline" label="Paper — offline / online banner" width={390} height={300}>
            <Phone bg="#f6f1e8"><PaperOffline /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="edit"
          title="Edição, contexto e cores"
          subtitle="Long-press abre ações. Edit modal vira bottom-sheet com toggle visual e datepicker inline. Color picker com selecionado óbvio."
        >
          <DCArtboard id="paper-context-sheet" label="Paper — long-press (bottom-sheet)" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperContextSheet /></Phone>
          </DCArtboard>
          <DCArtboard id="paper-edit" label="Paper — editar (Nota|Tarefa + datepicker inline)" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperEdit /></Phone>
          </DCArtboard>
          <DCArtboard id="paper-color-picker" label="Paper — color picker (12 cores)" width={390} height={600}>
            <Phone bg="#f6f1e8"><PaperColorPicker /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="desktop"
          title="Desktop · reimaginação"
          subtitle="Coluna tripla: navegação, feed, painel de contexto. Direção: Linear/Tech (a mais densa)."
        >
          <DCArtboard id="desk-home" label="Desktop — Home" width={1280} height={820}>
            <DesktopHome />
          </DCArtboard>
          <DCArtboard id="desk-task" label="Desktop — Tarefas" width={1280} height={820}>
            <DesktopTasks />
          </DCArtboard>
          <DCArtboard id="desk-dash" label="Desktop — Dashboard" width={1280} height={820}>
            <DesktopDash />
          </DCArtboard>
        </DCSection>

        <DCSection
          id="auth"
          title="Auth + Perfil"
          subtitle="Tela de entrada limpa, sem gradiente do WhatsApp. Perfil compacto."
        >
          <DCArtboard id="auth-login" label="Login" width={390} height={844}>
            <Phone bg="#f6f1e8"><AuthLogin /></Phone>
          </DCArtboard>
          <DCArtboard id="auth-register" label="Criar conta" width={390} height={844}>
            <Phone bg="#f6f1e8"><AuthRegister /></Phone>
          </DCArtboard>
          <DCArtboard id="profile" label="Perfil" width={390} height={844}>
            <Phone bg="#f6f1e8"><ProfileScreen /></Phone>
          </DCArtboard>
          <DCArtboard id="auth-mfa" label="Auth — MFA (6 dígitos)" width={390} height={844}>
            <Phone bg="#f6f1e8"><AuthMFA /></Phone>
          </DCArtboard>
          <DCArtboard id="auth-login-linear" label="Auth — login Linear" width={390} height={844}>
            <Phone dark bg="#0a0c10"><AuthLoginLinear /></Phone>
          </DCArtboard>
          <DCArtboard id="auth-login-playful" label="Auth — login Playful" width={390} height={844}>
            <Phone dark bg="#0e0a1a"><AuthLoginPlayful /></Phone>
          </DCArtboard>
          <DCArtboard id="profile-sessions" label="Perfil — sessões ativas" width={390} height={844}>
            <Phone bg="#f6f1e8"><ProfileSessions /></Phone>
          </DCArtboard>
          <DCArtboard id="profile-export" label="Perfil — exportar JSON" width={390} height={844}>
            <Phone bg="#f6f1e8"><ProfileExport /></Phone>
          </DCArtboard>
          <DCArtboard id="profile-import" label="Perfil — importar JSON" width={390} height={844}>
            <Phone bg="#f6f1e8"><ProfileImport /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="errors"
          title="404 e erro"
          subtitle="Quando o app falha, ele ainda fala bonito. Sem dramatizar, sem se desculpar demais."
        >
          <DCArtboard id="paper-404" label="Paper — 404" width={390} height={844}>
            <Phone bg="#f6f1e8"><Paper404 /></Phone>
          </DCArtboard>
          <DCArtboard id="paper-error" label="Paper — erro 500" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperError500 /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="onboarding"
          title="Onboarding · 3 telas"
          subtitle="Tour rápido pra mostrar o que o Savit faz de diferente. Pulável a qualquer momento."
        >
          <DCArtboard id="onboarding-1" label="1 · Captura instantânea" width={390} height={844}>
            <Phone bg="#f6f1e8"><Onboarding1 /></Phone>
          </DCArtboard>
          <DCArtboard id="onboarding-2" label="2 · Categorias = espaços" width={390} height={844}>
            <Phone bg="#f6f1e8"><Onboarding2 /></Phone>
          </DCArtboard>
          <DCArtboard id="onboarding-3" label="3 · Linguagem natural" width={390} height={844}>
            <Phone bg="#f6f1e8"><Onboarding3 /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="utils"
          title="Componentes utilitários"
          subtitle="Skeletons, dialog, datepicker, share-target. As pequenas peças que terminam o sistema."
        >
          <DCArtboard id="comp-skeleton" label="Skeleton loaders · 3 variantes" width={1280} height={500}>
            <CompSkeleton />
          </DCArtboard>
          <DCArtboard id="comp-dialog" label="Confirmation dialog (mobile + desktop)" width={1280} height={500}>
            <CompDialog />
          </DCArtboard>
          <DCArtboard id="comp-datepicker" label="Datepicker · standalone" width={360} height={460}>
            <CompDatepicker />
          </DCArtboard>
          <DCArtboard id="paper-share-incoming" label="Paper — share-target landing" width={390} height={844}>
            <Phone bg="#f6f1e8"><PaperShareIncoming /></Phone>
          </DCArtboard>
        </DCSection>

        <DCSection
          id="ideas"
          title="Novas ideias de UX"
          subtitle="Pra resolver o 'app quadrado e com bugs de usabilidade' — propostas concretas."
        >
          <DCArtboard id="ideas-card" label="6 propostas" width={1280} height={620}>
            <Ideas />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>
    </>
  );
}

function Brief() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#f6f1e8',
      padding: 48,
      display: 'flex', flexDirection: 'column', gap: 18,
      fontFamily: '"Geist", system-ui, sans-serif',
      color: '#1a1a1a',
    }}>
      <div style={{
        fontFamily: '"Instrument Serif", serif',
        fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.02em',
      }}>
        Suas ideias merecem<br/>uma casa melhor.
      </div>
      <div style={{ height: 1, background: 'rgba(0,0,0,0.1)', margin: '8px 0' }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, fontSize: 14, lineHeight: 1.55 }}>
        <div>
          <div className="mono" style={{ fontSize: 11, opacity: 0.5, marginBottom: 6, letterSpacing: '0.08em' }}>O QUE É</div>
          <div>App de captura rápida de ideias, tarefas e pensamentos, organizados por categorias com cores. PWA mobile-first.</div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 11, opacity: 0.5, marginBottom: 6, letterSpacing: '0.08em' }}>O PROBLEMA</div>
          <div>Hoje é um clone visual do WhatsApp. Não respeita o que o app é (notebook), e a copy/UX não acompanha a função.</div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 11, opacity: 0.5, marginBottom: 6, letterSpacing: '0.08em' }}>O QUE MANTÉM</div>
          <div>A ideia de "conversa consigo mesmo", categorias com cor, tarefas com data/hora, busca, dashboard.</div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 11, opacity: 0.5, marginBottom: 6, letterSpacing: '0.08em' }}>O QUE TROCA</div>
          <div>Verde WhatsApp, bolhas duras, hierarquia plana, cantos de 4px e excesso de ícones FontAwesome.</div>
        </div>
      </div>
    </div>
  );
}

function Ideas() {
  const ideas = [
    { n: '01', t: 'Captura instantânea', d: 'Atalho global (PWA share target + notificação fixa). Salvar em <2s sem abrir o app.' },
    { n: '02', t: 'Comando-tudo (⌘K)', d: 'Filtrar, categorizar, virar tarefa, exportar — uma barra que entende texto natural ("amanhã 9h #trabalho").' },
    { n: '03', t: 'Modo foco do dia', d: 'Tela diária mostra só tarefas de hoje + 3 ideias soltas pra revisitar. Reduz ansiedade do feed infinito.' },
    { n: '04', t: 'Categorias como temas', d: 'Cada categoria vira um "espaço" com sua cor — não só uma tag. Dá identidade às áreas da sua vida.' },
    { n: '05', t: 'Swipe semântico', d: 'Direita = virar tarefa. Esquerda = arquivar. Toque longo = categorizar. Sem ícones poluindo.' },
    { n: '06', t: 'Resumo da semana', d: 'Toda segunda, um cartão editorial com o que você capturou: tendências, categorias mais usadas, tarefas pendentes.' },
  ];
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#f6f1e8',
      padding: 48,
      fontFamily: '"Geist", system-ui, sans-serif',
      color: '#1a1a1a',
      display: 'flex', flexDirection: 'column', gap: 28,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 44, letterSpacing: '-0.02em' }}>
          Pra deixar de ser quadrado.
        </div>
        <div className="mono" style={{ fontSize: 11, opacity: 0.5, letterSpacing: '0.08em' }}>6 PROPOSTAS DE UX</div>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18,
      }}>
        {ideas.map(i => (
          <div key={i.n} style={{
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 14,
            padding: 22,
            background: '#fff',
            display: 'flex', flexDirection: 'column', gap: 10,
            minHeight: 180,
          }}>
            <div style={{
              fontFamily: '"Instrument Serif", serif', fontSize: 32, lineHeight: 1, color: '#c96442',
            }}>{i.n}</div>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{i.t}</div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(0,0,0,0.6)' }}>{i.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
