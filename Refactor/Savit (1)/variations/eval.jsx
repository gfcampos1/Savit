// Evaluation — what's built vs. what's still missing per SPEC.md

const EVAL_INK = '#1a1a1a';
const EVAL_BG = '#fafaf7';
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
      ],
    },
    {
      title: 'Faltando da SPEC',
      tone: 'bad',
      items: [
        'Bottom nav mobile (5 itens) — só existe composer flutuante. Spec §3.11 pede tab bar com botão central elevado.',
        'Modo foco do dia (#/focus, F3) — apenas o cartão "Iniciar" em Tarefas. Falta a tela cheia com tarefa-por-tarefa.',
        'Dashboard mobile (Paper/Playful) não existe — só Linear tem.',
        'Categoria-como-espaço (#/category/:id, F4) com banner editorial — não está mocado.',
        'Toast de feedback (bug §13) e estado offline (§17) — sem visual.',
        'Resumo editorial da semana como CARD do feed de segunda — só existe no dashboard desktop.',
        'Estado vazio do feed e do filtro — não foram desenhados.',
        'Tweaks panel está importado mas inerte — sem opções de tema/density/accent.',
      ],
    },
    {
      title: 'Problemas de design a corrigir',
      tone: 'warn',
      items: [
        'Paper composer: só placeholder. Falta mostrar chips de preview (parser natural) acima do input — F1 é a feature-âncora.',
        'Playful: gradiente do "foco do dia" pode invadir o contraste; em mobile real o card de gradiente roxo+rosa pode brigar com a navegação.',
        'Linear feed: density está perfeita pra desktop mas no frame de 390px parece apertada — considere aumentar fonte pra 13.5px.',
        'Auth: o "B" no avatar do perfil tem 38px de Instrument Serif — fica fininho. Subir pro 44–48 ou trocar pra 500 weight.',
        'Categorias Paper: contador "42 · 8 tarefas" em mono é ilegível em 10px com letter-spacing 0.06em. Subir pra 11 ou separar visualmente.',
        'Brief e Ideas usam tons levemente diferentes do Paper (#fafaf7 vs #f6f1e8) — alinhar.',
        'Sem variação de auth/perfil para Linear ou Playful — só Paper. Decidir se é proposital (auth sempre Paper) ou desenhar as 3.',
        'Falta uma tela de Erro/404, e empty state global. Se não pretende mocar, declare como out-of-scope no Brief.',
      ],
    },
    {
      title: 'Próximos passos sugeridos',
      tone: 'next',
      items: [
        '1. Adicionar bottom nav mobile (Paper, Playful, Linear) — uma versão por tema.',
        '2. Mocar tela #/focus em Paper (alta prioridade — feature mais nova).',
        '3. Estado vazio do feed + estado de filtro vazio + busca sem resultado.',
        '4. Card "Resumo da semana" para o topo do Inbox de segunda.',
        '5. Página de categoria-espaço (Paper) com banner editorial.',
        '6. Ligar Tweaks: tema (Paper/Playful/Linear), accent color (Paper), density (comfortable/compact).',
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
          <div className="mono" style={{ fontSize: 11, opacity: 0.5, letterSpacing: '0.12em' }}>AVALIAÇÃO · 30 ABR</div>
          <div style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.02em',
            marginTop: 8,
          }}>
            O que está pronto,<br/>e o que ainda falta.
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)', maxWidth: 320, lineHeight: 1.55, textAlign: 'right' }}>
          Comparando o canvas atual com a SPEC.md (S0–S5). Foco em gaps de design, não de implementação.
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
            A direção visual está <span style={{ color: EVAL_GREEN }}>pronta</span> — três personalidades distintas e coerentes.
            O que falta agora é <span style={{ color: EVAL_ACCENT }}>cobertura de telas</span>: bottom nav, foco do dia, empty states e o card de resumo no feed.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
          <ProgressLine label="Mobile · Paper" pct={75} color={EVAL_ACCENT}/>
          <ProgressLine label="Mobile · Playful" pct={60} color="#7c5cff"/>
          <ProgressLine label="Mobile · Linear" pct={70} color="#7c8bf5"/>
          <ProgressLine label="Desktop" pct={85} color={EVAL_GREEN}/>
          <ProgressLine label="Auth + Perfil" pct={70} color={EVAL_AMBER}/>
          <ProgressLine label="Estados/empty" pct={10} color="#999"/>
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
