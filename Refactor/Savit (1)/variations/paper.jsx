// Variation A — Paper: warm, editorial, calm. Notebook metaphor.
// Soft cream paper, ink black, single citrus accent, serif moments.

const PAPER = {
  bg: '#f6f1e8',
  card: '#fdfaf3',
  ink: '#1d1a14',
  ink2: '#5b5448',
  ink3: '#8a8270',
  hair: 'rgba(29,26,20,0.10)',
  accent: '#c0563a', // citrus/terra
  accent2: '#e6b540',
  shadow: '0 1px 0 rgba(29,26,20,0.04), 0 12px 24px -16px rgba(29,26,20,0.18)',
};

function PaperHeader({ title, sub, action }) {
  return (
    <div style={{
      padding: '14px 20px 10px',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
    }}>
      <div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, letterSpacing: '0.18em',
          color: PAPER.ink3, marginBottom: 4,
        }}>{sub}</div>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 36, lineHeight: 1, letterSpacing: '-0.01em',
          color: PAPER.ink,
        }}>{title}</div>
      </div>
      {action}
    </div>
  );
}

function PaperTabs({ tabs, active }) {
  return (
    <div style={{
      display: 'flex', gap: 0,
      padding: '0 20px',
      borderBottom: `1px solid ${PAPER.hair}`,
      marginTop: 8,
    }}>
      {tabs.map(t => (
        <div key={t.id} style={{
          padding: '12px 16px 12px 0',
          marginRight: 16,
          fontSize: 13, fontWeight: 500,
          color: t.id === active ? PAPER.ink : PAPER.ink3,
          borderBottom: t.id === active ? `1.5px solid ${PAPER.ink}` : '1.5px solid transparent',
          marginBottom: -1,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {t.label}
          {t.count != null && (
            <span style={{
              fontSize: 10,
              fontFamily: '"JetBrains Mono", monospace',
              color: t.id === active ? PAPER.ink : PAPER.ink3,
              opacity: 0.7,
            }}>{t.count}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// A small ink-stamp time label
function PaperTime({ children }) {
  return (
    <span className="mono" style={{
      fontSize: 10, color: PAPER.ink3, letterSpacing: '0.05em',
    }}>{children}</span>
  );
}

function PaperFeed() {
  const items = [
    { kind: 'day', label: 'Hoje · qui 30 abr' },
    { kind: 'note', cat: { name: 'Trabalho', color: '#c0563a' }, time: '09:42',
      text: 'Pensar num nome melhor pra feature de export. "Compartilhar" tá ambíguo.' },
    { kind: 'task', cat: { name: 'Trabalho', color: '#c0563a' }, time: '10:15',
      text: 'Revisar PR do refresh token rotation', when: 'Hoje, 16:00', done: false },
    { kind: 'note', cat: { name: 'Pessoal', color: '#3a8a6a' }, time: '12:08',
      text: 'O café da Inhotim era melhor do que eu lembrava.' },
    { kind: 'task', cat: { name: 'Casa', color: '#7a5cc7' }, time: '13:30',
      text: 'Trocar a lâmpada da sala', when: 'Sex 1/5, manhã', done: true },
    { kind: 'day', label: 'Ontem · qua 29 abr' },
    { kind: 'note', cat: { name: 'Leitura', color: '#e6b540' }, time: '21:14',
      text: '"O que você protege com sua atenção?" — anotação do Tchekhov.' },
    { kind: 'note', cat: null, time: '22:01',
      text: 'Sem categoria por enquanto. Voltar nessa amanhã.' },
  ];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      <PaperHeader
        sub="QUI · 30 ABR"
        title="Hoje"
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            <IconBtnPaper>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PAPER.ink} strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            </IconBtnPaper>
            <IconBtnPaper>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PAPER.ink} strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>
            </IconBtnPaper>
          </div>
        }
      />

      <PaperTabs
        active="all"
        tabs={[
          { id: 'all', label: 'Tudo', count: 28 },
          { id: 'tasks', label: 'Tarefas', count: 4 },
          { id: 'cats', label: 'Categorias' },
        ]}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 140px' }}>
        {items.map((it, i) => {
          if (it.kind === 'day') {
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '20px 0 10px',
              }}>
                <div className="mono" style={{
                  fontSize: 10, color: PAPER.ink3, letterSpacing: '0.14em',
                }}>{it.label.toUpperCase()}</div>
                <div style={{ flex: 1, height: 1, background: PAPER.hair }}></div>
              </div>
            );
          }
          if (it.kind === 'task') {
            return (
              <div key={i} style={{
                background: PAPER.card,
                border: `1px solid ${PAPER.hair}`,
                borderRadius: 14,
                padding: '14px 14px 12px',
                marginBottom: 10,
                display: 'flex', gap: 12, alignItems: 'flex-start',
                boxShadow: PAPER.shadow,
                opacity: it.done ? 0.55 : 1,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: `1.5px solid ${it.done ? it.cat.color : PAPER.ink}`,
                  background: it.done ? it.cat.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2,
                }}>
                  {it.done && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.5L5 9L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, lineHeight: 1.45,
                    textDecoration: it.done ? 'line-through' : 'none',
                    color: PAPER.ink,
                  }}>{it.text}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    {it.cat && <CategoryChipPaper {...it.cat} />}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: PAPER.ink2 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                      {it.when}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          // note
          return (
            <div key={i} style={{
              padding: '10px 0 12px',
              borderBottom: `1px dashed ${PAPER.hair}`,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 19, lineHeight: 1.35, letterSpacing: '-0.005em',
                color: PAPER.ink,
              }}>
                {it.text}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {it.cat ? <CategoryChipPaper {...it.cat} /> : (
                  <span className="mono" style={{ fontSize: 10, color: PAPER.ink3 }}>SEM CATEGORIA</span>
                )}
                <PaperTime>{it.time}</PaperTime>
              </div>
            </div>
          );
        })}
      </div>

      <PaperComposer />
    </div>
  );
}

function IconBtnPaper({ children }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: 'rgba(29,26,20,0.04)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</div>
  );
}

function CategoryChipPaper({ name, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, color: PAPER.ink2,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: 2,
        background: color, display: 'inline-block',
      }}/>
      {name}
    </span>
  );
}

