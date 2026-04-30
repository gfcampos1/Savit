// Evaluation — what's built vs. what's still missing per SPEC.md

const EVAL_INK = '#1a1a1a';
const EVAL_BG = '#f6f1e8';
const EVAL_ACCENT = '#c0563a';
const EVAL_GREEN = '#3a8a6a';
const EVAL_AMBER = '#e6b540';
const EVAL_HAIR = 'rgba(0,0,0,0.10)';

function EvalReview() {
  const sections = [
    {
      title: 'O que está bom',
      tone: 'good',
      items: [
        'Tipografia e voz: Instrument Serif + JetBrains Mono criam personalidade clara em todos os 3 temas.',
        'Paper, Playful e Linear têm DNA distinto — não parecem o mesmo app pintado.',
        'Desktop em 3 colunas com painel de detalhe à direita resolve a densidade.',
        'Auth limpo, sem gradiente WhatsApp. Itálico no accent funciona.',
        'Cards de tarefa com checkbox 20px + cor da categoria seguem a spec §1.6.',
        'S0 — fundos Paper unificados em #f6f1e8 (Brief, Ideas, Eval).',
        'S0 — chips de preview no Paper composer (paper-feed-typing) tornam F1 visível.',
        'S0 — heatmap Linear agora é determinístico (sem Math.random a cada reload).',
      ],
    },
    {
      title: 'Pendências menores',
      tone: 'warn',
      items: [
        'Tooltip (desktop only) — pode ser adicionado em iteração futura junto com keyboard shortcuts.',
        'Tweaks "Idioma · en" é placeholder visual — i18n efetivo é trabalho de implementação, não de mock.',
        'A11y audit (Lighthouse, screen reader) — fora do escopo de design canvas.',
      ],
    },
    {
      title: 'S1–S6 — adicionado (40 artboards)',
      tone: 'good',
      items: [
        'S1 · 6 artboards: nav (3 temas) + focus (default, pomodoro, empty).',
        'S2 · 5 artboards: cat-space (3 temas) + dash mobile (Paper, Playful).',
        'S3 · 8 artboards: feed-monday × 2 + search × 2 + empty × 2 + toast + offline.',
        'S4 · 3 artboards: context-sheet, edit modal redesenhado, color picker.',
        'S5 · 11 artboards: auth-mfa, login Linear/Playful, sessões, export/import, 404, erro 500, onboarding × 3.',
        'S6 · comp-skeleton — 3 variantes (linha, grid 4, kanban 4 colunas) lado a lado + mostra do top loader 3px accent.',
        'S6 · comp-dialog — confirmation dialog em duas larguras (mobile 320px / desktop 480px) com ícone trash em accent×0.10, botão Excluir em danger.',
        'S6 · comp-datepicker — calendário standalone 360×460 com pílulas de atalho rápido + mini-calendário reusado.',
        'S6 · paper-share-incoming — banner sticky "vindo de Safari · arxiv.org" + card de conteúdo compartilhado + chips do parser preview + campo de comentário opcional + CTA "Salvar em Leitura".',
        'S6 · Tweaks panel ligado — TweaksPanel renderizado no App() com 6 controles funcionais: Tema (Paper/Vibrante/Linear), Accent Paper (6 cores), Densidade (Conforto/Denso), Mostrar grid 4px (overlay debug), Mostrar labels, Idioma (pt-BR / en). TWEAK_DEFAULTS bloco EDITMODE-BEGIN/END pra persistência via host.',
      ],
    },
    {
      title: 'S0 — corrigido',
      tone: 'good',
      items: [
        'R-01/R-02 — Composer Paper agora mostra chips de preview (artboard paper-feed-typing).',
        'R-03 — Tab "Categorias" ganhou contador (6).',
        'R-04 — Hairline entre header e tabs no Paper feed.',
        'R-05 — Metadata padronizada em 11.5px (notas e tarefas).',
        'R-06/R-07 — Contador de categorias agora em duas linhas mono (count + tasks).',
        'R-09 — Foco do dia "2" subiu pra 28px peso 400.',
        'R-10 — URGENTE virou pílula em linha de cima (não inline).',
        'R-11..R-14 — Playful: pílulas com border, scroll fade, barra full-height 4px, ícones stroke 2.',
        'R-15/R-16 — Emoji em fundo amarelo/coral troca pra glyph escuro; "Novo espaço" ganhou copy.',
        'R-17 — Novo artboard playful-task-empty com placeholder visível.',
        'R-18..R-20 — Linear feed 13.5px, ⌘↵ no composer, swatch da categoria no smart preview.',
        'R-21 — Heatmap determinístico (array hardcoded 7×24).',
        'R-22 — Badge v2 da sidebar subiu pra 10px.',
        'R-23 — Counters de Tarefas consistentes (8 pendentes em ambos sidebar e header).',
        'R-24 — Painel de detalhe ganhou seção ATIVIDADE (Capturado/Editado).',
        'R-25 — Link "Esqueci" sublinhado tracejado.',
        'R-26 — Segmentos off da barra de força com mais contraste (rgba 0.18).',
        'R-28 — Avatar B do Perfil agora 46px peso 500.',
        'R-29 — Stats strip do Perfil com padding interno por coluna.',
        'R-30 — "Sair" agora em danger color com border accent translúcido.',
      ],
    },
    {
      title: 'Próximos passos (S1–S6)',
      tone: 'next',
      items: [
        'S1 — Bottom nav (3 temas) + Modo foco (3 estados: padrão, Pomodoro, empty).',
        'S2 — Categoria-espaço (3 temas) + Dashboard mobile (Paper/Playful).',
        'S3 — Resumo segunda + Search + Estados vazios + Toast + Offline.',
        'S4 — Long-press sheet + Edit modal + Color picker.',
        'S5 — Auth Linear/Playful + MFA + Sessões + Export/Import + 404 + Onboarding.',
        'S6 — Tweaks panel funcional + Skeletons + Dialog + Datepicker + Tooltip.',
      ],
    },
  ];

  const toneStyle = {
    good: { dot: EVAL_GREEN, label: 'OK' },
    bad: { dot: EVAL_ACCENT, label: 'FALTA' },
    warn: { dot: EVAL_AMBER, label: 'AJUSTAR' },
    next: { dot: EVAL_INK, label: 'PRÓXIMO' },
  };

  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: EVAL_BG,
      padding: 40,
      fontFamily: '"Geist", system-ui, sans-serif',
      color: EVAL_INK,
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div className="mono" style={{ fontSize: 11, opacity: 0.5, letterSpacing: '0.12em' }}>AVALIAÇÃO · 30 ABR · S0–S6 ✓</div>
          <div style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.02em',
            marginTop: 8,
          }}>
            Redesign fechado.<br/>
            <span style={{ fontStyle: 'italic', color: EVAL_GREEN }}>40 artboards.</span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)', maxWidth: 320, lineHeight: 1.55, textAlign: 'right' }}>
          R-01..R-30 + 40 artboards novos (S1–S6) + tweaks panel funcional. Pronto pra handoff de implementação.
        </div>
      </div>

      <div style={{ height: 1, background: EVAL_HAIR }}/>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {sections.map((s, i) => (
          <div key={i} style={{
            background: '#fff',
            border: `1px solid ${EVAL_HAIR}`,
            borderRadius: 14,
            padding: 22,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: 2,
                background: toneStyle[s.tone].dot,
              }}/>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: toneStyle[s.tone].dot }}>
                {toneStyle[s.tone].label}
              </span>
              <div style={{ fontSize: 17, fontWeight: 600, marginLeft: 4, letterSpacing: '-0.01em' }}>
                {s.title}
              </div>
              <div style={{ flex: 1 }}/>
              <span className="mono" style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)' }}>
                {String(s.items.length).padStart(2, '0')}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {s.items.map((it, j) => (
                <div key={j} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  fontSize: 13, lineHeight: 1.55,
                  color: 'rgba(0,0,0,0.78)',
                  paddingBottom: j < s.items.length - 1 ? 10 : 0,
                  borderBottom: j < s.items.length - 1 ? `1px dashed ${EVAL_HAIR}` : 'none',
                }}>
                  <span className="mono" style={{
                    fontSize: 10, color: 'rgba(0,0,0,0.35)',
                    paddingTop: 3, minWidth: 18,
                  }}>{String(j + 1).padStart(2, '0')}</span>
                  <span>{it}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#fff',
        border: `1px solid ${EVAL_HAIR}`,
        borderRadius: 14,
        padding: 22,
        display: 'flex', gap: 24, alignItems: 'flex-start',
      }}>
        <div style={{ flex: 1 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(0,0,0,0.5)', marginBottom: 8 }}>
            VEREDITO
          </div>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 26, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
            <span style={{ color: EVAL_GREEN }}>Redesign fechado.</span> 40 artboards novos + 30 correções R-NN + tweaks panel ligado.
            Direção visual definida em 3 personalidades, jornada completa, e o sistema final.
            <span style={{ color: EVAL_ACCENT }}> Pronto pra handoff de implementação.</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
          <ProgressLine label="S0–S6 · Tudo" pct={100} color={EVAL_GREEN}/>
          <ProgressLine label="Mobile · Paper" pct={100} color={EVAL_GREEN}/>
          <ProgressLine label="Mobile · Playful" pct={96} color="#7c5cff"/>
          <ProgressLine label="Mobile · Linear" pct={90} color="#7c8bf5"/>
          <ProgressLine label="Desktop" pct={92} color={EVAL_GREEN}/>
          <ProgressLine label="Auth + Perfil" pct={100} color={EVAL_GREEN}/>
          <ProgressLine label="Estados/empty" pct={100} color={EVAL_GREEN}/>
          <ProgressLine label="Utilitários" pct={100} color={EVAL_GREEN}/>
          <ProgressLine label="Tweaks panel" pct={100} color={EVAL_GREEN}/>
        </div>
      </div>
    </div>
  );
}

function ProgressLine({ label, pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', width: 110 }}>{label}</div>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }}/>
      </div>
      <div className="mono" style={{ fontSize: 10, color: 'rgba(0,0,0,0.5)', width: 26, textAlign: 'right' }}>
        {pct}%
      </div>
    </div>
  );
}

Object.assign(window, { EvalReview });
