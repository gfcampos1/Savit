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

function PaperHeader({ title, sub, action, withHair = false }) {
  return (
    <div style={{
      padding: '14px 20px 10px',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
      borderBottom: withHair ? `1px solid ${PAPER.hair}` : 'none',
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
      marginTop: 0,
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
      fontSize: 11.5, color: PAPER.ink3, letterSpacing: '0.05em',
    }}>{children}</span>
  );
}

function PaperFeed({ noComposer = false } = {}) {
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
        withHair
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
          { id: 'cats', label: 'Categorias', count: 6 },
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: PAPER.ink2 }}>
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

      {!noComposer && <PaperComposer />}
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

// R-01 / R-02 — composer with optional chips preview row + typing state
function PaperComposerChip({ icon, color, children, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 8px 4px 10px',
      background: PAPER.bg,
      border: `1px solid ${PAPER.hair}`,
      borderRadius: 999,
      fontSize: 11.5,
      color: PAPER.ink,
      fontFamily: '"JetBrains Mono", monospace',
      letterSpacing: '0.04em',
    }}>
      {color && <span style={{ width: 7, height: 7, borderRadius: 2, background: color }}/>}
      {icon === 'task' && (
        <span style={{ fontSize: 10, color: PAPER.accent, fontWeight: 600 }}>TAREFA</span>
      )}
      <span>{children}</span>
      {onRemove && (
        <span style={{
          color: PAPER.ink3, fontSize: 12, cursor: 'pointer',
          marginLeft: 2, paddingLeft: 4, borderLeft: `1px solid ${PAPER.hair}`,
          paddingRight: 2,
        }}>×</span>
      )}
    </span>
  );
}

function PaperComposer({ chips, value, expanded }) {
  return (
    <div style={{
      position: 'absolute', left: 12, right: 12, bottom: 12,
      background: PAPER.card,
      border: `1px solid ${PAPER.hair}`,
      borderRadius: 18,
      padding: chips ? '10px 12px 10px 12px' : '10px 12px 10px 16px',
      display: 'flex', flexDirection: 'column', gap: chips ? 8 : 0,
      boxShadow: '0 6px 24px -8px rgba(29,26,20,0.18), 0 1px 0 rgba(29,26,20,0.04)',
    }}>
      {chips && chips.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          paddingLeft: 4,
        }}>
          {chips.map((c, i) => (
            <PaperComposerChip key={i} icon={c.icon} color={c.color} onRemove={c.removable}>{c.label}</PaperComposerChip>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: expanded ? 'flex-start' : 'center', gap: 10 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'flex-start', gap: 10,
          fontSize: 14, color: value ? PAPER.ink : PAPER.ink3,
          minHeight: expanded ? 64 : 'auto',
          padding: expanded ? '6px 4px' : '0 4px',
          lineHeight: 1.4,
        }}>
          {!value && (
            <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 18, color: PAPER.ink2 }}>"</span>
          )}
          <span style={{ flex: 1 }}>
            {value || 'Anote uma ideia…'}
            {expanded && (
              <span style={{
                display: 'inline-block', width: 1.5, height: 16,
                background: PAPER.accent, marginLeft: 2, verticalAlign: 'middle',
                animation: 'none',
              }}/>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', alignSelf: expanded ? 'flex-end' : 'center' }}>
          {expanded && (
            <span className="mono" style={{
              fontSize: 10, color: PAPER.ink3, letterSpacing: '0.08em',
              padding: '3px 6px', background: PAPER.bg, border: `1px solid ${PAPER.hair}`,
              borderRadius: 6,
            }}>⌘↵ enviar</span>
          )}
          {!expanded && (
            <button style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PAPER.ink2} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </button>
          )}
          <button style={{
            width: 32, height: 32, borderRadius: 10,
            background: PAPER.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  <div className="mono" style={{ fontSize: 11, color: PAPER.ink3, letterSpacing: '0.04em', lineHeight: 1 }}>
                    {c.count}
                  </div>
                  {c.tasks > 0 && (
                    <div className="mono" style={{
                      fontSize: 10, color: c.color, letterSpacing: '0.08em', lineHeight: 1,
                    }}>
                      · {c.tasks} {c.tasks === 1 ? 'tarefa' : 'tarefas'}
                    </div>
                  )}
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
          fontSize: 28, fontWeight: 400,
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
                  {t.urgent && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: PAPER.accent + '18',
                        color: PAPER.accent,
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 9.5,
                        letterSpacing: '0.14em',
                        borderRadius: 4,
                        fontWeight: 600,
                      }}>URGENTE</span>
                    </div>
                  )}
                  <div style={{
                    fontSize: 14, lineHeight: 1.45,
                    textDecoration: t.done ? 'line-through' : 'none',
                  }}>
                    {t.text}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
                    <CategoryChipPaper {...t.cat}/>
                    <span style={{ fontSize: 11.5, color: PAPER.ink2 }}>{t.time}</span>
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

// =============================================
// N-01 — Paper bottom nav (5 items, central elevated FAB)
// =============================================

