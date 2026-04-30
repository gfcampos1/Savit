// Variation B — Playful: vibrant gradients, dark base, soft glows.
// Bold colors, generous radii, micro-personality through copy.

const PLAYFUL = {
  bg: '#0e0a1a',
  surf: '#181228',
  surf2: '#221a36',
  ink: '#f5f0ff',
  ink2: '#a89cc4',
  ink3: '#6b5e8a',
  hair: 'rgba(255,255,255,0.08)',
  accent: '#ff6b9d',     // pink
  accent2: '#7c5cff',    // purple
  accent3: '#5cd6c0',    // mint
  accent4: '#ffb84a',    // amber
};

const playfulGrad = `linear-gradient(135deg, ${PLAYFUL.accent2} 0%, ${PLAYFUL.accent} 100%)`;
const playfulGrad2 = `linear-gradient(135deg, ${PLAYFUL.accent3} 0%, ${PLAYFUL.accent2} 100%)`;

function PlayfulShell({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: PLAYFUL.bg,
      color: PLAYFUL.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Soft glow blobs */}
      <div style={{
        position: 'absolute', top: -120, right: -80, width: 320, height: 320,
        background: `radial-gradient(circle, ${PLAYFUL.accent2}55 0%, transparent 65%)`,
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: -100, left: -100, width: 280, height: 280,
        background: `radial-gradient(circle, ${PLAYFUL.accent}33 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}/>
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

function PlayfulHeader() {
  return (
    <div style={{
      padding: '12px 18px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: playfulGrad,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 18,
        }}>S</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Olá, Bia ✦</div>
          <div style={{ fontSize: 11, color: PLAYFUL.ink2 }}>3 ideias soltas hoje</div>
        </div>
      </div>
      <button style={{
        width: 36, height: 36, borderRadius: 12,
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${PLAYFUL.hair}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PLAYFUL.ink} strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      </button>
    </div>
  );
}

function PlayfulFeed() {
  return (
    <PlayfulShell>
      <PlayfulHeader/>

      {/* Story-like category pills */}
      <div style={{
        padding: '4px 18px 14px',
        display: 'flex', gap: 10, overflow: 'auto',
      }}>
        {[
          { name: 'Tudo', color: null, active: true, count: 28 },
          { name: 'Trabalho', color: PLAYFUL.accent, count: 12 },
          { name: 'Pessoal', color: PLAYFUL.accent3, count: 8 },
          { name: 'Casa', color: PLAYFUL.accent2, count: 4 },
          { name: 'Leitura', color: PLAYFUL.accent4, count: 3 },
        ].map((c, i) => (
          <div key={i} style={{
            padding: '8px 14px', borderRadius: 999,
            background: c.active ? '#fff' : 'rgba(255,255,255,0.06)',
            border: c.active ? 'none' : `1px solid ${PLAYFUL.hair}`,
            color: c.active ? '#1a1130' : PLAYFUL.ink,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 500, flexShrink: 0,
          }}>
            {c.color && <span style={{ width: 8, height: 8, borderRadius: 4, background: c.color }}/>}
            {c.name}
            <span style={{
              fontSize: 10,
              opacity: 0.6,
              fontFamily: '"JetBrains Mono", monospace',
            }}>{c.count}</span>
          </div>
        ))}
      </div>

      {/* Featured "moment" card */}
      <div style={{ padding: '0 18px 14px' }}>
        <div style={{
          background: playfulGrad,
          borderRadius: 22,
          padding: 18,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 140, height: 140,
            background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
          }}/>
          <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: '0.1em', fontFamily: '"JetBrains Mono", monospace' }}>
            FOCO DO DIA
          </div>
          <div style={{
            fontSize: 22, fontWeight: 600, lineHeight: 1.25,
            marginTop: 6, letterSpacing: '-0.01em',
          }}>
            2 tarefas pra fechar<br/>antes das 19h
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <div style={{
              padding: '6px 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.2)',
              fontSize: 12, fontWeight: 500,
            }}>Revisar PR</div>
            <div style={{
              padding: '6px 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.2)',
              fontSize: 12, fontWeight: 500,
            }}>Ligar João</div>
          </div>
        </div>
      </div>

      {/* Feed cards */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 18px 120px' }}>
        <div style={{ fontSize: 11, color: PLAYFUL.ink3, letterSpacing: '0.12em', marginBottom: 10, fontFamily: '"JetBrains Mono", monospace' }}>
          IDEIAS SOLTAS
        </div>

        <PlayfulCard
          color={PLAYFUL.accent}
          cat="Trabalho"
          time="09:42"
          text="Pensar num nome melhor pra feature de export. 'Compartilhar' tá ambíguo."
        />
        <PlayfulCard
          color={PLAYFUL.accent3}
          cat="Pessoal"
          time="12:08"
          text="O café da Inhotim era melhor do que eu lembrava."
          big
        />
        <PlayfulCard
          color={PLAYFUL.accent4}
          cat="Leitura"
          time="21:14"
          text='"O que você protege com sua atenção?" — anotação do Tchekhov.'
        />
        <PlayfulCard
          color={null}
          cat={null}
          time="22:01"
          text="Sem categoria por enquanto. Voltar nessa amanhã."
        />
      </div>

      <PlayfulComposer/>
    </PlayfulShell>
  );
}

function PlayfulCard({ color, cat, time, text, big = false }) {
  return (
    <div style={{
      background: PLAYFUL.surf,
      borderRadius: 18,
      padding: 16,
      marginBottom: 10,
      border: `1px solid ${PLAYFUL.hair}`,
      position: 'relative',
    }}>
      {color && (
        <div style={{
          position: 'absolute', left: 0, top: 16, bottom: 16, width: 3,
          background: color, borderRadius: '0 3px 3px 0',
        }}/>
      )}
      <div style={{
        fontSize: big ? 17 : 14,
        lineHeight: 1.45,
        fontWeight: big ? 500 : 400,
        letterSpacing: big ? '-0.01em' : 0,
      }}>{text}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginTop: 10, fontSize: 11, color: PLAYFUL.ink2,
      }}>
        {cat ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: color }}/>
            {cat}
          </span>
        ) : <span style={{ color: PLAYFUL.ink3 }}>· sem categoria</span>}
        <span style={{ color: PLAYFUL.ink3 }}>·</span>
        <span>{time}</span>
      </div>
    </div>
  );
}

function PlayfulComposer() {
  return (
    <div style={{
      position: 'absolute', left: 14, right: 14, bottom: 14,
      background: 'rgba(24,18,40,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${PLAYFUL.hair}`,
      borderRadius: 22,
      padding: '10px 10px 10px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1, fontSize: 14, color: PLAYFUL.ink2 }}>
        Conta pra você mesma…
      </div>
      <button style={{
        width: 36, height: 36, borderRadius: 12,
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PLAYFUL.ink2} strokeWidth="1.7"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3"/></svg>
      </button>
      <button style={{
        width: 40, height: 40, borderRadius: 14,
        background: playfulGrad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 8px 24px -6px ${PLAYFUL.accent}55`,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </div>
  );
}

function PlayfulCategories() {
  const cats = [
    { name: 'Trabalho', color: PLAYFUL.accent, count: 42, tasks: 8, emoji: '⚡' },
    { name: 'Pessoal', color: PLAYFUL.accent3, count: 28, tasks: 2, emoji: '◐' },
    { name: 'Casa', color: PLAYFUL.accent2, count: 19, tasks: 4, emoji: '◇' },
    { name: 'Leitura', color: PLAYFUL.accent4, count: 14, tasks: 0, emoji: '✦' },
    { name: 'Ideias', color: '#5b8cff', count: 11, tasks: 0, emoji: '✿' },
    { name: 'Saúde', color: '#ff8a5b', count: 6, tasks: 1, emoji: '◉' },
  ];
  return (
    <PlayfulShell>
      <div style={{ padding: '12px 18px 8px' }}>
        <div style={{ fontSize: 11, color: PLAYFUL.ink3, letterSpacing: '0.14em', fontFamily: '"JetBrains Mono", monospace' }}>
          6 ESPAÇOS · 120 NOTAS
        </div>
        <div style={{ fontSize: 30, fontWeight: 600, marginTop: 6, letterSpacing: '-0.02em' }}>
          Seus mundos
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 18px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {cats.map((c, i) => (
            <div key={i} style={{
              background: PLAYFUL.surf,
              border: `1px solid ${PLAYFUL.hair}`,
              borderRadius: 18,
              padding: 14,
              position: 'relative',
              overflow: 'hidden',
              minHeight: 130,
            }}>
              <div style={{
                position: 'absolute', top: -20, right: -20, width: 80, height: 80,
                background: `radial-gradient(circle, ${c.color}40 0%, transparent 70%)`,
              }}/>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: c.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 600, color: '#fff',
              }}>{c.emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginTop: 10 }}>{c.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{c.count}</span>
                <span style={{ fontSize: 11, color: PLAYFUL.ink2 }}>notas</span>
              </div>
              {c.tasks > 0 && (
                <div style={{ fontSize: 10, color: c.color, marginTop: 4, fontFamily: '"JetBrains Mono", monospace' }}>
                  · {c.tasks} TAREFA{c.tasks > 1 ? 'S' : ''}
                </div>
              )}
            </div>
          ))}
          <div style={{
            border: `1.5px dashed ${PLAYFUL.hair}`,
            borderRadius: 18,
            minHeight: 130,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            color: PLAYFUL.ink2,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              border: `1.5px dashed ${PLAYFUL.ink3}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div style={{ fontSize: 12 }}>Novo espaço</div>
          </div>
        </div>
      </div>
    </PlayfulShell>
  );
}

function PlayfulCapture() {
  return (
    <PlayfulShell>
      <div style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button style={{
          width: 36, height: 36, borderRadius: 12,
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${PLAYFUL.hair}`,
          color: PLAYFUL.ink2,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="mono" style={{ fontSize: 11, color: PLAYFUL.ink2, letterSpacing: '0.14em' }}>NOVA TAREFA</div>
        <div style={{ width: 36 }}/>
      </div>

      <div style={{ flex: 1, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <textarea
          defaultValue="Revisar PR do refresh token rotation"
          style={{
            background: 'transparent',
            border: 'none',
            color: PLAYFUL.ink,
            fontSize: 26, fontWeight: 500, lineHeight: 1.3, letterSpacing: '-0.015em',
            resize: 'none',
            outline: 'none',
            minHeight: 90,
            fontFamily: 'inherit',
          }}
        />

        <div style={{
          background: PLAYFUL.surf,
          borderRadius: 18,
          border: `1px solid ${PLAYFUL.hair}`,
          padding: 4,
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          <FieldRow icon="cat" label="Categoria" value="Trabalho" valueColor={PLAYFUL.accent}/>
          <FieldRow icon="date" label="Quando" value="Hoje, 16:00" valueColor={PLAYFUL.accent3}/>
          <FieldRow icon="bell" label="Lembrete" value="15min antes" valueColor={PLAYFUL.ink2}/>
          <FieldRow icon="repeat" label="Repetir" value="Não" valueColor={PLAYFUL.ink3} last/>
        </div>

        {/* Quick chips */}
        <div>
          <div className="mono" style={{ fontSize: 10, color: PLAYFUL.ink3, letterSpacing: '0.14em', marginBottom: 8 }}>
            ATALHOS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Hoje à noite', 'Amanhã 9h', 'Sex 17h', 'Próxima segunda', 'Sem prazo'].map((s, i) => (
              <div key={i} style={{
                padding: '8px 12px', borderRadius: 999,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${PLAYFUL.hair}`,
                fontSize: 12, color: PLAYFUL.ink,
              }}>{s}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 18px 22px', display: 'flex', gap: 10 }}>
        <button style={{
          flex: 1, padding: 14, borderRadius: 16,
          background: 'rgba(255,255,255,0.06)',
          color: PLAYFUL.ink, fontSize: 14, fontWeight: 500,
          border: `1px solid ${PLAYFUL.hair}`,
        }}>Cancelar</button>
        <button style={{
          flex: 2, padding: 14, borderRadius: 16,
          background: playfulGrad,
          color: '#fff', fontSize: 14, fontWeight: 600,
          boxShadow: `0 8px 24px -6px ${PLAYFUL.accent}55`,
        }}>Salvar tarefa</button>
      </div>
    </PlayfulShell>
  );
}

function FieldRow({ icon, label, value, valueColor, last }) {
  const ic = {
    cat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M20 12V7a2 2 0 0 0-2-2h-7l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7"/><circle cx="17" cy="17" r="4"/></svg>,
    date: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
    bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>,
    repeat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="m17 1 4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  }[icon];
  return (
    <div style={{
      padding: '14px 14px',
      display: 'flex', alignItems: 'center', gap: 14,
      borderBottom: last ? 'none' : `1px solid ${PLAYFUL.hair}`,
    }}>
      <div style={{ color: PLAYFUL.ink2 }}>{ic}</div>
      <div style={{ fontSize: 14, color: PLAYFUL.ink2 }}>{label}</div>
      <div style={{ flex: 1 }}/>
      <div style={{ fontSize: 14, color: valueColor, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

Object.assign(window, { PlayfulFeed, PlayfulCategories, PlayfulCapture, PLAYFUL });