function PaperComposer() {
  return (
    <div style={{
      position: 'absolute', left: 12, right: 12, bottom: 12,
      background: PAPER.card,
      border: `1px solid ${PAPER.hair}`,
      borderRadius: 18,
      padding: '10px 12px 10px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 6px 24px -8px rgba(29,26,20,0.18), 0 1px 0 rgba(29,26,20,0.04)',
    }}>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 14, color: PAPER.ink3,
      }}>
        <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 18, color: PAPER.ink2 }}>"</span>
        Anote uma ideia…
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PAPER.ink2} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        </button>
        <button style={{
          width: 32, height: 32, borderRadius: 10,
          background: PAPER.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
    </div>
  );
}

function PaperCategories() {
  const cats = [
    { name: 'Trabalho', color: '#c0563a', count: 42, recent: 'Refresh token rotation', tasks: 8 },
    { name: 'Pessoal', color: '#3a8a6a', count: 28, recent: 'Café da Inhotim', tasks: 2 },
    { name: 'Casa', color: '#7a5cc7', count: 19, recent: 'Trocar lâmpada', tasks: 4 },
    { name: 'Leitura', color: '#e6b540', count: 14, recent: 'Tchekhov — atenção', tasks: 0 },
    { name: 'Ideias', color: '#1d4ed8', count: 11, recent: 'App de pomodoro lento', tasks: 0 },
    { name: 'Saúde', color: '#d96fa0', count: 6, recent: 'Dentista', tasks: 1 },
  ];
  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <PaperHeader
        sub="6 ESPAÇOS"
        title="Categorias"
        action={
          <button style={{
            padding: '8px 12px', borderRadius: 999,
            background: PAPER.ink, color: '#fff',
            fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Novo
          </button>
        }
      />
      <div style={{ height: 12 }}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px' }}>
        {cats.map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 0',
            borderTop: `1px solid ${PAPER.hair}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: c.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Instrument Serif", serif',
              fontSize: 22, color: '#fff',
              flexShrink: 0,
            }}>
              {c.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{c.name}</div>
                <div className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.06em' }}>
                  {c.count} · {c.tasks > 0 ? `${c.tasks} tarefas` : '—'}
                </div>
              </div>
              <div style={{
                fontSize: 12, color: PAPER.ink2, marginTop: 2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {c.recent}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaperTasks() {
  const groups = [
    { label: 'Hoje', tasks: [
      { text: 'Revisar PR do refresh token rotation', cat: { name: 'Trabalho', color: '#c0563a' }, time: '16:00', done: false, urgent: true },
      { text: 'Ligar pro João', cat: { name: 'Pessoal', color: '#3a8a6a' }, time: '18:30', done: false },
    ]},
    { label: 'Amanhã · sex 1/5', tasks: [
      { text: 'Trocar a lâmpada da sala', cat: { name: 'Casa', color: '#7a5cc7' }, time: 'manhã', done: false },
      { text: 'Comprar pão', cat: { name: 'Casa', color: '#7a5cc7' }, time: 'manhã', done: true },
    ]},
    { label: 'Próxima semana', tasks: [
      { text: 'Dentista', cat: { name: 'Saúde', color: '#d96fa0' }, time: 'qua 6/5, 14h', done: false },
    ]},
  ];
  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      fontFamily: '"Geist", system-ui, sans-serif',
      color: PAPER.ink,
      display: 'flex', flexDirection: 'column',
    }}>
      <PaperHeader
        sub="5 PENDENTES · 1 CONCLUÍDA"
        title="Tarefas"
      />

      <div style={{
        margin: '14px 20px 8px',
        background: PAPER.card,
        border: `1px solid ${PAPER.hair}`,
        borderRadius: 14,
        padding: 14,
        boxShadow: PAPER.shadow,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: PAPER.accent + '18',
          color: PAPER.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Instrument Serif", serif',
          fontSize: 24, fontWeight: 500,
        }}>2</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Foco do dia</div>
          <div style={{ fontSize: 11.5, color: PAPER.ink2 }}>2 tarefas pra fechar antes das 19h</div>
        </div>
        <button style={{
          fontSize: 12, padding: '6px 10px', borderRadius: 8,
          color: PAPER.ink, fontWeight: 500,
        }}>
          Iniciar →
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '6px 20px 24px' }}>
        {groups.map((g, gi) => (
          <div key={gi}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 0 8px',
            }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: PAPER.ink3 }}>
                {g.label.toUpperCase()}
              </div>
              <div style={{ flex: 1, height: 1, background: PAPER.hair }}/>
            </div>
            {g.tasks.map((t, ti) => (
              <div key={ti} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: `1px solid ${PAPER.hair}`,
                opacity: t.done ? 0.5 : 1,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: `1.5px solid ${t.done ? t.cat.color : PAPER.ink}`,
                  background: t.done ? t.cat.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2,
                }}>
                  {t.done && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.5L5 9L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, lineHeight: 1.45,
                    textDecoration: t.done ? 'line-through' : 'none',
                  }}>
                    {t.text}
                    {t.urgent && (
                      <span style={{
                        marginLeft: 8, fontSize: 10,
                        color: PAPER.accent,
                        fontFamily: '"JetBrains Mono", monospace',
                        letterSpacing: '0.08em',
                      }}>· URGENTE</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
                    <CategoryChipPaper {...t.cat}/>
                    <span style={{ fontSize: 11, color: PAPER.ink2 }}>{t.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { PaperFeed, PaperCategories, PaperTasks, PAPER });