function PaperBottomNav({ active = 'inbox' }) {
  const navIcon = (id, isActive) => {
    const stroke = isActive ? PAPER.ink : PAPER.ink3;
    const fill = isActive ? PAPER.ink : 'none';
    const sw = isActive ? 0 : 1.7;
    if (id === 'inbox') return isActive
      ? <svg width="22" height="22" viewBox="0 0 24 24" fill={fill}><path d="M22 12h-6l-2 3h-4l-2-3H2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8z"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" fill="none" stroke={stroke} strokeWidth="1.5"/></svg>
      : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
    if (id === 'today') return isActive
      ? <svg width="22" height="22" viewBox="0 0 24 24" fill={fill}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke={PAPER.bg} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
      : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    if (id === 'tasks') return isActive
      ? <svg width="22" height="22" viewBox="0 0 24 24" fill={fill}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6" stroke={PAPER.bg} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
      : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/></svg>;
    if (id === 'profile') return isActive
      ? <svg width="22" height="22" viewBox="0 0 24 24" fill={fill}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
      : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
    return null;
  };

  const items = [
    { id: 'inbox',   label: 'Inbox' },
    { id: 'today',   label: 'Hoje' },
    null, // capture FAB
    { id: 'tasks',   label: 'Tarefas' },
    { id: 'profile', label: 'Perfil' },
  ];

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
      paddingTop: 8,
      background: PAPER.card,
      borderTop: `1px solid ${PAPER.hair}`,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
      height: 72,
    }}>
      {items.map((it, i) => {
        if (!it) {
          // Center capture FAB — elevated 12px above nav
          return (
            <div key={i} style={{
              position: 'relative', width: 56, height: 56,
              marginTop: -12,
            }}>
              <button style={{
                width: 56, height: 56, borderRadius: 999,
                background: PAPER.ink,
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px -8px rgba(29,26,20,0.55), 0 1px 0 rgba(255,255,255,0.06) inset',
                border: `2px solid ${PAPER.bg}`,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          );
        }
        const isActive = it.id === active;
        return (
          <div key={it.id} style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            paddingTop: 4,
          }}>
            {navIcon(it.id, isActive)}
            <span className="mono" style={{
              fontSize: 10, letterSpacing: '0.12em',
              color: isActive ? PAPER.ink : PAPER.ink3,
              textTransform: 'uppercase',
              fontWeight: isActive ? 600 : 500,
            }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// =============================================
// N-02 — Paper Modo Foco (3 states: default, Pomodoro, empty)
// =============================================

function PaperFocusChrome({ counter, onClose }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px',
    }}>
      <button style={{
        width: 36, height: 36, borderRadius: 999,
        background: PAPER.card, border: `1px solid ${PAPER.hair}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PAPER.ink} strokeWidth="1.7" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div className="mono" style={{ fontSize: 11, color: PAPER.ink3, letterSpacing: '0.16em' }}>
        FOCO
      </div>
      <span className="mono" style={{
        fontSize: 11, color: PAPER.ink2, letterSpacing: '0.06em',
        padding: '4px 10px', background: PAPER.card,
        border: `1px solid ${PAPER.hair}`, borderRadius: 999,
      }}>{counter}</span>
    </div>
  );
}

function PaperFocusActions({ doneFirst = false }) {
  return (
    <div style={{
      padding: '0 20px 24px',
      display: 'grid', gridTemplateColumns: '44px 1fr 44px',
      gap: 10,
    }}>
      <button style={{
        width: 44, height: 44, borderRadius: 999,
        background: PAPER.card, border: `1px solid ${PAPER.hair}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: PAPER.ink2,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{
          flex: 1, padding: '0 12px', height: 44,
          background: 'transparent', color: PAPER.accent2,
          border: `1px solid ${PAPER.hair}`, borderRadius: 12,
          fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/></svg>
          Adiar 1h
        </button>
        <button style={{
          flex: 1.4, padding: '0 14px', height: 44,
          background: '#3a8a6a', color: '#fff',
          border: 'none', borderRadius: 12,
          fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          Concluir
        </button>
      </div>
      <button style={{
        width: 44, height: 44, borderRadius: 999,
        background: PAPER.card, border: `1px solid ${PAPER.hair}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: PAPER.ink2,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>
  );
}

function PaperFocus() {
  return (
    <div style={{
      width: '100%', height: '100%',
      // bg-2: leve variação do bg
      background: '#f0e9da',
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <PaperFocusChrome counter="2 / 5" />

      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', gap: 28,
      }}>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 32, lineHeight: 1.18,
          letterSpacing: '-0.02em',
          color: PAPER.ink, textAlign: 'center', maxWidth: 18,
          maxWidth: 280,
        }}>
          Hoje você quer fechar<br/>
          <strong style={{ color: PAPER.accent, fontWeight: 400 }}>5 tarefas</strong>.
        </div>

        <div style={{
          width: '100%', maxWidth: 340,
          background: PAPER.card,
          border: `1px solid ${PAPER.hair}`,
          borderRadius: 18,
          padding: 22,
          boxShadow: PAPER.shadow,
          display: 'flex', flexDirection: 'column', gap: 12,
          transform: 'rotate(-0.6deg)',
        }}>
          <span style={{
            display: 'inline-block', alignSelf: 'flex-start',
            padding: '3px 10px', borderRadius: 999,
            background: '#c0563a',
            color: '#fff',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10, letterSpacing: '0.14em',
          }}>TRABALHO</span>
          <div style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 22, lineHeight: 1.35,
            color: PAPER.ink,
          }}>
            Revisar PR do refresh token rotation
          </div>
          <div className="mono" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: PAPER.ink2, letterSpacing: '0.08em',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            HOJE · 16:00
          </div>
        </div>

        <div className="mono" style={{
          fontSize: 10, color: PAPER.ink3, letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
          ← deslize · ou setas →
        </div>
      </div>

      <PaperFocusActions/>
    </div>
  );
}

function PaperFocusPomodoro() {
  // Render a circular SVG ring representing 4:32 left of a 5min break
  const r = 86;
  const C = 2 * Math.PI * r;
  const pct = 0.92; // 4:32 of 5min remaining
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#f0e9da',
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <PaperFocusChrome counter="2 / 5" />

      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', gap: 24, position: 'relative',
      }}>
        <div className="mono" style={{
          fontSize: 11, letterSpacing: '0.18em',
          color: '#3a8a6a',
          padding: '4px 12px',
          background: 'rgba(58,138,106,0.08)',
          border: '1px solid rgba(58,138,106,0.20)',
          borderRadius: 999,
        }}>· DESCANSE</div>

        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 22, lineHeight: 1.4, fontStyle: 'italic',
          color: PAPER.ink2,
          textAlign: 'center', maxWidth: 280,
        }}>
          Respira fundo.<br/>Volta em pouco.
        </div>

        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <svg width="220" height="220" viewBox="0 0 220 220" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="110" cy="110" r={r} fill="none" stroke={PAPER.hair} strokeWidth="6"/>
            <circle cx="110" cy="110" r={r} fill="none" stroke="#3a8a6a"
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)}/>
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: '"Instrument Serif", serif',
              fontSize: 56, lineHeight: 1, letterSpacing: '-0.02em',
              color: PAPER.ink,
            }}>4:32</div>
            <div className="mono" style={{
              fontSize: 10, color: PAPER.ink3,
              letterSpacing: '0.16em', marginTop: 6,
            }}>de 5 min</div>
          </div>
        </div>

        <div className="mono" style={{
          fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em',
        }}>
          Próxima: revisar deploy
        </div>
      </div>

      <div style={{
        padding: '0 20px 24px',
        display: 'flex', gap: 10, justifyContent: 'center',
      }}>
        <button style={{
          padding: '12px 18px', borderRadius: 12,
          background: PAPER.card, border: `1px solid ${PAPER.hair}`,
          color: PAPER.ink, fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Pular descanso
        </button>
        <button style={{
          padding: '12px 18px', borderRadius: 12,
          background: PAPER.ink, color: '#fff',
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Pausar
        </button>
      </div>
    </div>
  );
}

function PaperFocusEmpty() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#f0e9da',
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <PaperFocusChrome counter="0 / 0" />

      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px', gap: 18, textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 24,
          background: PAPER.card, border: `1px solid ${PAPER.hair}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: PAPER.accent2,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
        </div>

        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 32, lineHeight: 1.15, letterSpacing: '-0.02em',
        }}>
          Nada pendente.<br/>
          <span style={{ fontStyle: 'italic', color: PAPER.accent }}>Aproveita.</span>
        </div>
        <div style={{
          fontSize: 13, color: PAPER.ink2, lineHeight: 1.55, maxWidth: 280,
        }}>
          Sem tarefas pra hoje. Capture algo, revise sua semana ou só feche o app — tá tudo bem.
        </div>
      </div>

      <div style={{ padding: '0 20px 24px', display: 'flex', gap: 10 }}>
        <button style={{
          flex: 1, padding: 14, borderRadius: 12,
          background: PAPER.card, color: PAPER.ink,
          border: `1px solid ${PAPER.hair}`,
          fontSize: 13, fontWeight: 500,
        }}>Capturar nova ideia</button>
        <button style={{
          flex: 1, padding: 14, borderRadius: 12,
          background: PAPER.ink, color: '#fff',
          fontSize: 13, fontWeight: 500,
        }}>Sair</button>
      </div>
    </div>
  );
}

// Wraps PaperFeed body (no floating composer) with the bottom nav
function PaperFeedWithNav() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: '0 0 72px 0', overflow: 'hidden' }}>
        <PaperFeed noComposer/>
      </div>
      <PaperBottomNav active="inbox"/>
    </div>
  );
}

// R-02 — feed with composer in expanded "typing" state showing parser chips
function PaperFeedTyping() {
  const items = [
    { kind: 'day', label: 'Hoje · qui 30 abr' },
    { kind: 'note', cat: { name: 'Trabalho', color: '#c0563a' }, time: '09:42',
      text: 'Pensar num nome melhor pra feature de export. "Compartilhar" tá ambíguo.' },
    { kind: 'task', cat: { name: 'Trabalho', color: '#c0563a' }, time: '10:15',
      text: 'Revisar PR do refresh token rotation', when: 'Hoje, 16:00', done: false },
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
      <PaperHeader sub="QUI · 30 ABR" title="Hoje" withHair />
      <PaperTabs
        active="all"
        tabs={[
          { id: 'all', label: 'Tudo', count: 28 },
          { id: 'tasks', label: 'Tarefas', count: 4 },
          { id: 'cats', label: 'Categorias', count: 6 },
        ]}
      />

      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 20px 220px' }}>
        {items.map((it, i) => {
          if (it.kind === 'day') {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0 10px' }}>
                <div className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.14em' }}>
                  {it.label.toUpperCase()}
                </div>
                <div style={{ flex: 1, height: 1, background: PAPER.hair }}/>
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
                display: 'flex', gap: 12,
                boxShadow: PAPER.shadow,
                opacity: 0.7,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: `1.5px solid ${PAPER.ink}`, marginTop: 2, flexShrink: 0,
                }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, lineHeight: 1.45 }}>{it.text}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <CategoryChipPaper {...it.cat}/>
                    <span style={{ fontSize: 11.5, color: PAPER.ink2 }}>{it.when}</span>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={i} style={{
              padding: '10px 0 12px', borderBottom: `1px dashed ${PAPER.hair}`,
              opacity: 0.7,
            }}>
              <div style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 19, lineHeight: 1.35,
                color: PAPER.ink,
              }}>{it.text}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <CategoryChipPaper {...it.cat}/>
                <PaperTime>{it.time}</PaperTime>
              </div>
            </div>
          );
        })}
      </div>

      <PaperComposer
        expanded
        value={'amanhã 9h #trabalho lembrar do PR'}
        chips={[
          { icon: 'task', label: 'Tarefa', removable: true },
          { label: 'Sex 1/5 09:00', removable: true },
          { color: '#c0563a', label: 'trabalho', removable: true },
        ]}
      />
    </div>
  );
}

