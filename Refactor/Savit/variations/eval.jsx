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
      title: 'Faltando da SPEC',
      tone: 'bad',
      items: [
        'Categoria-como-espaço (#/category/:id, F4) — Paper, Playful, Linear. Vai pra S2.',
        'Dashboard mobile (Paper/Playful). Vai pra S2.',
        'Resumo editorial da semana como CARD do Inbox de segunda. Vai pra S3.',
        'Search aberto + empty + sem resultado. Vai pra S3.',
        'Toast (4 variantes), banner offline. Vão pra S3.',
        'Empty states (feed, tasks, search). Vão pra S3.',
        'Long-press sheet, edit modal, color picker. Vão pra S4.',
        'MFA, sessões, export/import, onboarding, 404/erro. Vão pra S5.',
        'Skeletons, dialog, datepicker, tooltip. Vão pra S6.',
        'Tweaks panel está importado mas inerte — ligadura em S6.',
      ],
    },
    {
      title: 'S1 — adicionado (6 artboards)',
      tone: 'good',
      items: [
        'N-01 paper-nav — bottom nav Paper com FAB ink central elevado, hairline top.',
        'N-01 playful-nav — bottom nav com FAB gradient (purple→pink) e blur backdrop.',
        'N-01 linear-nav — nav densa, accent FAB quadrado, indicador top do item ativo.',
        'N-02 focus-paper — tela cheia, headline serif "Hoje você quer fechar 5 tarefas",  card único com pílula de categoria, ações ← Adiar | Concluir → e contador 2/5.',
        'N-02 focus-pomodoro — anel SVG circular 4:32 / 5min em verde de descanso, copy "Respira fundo. Volta em pouco." em itálico — destaca o descanso, não a urgência.',
        'N-02 focus-empty — "Nada pendente. Aproveita." em serif itálico, com 2 CTAs (capturar / sair) sem culpa.',
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
          <div className="mono" style={{ fontSize: 11, opacity: 0.5, letterSpacing: '0.12em' }}>AVALIAÇÃO · 30 ABR · S0+S1 APLICADOS</div>
          <div style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.02em',
            marginTop: 8,
          }}>
            S0+S1 fechados.<br/>S2–S6 em rota.
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)', maxWidth: 320, lineHeight: 1.55, textAlign: 'right' }}>
          R-01..R-30 + bottom nav (3) + modo foco (3) prontos. Próximo: categoria-espaço e dashboards mobile (S2).
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
            S0 + S1 entregam a <span style={{ color: EVAL_GREEN }}>fundação visual completa</span>: ajustes finos + bottom nav (3 temas) + modo foco (3 estados).
            Faltam agora as <span style={{ color: EVAL_ACCENT }}>telas verticais</span>: categoria-espaço, dashboards mobile, estados, auth completo.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
          <ProgressLine label="S0 · Correções" pct={100} color={EVAL_GREEN}/>
          <ProgressLine label="S1 · Nav + Foco" pct={100} color={EVAL_GREEN}/>
          <ProgressLine label="Mobile · Paper" pct={88} color={EVAL_ACCENT}/>
          <ProgressLine label="Mobile · Playful" pct={78} color="#7c5cff"/>
          <ProgressLine label="Mobile · Linear" pct={82} color="#7c8bf5"/>
          <ProgressLine label="Desktop" pct={90} color={EVAL_GREEN}/>
          <ProgressLine label="Auth + Perfil" pct={78} color={EVAL_AMBER}/>
          <ProgressLine label="Estados/empty" pct={20} color="#999"/>
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