// =============================================
// N-03 — paper-cat-space ("Trabalho" aberta, banner editorial)
// =============================================
function PaperCatSpace() {
  const cat = { name: 'Trabalho', color: '#c0563a', notes: 42, tasks: 8 };
  const recent = 'Refresh token rotation: pensar nos edge cases de Redis e múltiplas instâncias antes de mergear.';
  const items = [
    { kind: 'task', time: '10:15', text: 'Revisar PR do refresh token rotation', when: 'Hoje, 16:00', done: false, urgent: true },
    { kind: 'note', time: '09:42', text: 'Pensar num nome melhor pra feature de export. "Compartilhar" tá ambíguo.' },
    { kind: 'task', time: '08:14', text: 'Mandar resumo da reunião pro time', when: 'Sex 1/5, manhã', done: false },
    { kind: 'note', time: 'ontem', text: 'O Pedro deixou um TODO sobre rate-limit consistency. Verificar antes de publicar.' },
    { kind: 'note', time: 'ontem', text: '"Atenção é o que mostra o que importa." — anotação livre.' },
  ];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Tinted header (10% color over Paper bg) */}
      <div style={{
        background: `linear-gradient(180deg, ${cat.color}1a 0%, ${cat.color}00 100%)`,
        padding: '14px 20px 18px',
        display: 'flex', flexDirection: 'column', gap: 12,
        borderBottom: `1px solid ${PAPER.hair}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(29,26,20,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PAPER.ink} strokeWidth="1.7" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em' }}>ESPAÇO</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <IconBtnPaper>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PAPER.ink} strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            </IconBtnPaper>
            <IconBtnPaper>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PAPER.ink} strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>
            </IconBtnPaper>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{
            width: 14, height: 14, borderRadius: 4,
            background: cat.color, marginTop: 6, flexShrink: 0,
          }}/>
          <div style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 36, lineHeight: 1, letterSpacing: '-0.02em',
            color: PAPER.ink,
          }}>{cat.name}</div>
        </div>

        <div className="mono" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 10.5, color: PAPER.ink3,
          letterSpacing: '0.14em',
          marginLeft: 26,
        }}>
          <span>{cat.notes} NOTAS</span>
          <span style={{ color: PAPER.ink3 }}>·</span>
          <span style={{ color: cat.color }}>{cat.tasks} TAREFAS</span>
        </div>

        {/* Editorial banner (Paper only) */}
        <blockquote style={{
          margin: '6px 0 0 26px',
          padding: '10px 14px',
          background: PAPER.card,
          borderLeft: `3px solid ${cat.color}`,
          borderRadius: '0 12px 12px 0',
          fontFamily: '"Instrument Serif", serif',
          fontStyle: 'italic',
          fontSize: 17, lineHeight: 1.45,
          color: PAPER.ink2,
        }}>{recent}</blockquote>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 100px' }}>
        {items.map((it, i) => {
          if (it.kind === 'task') {
            return (
              <div key={i} style={{
                background: PAPER.card,
                border: `1px solid ${PAPER.hair}`,
                borderRadius: 14,
                padding: '14px 14px 12px',
                marginBottom: 10,
                display: 'flex', gap: 12,
                boxShadow: PAPER.shadow,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: `1.5px solid ${PAPER.ink}`,
                  marginTop: 2, flexShrink: 0,
                }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {it.urgent && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px',
                        background: cat.color + '18', color: cat.color,
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 9.5, letterSpacing: '0.14em',
                        borderRadius: 4, fontWeight: 600,
                      }}>URGENTE</span>
                    </div>
                  )}
                  <div style={{ fontSize: 14, lineHeight: 1.45 }}>{it.text}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <span style={{ fontSize: 11.5, color: PAPER.ink2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                      {it.when}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={i} style={{
              padding: '12px 0',
              borderBottom: `1px dashed ${PAPER.hair}`,
            }}>
              <div style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 19, lineHeight: 1.35,
                color: PAPER.ink,
              }}>{it.text}</div>
              <div style={{ marginTop: 6 }}>
                <PaperTime>{it.time}</PaperTime>
              </div>
            </div>
          );
        })}
      </div>

      {/* "+ Adicionar nesta categoria" pinned button */}
      <button style={{
        position: 'absolute', left: 20, right: 20, bottom: 20,
        padding: '14px',
        background: cat.color,
        color: '#fff',
        border: 'none', borderRadius: 14,
        fontSize: 14, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: `0 8px 24px -8px ${cat.color}66`,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Adicionar em Trabalho
      </button>
    </div>
  );
}

// =============================================
// N-04 — paper-dash (KPIs serif, sparkline, resumo editorial)
// =============================================
function PaperMobileDash() {
  const days = [3, 5, 2, 8, 6, 9, 4, 7, 11, 8, 5, 12, 9, 14, 10, 6, 8, 11, 7, 13, 9, 16, 12, 8, 11, 14, 10, 9, 7, 12];
  const max = Math.max(...days);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <PaperHeader sub="QUI · 30 ABR · 30 DIAS" title="Dashboard" withHair />

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 24px' }}>
        {/* KPI column — big serif numbers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            { label: 'CAPTURADAS', value: '128', delta: '+24% vs. mar', up: true },
            { label: 'CONCLUÍDAS', value: '84', delta: '+12% vs. mar', up: true },
            { label: 'PENDENTES', value: '14', delta: '−3 desde ontem' },
            { label: 'STREAK', value: '12d', delta: 'recorde da conta', up: true },
          ].map((k, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              paddingBottom: 14,
              borderBottom: i < 3 ? `1px dashed ${PAPER.hair}` : 'none',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="mono" style={{ fontSize: 10.5, color: PAPER.ink3, letterSpacing: '0.16em' }}>
                  {k.label}
                </span>
                <span style={{
                  fontSize: 11.5, color: k.up ? '#3a8a6a' : PAPER.ink2,
                }}>{k.delta}</span>
              </div>
              <div style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 40, lineHeight: 1, letterSpacing: '-0.02em',
                color: PAPER.ink,
              }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Sparkline activity */}
        <div style={{
          marginTop: 22,
          padding: 18,
          background: PAPER.card,
          border: `1px solid ${PAPER.hair}`,
          borderRadius: 16,
          boxShadow: PAPER.shadow,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="mono" style={{ fontSize: 10.5, color: PAPER.ink3, letterSpacing: '0.16em' }}>
              ATIVIDADE · 30 DIAS
            </span>
            <span className="mono" style={{ fontSize: 10.5, color: '#3a8a6a' }}>↑ +18%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 56 }}>
            {days.map((v, i) => (
              <div key={i} style={{
                flex: 1,
                height: `${(v / max) * 100}%`,
                background: i >= 27 ? PAPER.accent : `${PAPER.ink}66`,
                borderRadius: '2px 2px 0 0',
                minHeight: 3,
              }}/>
            ))}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 9.5, color: PAPER.ink3, marginTop: 6,
            fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.08em',
          }}>
            <span>1 ABR</span><span>30 ABR</span>
          </div>
        </div>

        {/* Top categories */}
        <div style={{ marginTop: 18, padding: '0 4px' }}>
          <div className="mono" style={{ fontSize: 10.5, color: PAPER.ink3, letterSpacing: '0.16em', marginBottom: 12 }}>
            POR CATEGORIA
          </div>
          {[
            { name: 'trabalho', count: 42, pct: 0.85, color: '#c0563a' },
            { name: 'pessoal', count: 28, pct: 0.55, color: '#3a8a6a' },
            { name: 'casa', count: 19, pct: 0.38, color: '#7a5cc7' },
            { name: 'leitura', count: 14, pct: 0.28, color: '#e6b540' },
          ].map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderBottom: i < 3 ? `1px solid ${PAPER.hair}` : 'none',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }}/>
              <div style={{ width: 80, fontSize: 13 }}>{c.name}</div>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: PAPER.hair, overflow: 'hidden' }}>
                <div style={{ width: `${c.pct * 100}%`, height: '100%', background: c.color }}/>
              </div>
              <span className="mono" style={{ fontSize: 11, color: PAPER.ink2, width: 28, textAlign: 'right' }}>{c.count}</span>
            </div>
          ))}
        </div>

        {/* Editorial weekly summary */}
        <div style={{
          marginTop: 22,
          padding: '20px 18px',
          background: PAPER.card,
          border: `1px dashed ${PAPER.hair}`,
          borderRadius: 16,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <span className="mono" style={{ fontSize: 10.5, color: PAPER.ink3, letterSpacing: '0.16em' }}>
            RESUMO DA SEMANA
          </span>
          <div style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 22, lineHeight: 1.4, letterSpacing: '-0.01em',
          }}>
            Você capturou <strong style={{ color: PAPER.accent, fontWeight: 400 }}>26 ideias</strong> essa semana — quase tudo de manhã, principalmente de <strong style={{ color: '#c0563a', fontWeight: 400 }}>trabalho</strong>. Seis viraram tarefa.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {['+30% manhãs', '6 → tarefa', 'streak 12d'].map((t, i) => (
              <span key={i} className="mono" style={{
                padding: '3px 10px', background: PAPER.bg,
                fontSize: 10, letterSpacing: '0.12em',
                color: PAPER.ink2, borderRadius: 999,
                border: `1px solid ${PAPER.hair}`,
                textTransform: 'uppercase',
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// N-05 — paper-feed-monday (Inbox segunda com card de resumo no topo)
// =============================================
function PaperWeeklySummaryCard({ dismissable = true }) {
  return (
    <div style={{
      background: PAPER.card,
      border: `1px dashed ${PAPER.hair}`,
      borderRadius: 16,
      padding: '16px 18px',
      marginBottom: 14,
      position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 6, height: 6, borderRadius: 3,
          background: PAPER.accent2,
        }}/>
        <span className="mono" style={{
          fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em',
        }}>RESUMO DA SEMANA · SEG 5/5</span>
        {dismissable && (
          <>
            <div style={{ flex: 1 }}/>
            <span style={{
              color: PAPER.ink3, fontSize: 14, fontWeight: 400,
              cursor: 'pointer',
            }}>×</span>
          </>
        )}
      </div>
      <div style={{
        fontFamily: '"Instrument Serif", serif',
        fontSize: 20, lineHeight: 1.4, letterSpacing: '-0.005em',
        color: PAPER.ink,
      }}>
        Você capturou <strong style={{ color: PAPER.accent, fontWeight: 400 }}>26 ideias</strong> essa semana — quase tudo de manhã, principalmente de <strong style={{ color: '#c0563a', fontWeight: 400 }}>trabalho</strong>. Seis viraram tarefa.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {['+30% manhãs', '6 → tarefa', 'streak 12d'].map((t, i) => (
          <span key={i} className="mono" style={{
            padding: '3px 10px', background: PAPER.bg,
            fontSize: 10, letterSpacing: '0.12em',
            color: PAPER.ink2, borderRadius: 999,
            border: `1px solid ${PAPER.hair}`,
            textTransform: 'uppercase',
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function PaperFeedMonday() {
  const items = [
    { kind: 'note', cat: { name: 'Trabalho', color: '#c0563a' }, time: '07:42',
      text: 'Começo da semana — relembrar dos OKRs antes da daily.' },
    { kind: 'task', cat: { name: 'Trabalho', color: '#c0563a' }, time: '08:10',
      text: 'Revisar PRs em aberto', when: 'Hoje, 11:00', done: false },
    { kind: 'note', cat: { name: 'Pessoal', color: '#3a8a6a' }, time: '08:30',
      text: 'O fim de semana foi devagar do jeito certo. Anotação pra lembrar.' },
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
      <PaperHeader sub="SEG · 5 MAI" title="Inbox" withHair />
      <PaperTabs
        active="all"
        tabs={[
          { id: 'all', label: 'Tudo', count: 4 },
          { id: 'tasks', label: 'Tarefas', count: 1 },
          { id: 'cats', label: 'Categorias', count: 6 },
        ]}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px 100px' }}>
        <PaperWeeklySummaryCard/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0 10px' }}>
          <div className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.14em' }}>
            HOJE · SEG 5 MAI
          </div>
          <div style={{ flex: 1, height: 1, background: PAPER.hair }}/>
        </div>

        {items.map((it, i) => {
          if (it.kind === 'task') {
            return (
              <div key={i} style={{
                background: PAPER.card,
                border: `1px solid ${PAPER.hair}`,
                borderRadius: 14,
                padding: '14px 14px 12px',
                marginBottom: 10,
                display: 'flex', gap: 12,
                boxShadow: PAPER.shadow,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: `1.5px solid ${PAPER.ink}`,
                  marginTop: 2, flexShrink: 0,
                }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, lineHeight: 1.45 }}>{it.text}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <CategoryChipPaper {...it.cat}/>
                    <span style={{ fontSize: 11.5, color: PAPER.ink2 }}>{it.when}</span>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={i} style={{
              padding: '10px 0 12px',
              borderBottom: `1px dashed ${PAPER.hair}`,
            }}>
              <div style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 19, lineHeight: 1.35,
              }}>{it.text}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <CategoryChipPaper {...it.cat}/>
                <PaperTime>{it.time}</PaperTime>
              </div>
            </div>
          );
        })}
      </div>

      <PaperComposer/>
    </div>
  );
}

// =============================================
// N-06 — paper-search (busca com 3 grupos) e paper-search-empty
// =============================================
function PaperSearchHeader({ query }) {
  return (
    <div style={{
      padding: '14px 20px 12px',
      borderBottom: `1px solid ${PAPER.hair}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <button style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(29,26,20,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PAPER.ink} strokeWidth="1.7" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', gap: 8,
        background: PAPER.card,
        border: `1px solid ${PAPER.hair}`,
        borderRadius: 12,
        padding: '8px 12px',
        fontSize: 14,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PAPER.ink2} strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <span style={{ color: PAPER.ink, flex: 1, minWidth: 0 }}>{query}</span>
        <span style={{
          display: 'inline-block', width: 1.5, height: 16,
          background: PAPER.accent, marginLeft: 2,
        }}/>
        <span style={{
          color: PAPER.ink3, fontSize: 12, marginLeft: 4,
          padding: '0 6px',
        }}>×</span>
      </div>
    </div>
  );
}

function PaperSearch() {
  const groups = [
    {
      label: 'Tarefas', count: 2, items: [
        { text: 'Confirmar reunião com cliente amanhã 10h', when: 'Amanhã, 10:00', cat: { name: 'Trabalho', color: '#c0563a' } },
        { text: 'Comprar pão amanhã de manhã', when: 'Amanhã, manhã', cat: { name: 'Casa', color: '#7a5cc7' } },
      ]
    },
    {
      label: 'Notas', count: 3, items: [
        { text: 'Lembrar de mandar mensagem pro João amanhã.', time: 'há 2h', cat: { name: 'Pessoal', color: '#3a8a6a' } },
        { text: '"Amanhã" em italiano é "domani" — coisa bonita.', time: '4d', cat: { name: 'Leitura', color: '#e6b540' } },
        { text: 'Ler um capítulo do livro novo amanhã antes de dormir.', time: '6d', cat: { name: 'Leitura', color: '#e6b540' } },
      ]
    },
    {
      label: 'Categorias', count: 0, items: []
    },
  ];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <PaperSearchHeader query="amanhã"/>

      <div style={{
        padding: '10px 20px',
        borderBottom: `1px solid ${PAPER.hair}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.14em' }}>
          5 RESULTADOS
        </span>
        <div style={{ flex: 1 }}/>
        <span className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.10em' }}>
          ↑↓ NAVEGAR
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 20px 30px' }}>
        {groups.map((g, gi) => (
          <div key={gi} style={{ marginBottom: 18 }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 8,
              padding: '8px 0 6px',
            }}>
              <span className="mono" style={{
                fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em',
              }}>{g.label.toUpperCase()}</span>
              <span className="mono" style={{
                fontSize: 10, color: PAPER.accent, letterSpacing: '0.1em',
              }}>{g.count}</span>
              <div style={{ flex: 1, height: 1, background: PAPER.hair }}/>
            </div>
            {g.items.length === 0 ? (
              <div style={{
                fontSize: 13, color: PAPER.ink3,
                fontStyle: 'italic', padding: '4px 0',
              }}>nenhum espaço com "amanhã"</div>
            ) : g.items.map((it, i) => {
              if (it.when) {
                return (
                  <div key={i} style={{
                    background: PAPER.card,
                    border: `1px solid ${PAPER.hair}`,
                    borderRadius: 12,
                    padding: '10px 12px',
                    marginBottom: 8,
                    display: 'flex', gap: 10,
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: `1.5px solid ${PAPER.ink}`,
                      marginTop: 2, flexShrink: 0,
                    }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, lineHeight: 1.4 }}>
                        {highlightWord(it.text, 'amanhã', PAPER.accent)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <CategoryChipPaper {...it.cat}/>
                        <span style={{ fontSize: 11, color: PAPER.ink2 }}>{it.when}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} style={{
                  padding: '10px 0',
                  borderBottom: i < g.items.length - 1 ? `1px dashed ${PAPER.hair}` : 'none',
                }}>
                  <div style={{
                    fontFamily: '"Instrument Serif", serif',
                    fontSize: 17, lineHeight: 1.35,
                  }}>
                    {highlightWord(it.text, 'amanhã', PAPER.accent, true)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <CategoryChipPaper {...it.cat}/>
                    <PaperTime>{it.time}</PaperTime>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function highlightWord(text, word, color, serif = false) {
  const re = new RegExp('(' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
  const parts = text.split(re);
  return parts.map((p, i) => {
    if (p.toLowerCase() === word.toLowerCase()) {
      return <mark key={i} style={{
        background: color + '22', color, padding: '0 2px',
        borderRadius: 3, fontStyle: serif ? 'italic' : 'inherit',
      }}>{p}</mark>;
    }
    return <span key={i}>{p}</span>;
  });
}

function PaperSearchEmpty() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <PaperSearchHeader query="banana"/>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px', gap: 18, textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: PAPER.card, border: `1px dashed ${PAPER.hair}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: PAPER.ink3,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        </div>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 26, lineHeight: 1.25, letterSpacing: '-0.01em',
        }}>
          Nada com <em style={{ fontStyle: 'italic', color: PAPER.accent }}>"banana"</em><br/>
          por aqui.
        </div>
        <div style={{ fontSize: 13, color: PAPER.ink2, lineHeight: 1.55, maxWidth: 280 }}>
          Tenta um termo mais curto, sem acento ou abre uma categoria pra navegar.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button style={{
            padding: '10px 16px', borderRadius: 999,
            background: PAPER.card, color: PAPER.ink,
            border: `1px solid ${PAPER.hair}`,
            fontSize: 13, fontWeight: 500,
          }}>Limpar busca</button>
          <button style={{
            padding: '10px 16px', borderRadius: 999,
            background: PAPER.ink, color: '#fff',
            fontSize: 13, fontWeight: 500,
          }}>Capturar "banana"</button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// N-12 — paper-empty-feed e paper-empty-tasks
// =============================================
function PaperEmptyFeed() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      <PaperHeader sub="QUI · 30 ABR" title="Hoje" withHair/>
      <PaperTabs
        active="all"
        tabs={[
          { id: 'all', label: 'Tudo', count: 0 },
          { id: 'tasks', label: 'Tarefas', count: 0 },
          { id: 'cats', label: 'Categorias', count: 0 },
        ]}
      />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px 100px', gap: 18, textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: PAPER.card, border: `1px dashed ${PAPER.hair}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: PAPER.accent,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M12 3v18M5 8h14M5 14h14"/></svg>
        </div>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 32, lineHeight: 1.18, letterSpacing: '-0.02em',
          maxWidth: 280,
        }}>
          Sua primeira ideia<br/>
          <span style={{ fontStyle: 'italic', color: PAPER.accent }}>mora aqui.</span>
        </div>
        <div style={{ fontSize: 13, color: PAPER.ink2, lineHeight: 1.55, maxWidth: 280 }}>
          Capture qualquer pensamento — vira nota ou tarefa, do jeito que você quiser.
        </div>
        <button style={{
          padding: '14px 24px', borderRadius: 14,
          background: PAPER.ink, color: '#fff',
          fontSize: 14, fontWeight: 600,
          marginTop: 6,
          boxShadow: '0 8px 24px -8px rgba(29,26,20,0.55)',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Capturar
        </button>
        <div className="mono" style={{
          fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em', marginTop: 4,
        }}>
          OU TOQUE NO + LÁ EMBAIXO
        </div>
      </div>

      <PaperComposer/>
    </div>
  );
}

function PaperEmptyTasks() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <PaperHeader sub="0 PENDENTES · FILTRO ATIVO" title="Tarefas"/>

      {/* Active filter chip */}
      <div style={{
        padding: '0 20px 10px',
        display: 'flex', gap: 8, alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <span className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.14em' }}>FILTRO:</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          background: PAPER.accent + '18',
          color: PAPER.accent,
          borderRadius: 999,
          fontSize: 12,
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '0.04em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 2, background: PAPER.accent }}/>
          trabalho
          <span style={{ marginLeft: 2, paddingLeft: 6, borderLeft: `1px solid ${PAPER.accent}55`, fontSize: 14 }}>×</span>
        </span>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px', gap: 16, textAlign: 'center',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: 18,
          background: PAPER.card, border: `1px solid ${PAPER.hair}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: PAPER.accent2,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 28, lineHeight: 1.2, letterSpacing: '-0.02em',
        }}>
          Nenhuma tarefa<br/>
          <span style={{ fontStyle: 'italic', color: PAPER.accent2 }}>por aqui.</span>
        </div>
        <div style={{ fontSize: 13, color: PAPER.ink2, lineHeight: 1.55, maxWidth: 260 }}>
          Suas tarefas de "trabalho" estão todas concluídas — ou você nunca colocou nenhuma.
        </div>
        <button style={{
          padding: '12px 22px', borderRadius: 12,
          background: PAPER.card, color: PAPER.ink,
          border: `1px solid ${PAPER.hair}`,
          fontSize: 13, fontWeight: 500,
          marginTop: 6,
        }}>Limpar filtro</button>
      </div>
    </div>
  );
}

// =============================================
// N-10 — paper-toast (4 variantes empilhadas, 390×400 pra mostrar todas)
// =============================================
function PaperToastShowcase() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      fontFamily: '"Geist", system-ui, sans-serif',
      padding: '24px 16px',
      display: 'flex', flexDirection: 'column', gap: 12,
      justifyContent: 'flex-end',
    }}>
      <div className="mono" style={{
        fontSize: 10, color: PAPER.ink3, letterSpacing: '0.14em',
        textAlign: 'center', marginBottom: 4,
      }}>4 VARIANTES · BOTTOM-CENTER MOBILE</div>

      {/* Success with undo action */}
      <PaperToast
        type="success"
        text="Tarefa criada"
        action="DESFAZER"
        timer={5}
      />

      {/* Info simple */}
      <PaperToast
        type="info"
        text="Categoria atualizada"
        timer={3}
      />

      {/* Danger with retry */}
      <PaperToast
        type="danger"
        text="Erro de rede ao salvar"
        action="TENTAR DE NOVO"
      />

      {/* Update sticky */}
      <PaperToast
        type="update"
        text="Nova versão"
        action="RECARREGAR"
        sticky
      />
    </div>
  );
}

function PaperToast({ type, text, action, timer, sticky }) {
  const tone = {
    success: { dot: '#3a8a6a', label: 'CONCLUÍDO' },
    info:    { dot: PAPER.ink, label: 'INFO' },
    danger:  { dot: PAPER.accent, label: 'ERRO' },
    update:  { dot: PAPER.accent2, label: 'ATUALIZAÇÃO' },
  }[type];

  return (
    <div style={{
      background: PAPER.ink,
      color: PAPER.bg,
      borderRadius: 14,
      padding: '12px 14px 12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 12px 32px -12px rgba(29,26,20,0.55), 0 1px 0 rgba(255,255,255,0.06) inset',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: 4,
        background: tone.dot, flexShrink: 0,
      }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.3, fontWeight: 500 }}>
          {text}
        </div>
        {sticky && (
          <div className="mono" style={{
            fontSize: 9.5, color: 'rgba(253,250,243,0.55)',
            letterSpacing: '0.14em', marginTop: 2,
          }}>{tone.label} DISPONÍVEL</div>
        )}
      </div>
      {action && (
        <button style={{
          padding: '4px 10px', borderRadius: 8,
          background: 'rgba(253,250,243,0.10)',
          color: tone.dot,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, fontWeight: 600,
          letterSpacing: '0.12em',
        }}>{action}</button>
      )}
      <span style={{
        color: 'rgba(253,250,243,0.5)', fontSize: 16,
        cursor: 'pointer', paddingLeft: 4,
      }}>×</span>
      {/* Progress bar bottom for timed */}
      {timer && (
        <div style={{
          position: 'absolute', left: 0, bottom: 0, height: 2,
          width: '60%',
          background: tone.dot,
          opacity: 0.6,
        }}/>
      )}
    </div>
  );
}

// =============================================
// N-11 — paper-offline (sticky banner)
// =============================================
function PaperOffline() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      fontFamily: '"Geist", system-ui, sans-serif',
      padding: '0',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div className="mono" style={{
        fontSize: 10, color: PAPER.ink3, letterSpacing: '0.14em',
        textAlign: 'center', padding: '20px 0 4px',
      }}>2 ESTADOS · OFFLINE / DE VOLTA</div>

      {/* Offline banner — amber, sticky top */}
      <div style={{ padding: '0 12px' }}>
        <div style={{
          background: '#e6b54012',
          border: '1px solid #e6b54044',
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: 4, background: '#e6b540',
            boxShadow: '0 0 0 4px #e6b54022',
            flexShrink: 0,
          }}/>
          <span className="mono" style={{
            fontSize: 11, letterSpacing: '0.12em',
            color: PAPER.ink, textTransform: 'uppercase',
          }}>· sem conexão ·</span>
          <span style={{ fontSize: 12, color: PAPER.ink2, flex: 1, minWidth: 0 }}>
            Suas alterações estão salvas localmente
          </span>
        </div>
      </div>

      {/* Back online — green, brief */}
      <div style={{ padding: '0 12px' }}>
        <div style={{
          background: '#3a8a6a12',
          border: '1px solid #3a8a6a44',
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: 4, background: '#3a8a6a',
            flexShrink: 0,
          }}/>
          <span className="mono" style={{
            fontSize: 11, letterSpacing: '0.12em',
            color: PAPER.ink, textTransform: 'uppercase',
          }}>· de volta online ✓</span>
          <span style={{ fontSize: 12, color: PAPER.ink2, flex: 1, minWidth: 0 }}>
            Sincronizando 3 alterações
          </span>
        </div>
      </div>

      <div className="mono" style={{
        fontSize: 9.5, color: PAPER.ink3, letterSpacing: '0.16em',
        padding: '12px 24px', textAlign: 'center', lineHeight: 1.7,
      }}>
        AMBER (#e6b540) ENQUANTO OFFLINE.<br/>
        VERDE (#3a8a6a) POR 2s AO VOLTAR, AÍ DESAPARECE.
      </div>
    </div>
  );
}

// =============================================
// N-07 — paper-context-sheet (long-press, bottom-sheet de ações)
// =============================================
function PaperContextSheet() {
  // Background: feed parcialmente visível, escurecido com backdrop
  const bgItem = (
    <div style={{
      background: PAPER.card,
      border: `1px solid ${PAPER.hair}`,
      borderRadius: 14,
      padding: '14px 14px 12px',
      marginBottom: 10,
      display: 'flex', gap: 12,
      boxShadow: PAPER.shadow,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6,
        border: `1.5px solid ${PAPER.ink}`,
        marginTop: 2, flexShrink: 0,
      }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, lineHeight: 1.45 }}>Revisar PR do refresh token rotation</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <CategoryChipPaper name="Trabalho" color="#c0563a"/>
          <span style={{ fontSize: 11.5, color: PAPER.ink2 }}>Hoje, 16:00</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Faded background */}
      <div style={{ filter: 'blur(0.5px)', opacity: 0.55, pointerEvents: 'none' }}>
        <PaperHeader sub="QUI · 30 ABR" title="Hoje" withHair/>
        <PaperTabs
          active="all"
          tabs={[
            { id: 'all', label: 'Tudo', count: 28 },
            { id: 'tasks', label: 'Tarefas', count: 4 },
            { id: 'cats', label: 'Categorias', count: 6 },
          ]}
        />
        <div style={{ padding: '12px 20px' }}>
          {bgItem}
          {bgItem}
        </div>
      </div>

      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(29,26,20,0.40)',
      }}/>

      {/* Sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: PAPER.card,
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -16px 48px -12px rgba(29,26,20,0.45)',
        padding: '14px 0 calc(env(safe-area-inset-bottom) + 18px)',
      }}>
        {/* Drag handle */}
        <div style={{
          width: 40, height: 4, background: PAPER.hair,
          borderRadius: 2, margin: '0 auto 14px',
        }}/>

        {/* Selected item preview */}
        <div style={{
          padding: '0 20px 12px',
          borderBottom: `1px solid ${PAPER.hair}`,
        }}>
          <div className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em', marginBottom: 6 }}>
            AÇÕES NA TAREFA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: '#c0563a' }}/>
            <div style={{
              fontSize: 14, color: PAPER.ink2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>Revisar PR do refresh token rotation</div>
          </div>
        </div>

        {/* Action rows */}
        <div style={{ padding: '4px 0' }}>
          {[
            { icon: 'edit',     label: 'Editar' },
            { icon: 'cat',      label: 'Mudar categoria',  trail: 'Trabalho', trailColor: '#c0563a' },
            { icon: 'date',     label: 'Mudar prazo',      trail: 'Hoje 16:00' },
            { icon: 'copy',     label: 'Copiar texto' },
            { icon: 'share',    label: 'Compartilhar' },
            { icon: 'archive',  label: 'Arquivar' },
            { icon: 'trash',    label: 'Excluir',          danger: true },
          ].map((a, i, arr) => (
            <PaperContextRow key={i} {...a} last={i === arr.length - 1}/>
          ))}
        </div>

        {/* Cancel */}
        <div style={{ padding: '12px 20px 0' }}>
          <button style={{
            width: '100%', padding: 14,
            background: PAPER.bg, color: PAPER.ink,
            border: `1px solid ${PAPER.hair}`,
            borderRadius: 12,
            fontSize: 14, fontWeight: 500,
          }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function PaperContextRow({ icon, label, trail, trailColor, danger, last }) {
  const ic = {
    edit:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 20h9M16.5 3.5a2 2 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>,
    cat:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 7h18l-2 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L3 7zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    date:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
    copy:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>,
    share:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="m8.5 13.5 7 4M15.5 6.5l-7 4"/></svg>,
    archive: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4"/></svg>,
    trash:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/></svg>,
  }[icon];

  return (
    <div style={{
      padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
      borderBottom: last ? 'none' : `1px solid ${PAPER.hair}`,
      color: danger ? '#c0563a' : PAPER.ink,
    }}>
      <div style={{ color: danger ? '#c0563a' : PAPER.ink2, flexShrink: 0 }}>{ic}</div>
      <div style={{ flex: 1, fontSize: 14 }}>{label}</div>
      {trail && (
        <span style={{
          fontSize: 11.5, color: trailColor || PAPER.ink2,
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '0.04em',
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          {trailColor && <span style={{ width: 6, height: 6, borderRadius: 2, background: trailColor }}/>}
          {trail}
        </span>
      )}
      {!trail && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={PAPER.ink3} strokeWidth="1.7" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
      )}
    </div>
  );
}

// =============================================
// N-08 — paper-edit (Nota|Tarefa segmented + datepicker inline + cat inline)
// =============================================
function PaperEdit() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Backdrop layer (faded) */}
      <div style={{ filter: 'blur(0.5px)', opacity: 0.45, pointerEvents: 'none' }}>
        <PaperHeader sub="QUI · 30 ABR" title="Hoje" withHair/>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(29,26,20,0.42)' }}/>

      {/* Edit sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: 60,
        background: PAPER.card,
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -16px 48px -12px rgba(29,26,20,0.45)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle + title */}
        <div style={{ padding: '12px 0' }}>
          <div style={{ width: 40, height: 4, background: PAPER.hair, borderRadius: 2, margin: '0 auto' }}/>
        </div>
        <div style={{
          padding: '0 20px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${PAPER.hair}`,
        }}>
          <button style={{
            fontSize: 13, color: PAPER.ink2,
            background: 'transparent',
          }}>Cancelar</button>
          <span className="mono" style={{
            fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em',
          }}>EDITAR</span>
          <button style={{
            fontSize: 13, color: PAPER.accent, fontWeight: 600,
            background: 'transparent',
          }}>Salvar</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 24px' }}>
          {/* Type segmented control */}
          <div style={{ marginBottom: 18 }}>
            <div className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em', marginBottom: 8 }}>
              TIPO
            </div>
            <div style={{
              display: 'inline-flex',
              padding: 3,
              background: PAPER.bg,
              border: `1px solid ${PAPER.hair}`,
              borderRadius: 999,
              gap: 2,
            }}>
              <button style={{
                padding: '8px 18px', borderRadius: 999,
                background: 'transparent',
                color: PAPER.ink3, fontSize: 13, fontWeight: 500,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                Nota
              </button>
              <button style={{
                padding: '8px 18px', borderRadius: 999,
                background: PAPER.ink, color: '#fff',
                fontSize: 13, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/></svg>
                Tarefa
              </button>
            </div>
          </div>

          {/* Text */}
          <div style={{ marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em', marginBottom: 8 }}>
              TEXTO
            </div>
            <div style={{
              padding: '12px 14px',
              background: PAPER.bg,
              border: `1px solid ${PAPER.hair}`,
              borderRadius: 12,
              fontSize: 15, lineHeight: 1.45,
              color: PAPER.ink, minHeight: 64,
            }}>
              Revisar PR do refresh token rotation
              <span style={{ display: 'inline-block', width: 1.5, height: 16, background: PAPER.accent, marginLeft: 2, verticalAlign: 'middle' }}/>
            </div>
          </div>

          {/* Categoria inline picker */}
          <div style={{ marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em', marginBottom: 8 }}>
              CATEGORIA
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { name: 'Trabalho', color: '#c0563a', active: true },
                { name: 'Pessoal', color: '#3a8a6a' },
                { name: 'Casa', color: '#7a5cc7' },
                { name: 'Leitura', color: '#e6b540' },
                { name: 'Ideias', color: '#1d4ed8' },
                { name: 'Saúde', color: '#d96fa0' },
              ].map((c, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px',
                  background: c.active ? c.color + '20' : PAPER.bg,
                  border: `1px solid ${c.active ? c.color + '55' : PAPER.hair}`,
                  borderRadius: 999,
                  fontSize: 12.5,
                  color: c.active ? c.color : PAPER.ink2,
                  fontWeight: c.active ? 600 : 500,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: c.color }}/>
                  {c.name}
                </span>
              ))}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 12px',
                background: 'transparent',
                border: `1px dashed ${PAPER.hair}`,
                borderRadius: 999,
                fontSize: 12.5, color: PAPER.ink3,
              }}>+ nova</span>
            </div>
          </div>

          {/* Quando: quick chips */}
          <div style={{ marginBottom: 14 }}>
            <div className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em', marginBottom: 8 }}>
              QUANDO
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {[
                { label: 'Hoje', active: true },
                { label: 'Amanhã' },
                { label: 'Sex 17h' },
                { label: 'Próxima seg' },
                { label: 'Sem prazo' },
              ].map((q, i) => (
                <span key={i} style={{
                  padding: '6px 12px', borderRadius: 999,
                  background: q.active ? PAPER.ink : PAPER.bg,
                  border: q.active ? 'none' : `1px solid ${PAPER.hair}`,
                  color: q.active ? '#fff' : PAPER.ink2,
                  fontSize: 12.5, fontWeight: 500,
                }}>{q.label}</span>
              ))}
            </div>

            {/* Inline mini-calendar */}
            <PaperMiniCalendar selectedDay={30} hour="16:00"/>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaperMiniCalendar({ selectedDay, hour }) {
  const dows = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  // April 2026 starts on Wednesday (day 3); 30 days
  const startOffset = 3;
  const daysInMonth = 30;
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{
      background: PAPER.bg,
      border: `1px solid ${PAPER.hair}`,
      borderRadius: 12,
      padding: 12,
    }}>
      {/* Month nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <button style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'transparent', color: PAPER.ink2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 18, letterSpacing: '-0.01em',
        }}>Abril 2026</div>
        <button style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'transparent', color: PAPER.ink2,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {/* DOW header */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0,
        marginBottom: 4,
      }}>
        {dows.map((d, i) => (
          <div key={i} className="mono" style={{
            fontSize: 9, color: PAPER.ink3, letterSpacing: '0.10em',
            textAlign: 'center', padding: '4px 0',
          }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2,
      }}>
        {cells.map((d, i) => {
          if (d == null) return <div key={i} style={{ height: 30 }}/>;
          const sel = d === selectedDay;
          const today = d === 30; // mock today = 30
          return (
            <div key={i} style={{
              height: 30, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12,
              background: sel ? PAPER.accent : 'transparent',
              color: sel ? '#fff' : (today ? PAPER.accent : PAPER.ink),
              fontWeight: sel || today ? 600 : 400,
              border: today && !sel ? `1px solid ${PAPER.accent}` : 'none',
            }}>{d}</div>
          );
        })}
      </div>

      {/* Time row */}
      <div style={{
        marginTop: 12, paddingTop: 12,
        borderTop: `1px dashed ${PAPER.hair}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.14em' }}>HORA</span>
        <span style={{
          padding: '4px 10px', borderRadius: 8,
          background: PAPER.card, border: `1px solid ${PAPER.hair}`,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 13, color: PAPER.ink,
        }}>{hour}</span>
        <div style={{ flex: 1 }}/>
        <span style={{ fontSize: 11, color: PAPER.ink3 }}>15min antes lembrete</span>
      </div>
    </div>
  );
}

// =============================================
// N-09 — paper-color-picker (grid 6×2 com selecionado)
// =============================================
function PaperColorPicker() {
  const palette = [
    '#c0563a', '#e6b540', '#3a8a6a', '#7a5cc7', '#5b8cff',
    '#d96fa0', '#1d4ed8', '#ff8a5b', '#5cd6c0', '#ff6b9d',
    '#7c5cff', '#f0b95c',
  ];
  const selected = '#c0563a';

  return (
    <div style={{
      width: '100%', height: '100%',
      background: PAPER.bg,
      color: PAPER.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      <div style={{
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${PAPER.hair}`,
      }}>
        <button style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(29,26,20,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PAPER.ink} strokeWidth="1.7" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em' }}>EDITAR CATEGORIA</div>
        <div style={{ width: 36 }}/>
      </div>

      <div style={{ flex: 1, padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Preview */}
        <div style={{
          background: PAPER.card,
          border: `1px solid ${PAPER.hair}`,
          borderRadius: 16,
          padding: 18,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: PAPER.shadow,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: selected,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Instrument Serif", serif',
            fontSize: 28, color: '#fff',
            transition: 'background 200ms',
          }}>T</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>Trabalho</div>
            <div className="mono" style={{ fontSize: 11, color: PAPER.ink3, letterSpacing: '0.06em' }}>
              42 NOTAS · 8 TAREFAS
            </div>
          </div>
        </div>

        {/* Name field */}
        <div>
          <div className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em', marginBottom: 6 }}>
            NOME
          </div>
          <div style={{
            padding: '10px 14px',
            background: PAPER.card, border: `1px solid ${PAPER.hair}`,
            borderRadius: 10, fontSize: 15,
          }}>
            Trabalho
            <span style={{
              display: 'inline-block', width: 1.5, height: 16,
              background: PAPER.accent, marginLeft: 2, verticalAlign: 'middle',
            }}/>
          </div>
        </div>

        {/* Color grid 6×2 */}
        <div>
          <div className="mono" style={{ fontSize: 10, color: PAPER.ink3, letterSpacing: '0.16em', marginBottom: 12 }}>
            COR
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 14,
            justifyItems: 'center',
          }}>
            {palette.map((c, i) => {
              const isSel = c === selected;
              return (
                <div key={i} style={{
                  position: 'relative',
                  width: 40, height: 40,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: c,
                    transform: isSel ? 'scale(1.10)' : 'scale(1)',
                    boxShadow: isSel ? `0 0 0 2px ${PAPER.bg}, 0 0 0 4px ${PAPER.ink}` : 'none',
                    transition: 'transform 200ms, box-shadow 200ms',
                  }}/>
                  {isSel && (
                    <span style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 18, height: 18, borderRadius: 9,
                      background: PAPER.ink,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6.5L5 9L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1 }}/>

        <button style={{
          padding: 14, borderRadius: 12,
          background: PAPER.ink, color: '#fff',
          fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>Salvar mudanças</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  PaperFeed, PaperFeedTyping, PaperCategories, PaperTasks,
  PaperBottomNav, PaperFeedWithNav,
  PaperFocus, PaperFocusPomodoro, PaperFocusEmpty,
  PaperCatSpace, PaperMobileDash,
  PaperFeedMonday, PaperWeeklySummaryCard,
  PaperSearch, PaperSearchEmpty,
  PaperEmptyFeed, PaperEmptyTasks,
  PaperToastShowcase, PaperOffline,
  PaperContextSheet, PaperEdit, PaperColorPicker, PaperMiniCalendar,
  PAPER,
});
