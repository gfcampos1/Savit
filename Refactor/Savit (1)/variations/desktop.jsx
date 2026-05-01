// Desktop reimagining — three-column Linear-inspired layout
// Left: nav. Middle: feed. Right: contextual detail.

const D = LINEAR; // reuse Linear palette

function DesktopChrome({ children, page = 'home' }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: D.bg,
      color: D.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      fontSize: 13,
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      overflow: 'hidden',
    }}>
      <DesktopSidebar page={page}/>
      <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${D.hair}`, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}

function DesktopSidebar({ page }) {
  const items = [
    { id: 'home', icon: 'home', label: 'Inbox', count: 28 },
    { id: 'today', icon: 'today', label: 'Hoje', count: 4 },
    { id: 'tasks', icon: 'task', label: 'Tarefas', count: 5 },
    { id: 'dash', icon: 'chart', label: 'Dashboard' },
  ];
  const cats = [
    { name: 'trabalho', color: D.accent, count: 42 },
    { name: 'pessoal', color: D.green, count: 28 },
    { name: 'casa', color: '#a78bfa', count: 19 },
    { name: 'leitura', color: D.amber, count: 14 },
    { name: 'ideias', color: '#5b8cff', count: 11 },
    { name: 'saúde', color: '#ff8aa3', count: 6 },
  ];
  const ic = (id) => ({
    home: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>,
    today: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
    task: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/></svg>,
    chart: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 21V3M3 21h18M8 17v-5M13 17v-9M18 17V9"/></svg>,
  }[id]);

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', padding: 10, gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px 12px' }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: `linear-gradient(135deg, ${D.accent}, ${D.accentDim})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff',
        }}>S</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Savit</div>
        <div style={{ flex: 1 }}/>
        <span className="mono" style={{
          fontSize: 9, color: D.ink3, padding: '1px 5px',
          border: `1px solid ${D.hair}`, borderRadius: 3,
        }}>v2</span>
      </div>

      <div style={{
        margin: '0 0 10px',
        padding: '6px 10px',
        background: D.surf,
        border: `1px solid ${D.hair}`,
        borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, color: D.ink3,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        Buscar ou capturar…
        <div style={{ flex: 1 }}/>
        <span className="mono" style={{ fontSize: 9, color: D.ink3 }}>⌘K</span>
      </div>

      {items.map(it => (
        <div key={it.id} style={{
          padding: '6px 10px', borderRadius: 6,
          background: it.id === page ? D.surfHi : 'transparent',
          color: it.id === page ? D.ink : D.ink2,
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13,
        }}>
          {ic(it.icon)}
          <span style={{ flex: 1 }}>{it.label}</span>
          {it.count != null && <span className="mono" style={{ fontSize: 11, color: D.ink3 }}>{it.count}</span>}
        </div>
      ))}

      <div className="mono" style={{
        padding: '14px 10px 4px',
        fontSize: 9, color: D.ink3, letterSpacing: '0.14em',
      }}>CATEGORIAS</div>

      {cats.map(c => (
        <div key={c.name} style={{
          padding: '5px 10px', borderRadius: 6,
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, color: D.ink2,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: 2, background: c.color }}/>
          <span style={{ flex: 1 }}>{c.name}</span>
          <span className="mono" style={{ fontSize: 11, color: D.ink3 }}>{c.count}</span>
        </div>
      ))}

      <div style={{ flex: 1 }}/>

      <div style={{
        padding: '8px 10px',
        borderTop: `1px solid ${D.hair}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: D.accent, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: '#fff',
        }}>B</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>Bia Souza</div>
          <div style={{ fontSize: 10, color: D.ink3 }}>Free · 12 dias streak</div>
        </div>
      </div>
    </aside>
  );
}

function DesktopHeader({ title, sub, right }) {
  return (
    <div style={{
      padding: '12px 20px',
      borderBottom: `1px solid ${D.hair}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
        {sub && <div className="mono" style={{ fontSize: 10, color: D.ink3, letterSpacing: '0.08em' }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function DesktopHome() {
  const items = [
    { id: 'SAV-128', text: 'Pensar num nome melhor pra feature de export.', cat: 'trabalho', color: D.accent, time: '09:42', isTask: false, sel: false },
    { id: 'SAV-127', text: 'Revisar PR do refresh token rotation', cat: 'trabalho', color: D.accent, time: '10:15', isTask: true, due: 'Hoje 16:00', sel: true, priority: 'P0' },
    { id: 'SAV-126', text: 'O café da Inhotim era melhor do que eu lembrava.', cat: 'pessoal', color: D.green, time: '12:08', isTask: false },
    { id: 'SAV-125', text: 'Trocar a lâmpada da sala', cat: 'casa', color: '#a78bfa', time: '13:30', isTask: true, due: 'Sex 1/5', done: true },
    { id: 'SAV-124', text: '"O que você protege com sua atenção?" — Tchekhov.', cat: 'leitura', color: D.amber, time: '21:14', isTask: false },
    { id: 'SAV-123', text: 'App de pomodoro mas que valoriza pausas, não foco.', cat: 'ideias', color: '#5b8cff', time: '08:14', isTask: false },
    { id: 'SAV-122', text: 'Sem categoria por enquanto. Voltar nessa amanhã.', cat: null, color: D.ink3, time: '22:01', isTask: false },
  ];
  return (
    <DesktopChrome page="home">
      <div style={{
        flex: 1,
        display: 'grid', gridTemplateColumns: '1fr 360px',
        minHeight: 0,
      }}>
        {/* Middle column */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <DesktopHeader
            title="Inbox"
            sub="QUI 30 ABR · 28 ITENS · 4 TAREFAS"
            right={
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{
                  padding: '6px 10px', borderRadius: 6,
                  background: D.surf, border: `1px solid ${D.hair}`,
                  fontSize: 12, color: D.ink2,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M9 18h6"/></svg>
                  Filtrar
                </button>
                <button style={{
                  padding: '6px 10px', borderRadius: 6,
                  background: D.accent, color: '#fff',
                  fontSize: 12, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                  Capturar
                </button>
              </div>
            }
          />

          <div style={{ flex: 1, overflow: 'auto' }}>
            {items.map((it, i) => (
              <div key={i} style={{
                padding: '10px 20px',
                borderBottom: `1px solid ${D.hair}`,
                background: it.sel ? 'rgba(124,139,245,0.06)' : 'transparent',
                borderLeft: it.sel ? `2px solid ${D.accent}` : '2px solid transparent',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <div style={{ width: 16, marginTop: 2, flexShrink: 0 }}>
                  {it.isTask ? (
                    it.done ? (
                      <div style={{
                        width: 14, height: 14, borderRadius: 4,
                        background: D.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5L5 9L9.5 3.5" stroke="#0a0c10" strokeWidth="2" strokeLinecap="round"/></svg>
                      </div>
                    ) : (
                      <div style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${D.ink3}` }}/>
                    )
                  ) : (
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: it.color, display: 'inline-block', marginTop: 4, marginLeft: 4 }}/>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, lineHeight: 1.45,
                    color: it.done ? D.ink3 : D.ink,
                    textDecoration: it.done ? 'line-through' : 'none',
                  }}>{it.text}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 11 }}>
                    <span className="mono" style={{ color: D.ink3 }}>{it.id}</span>
                    {it.cat && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: D.ink2 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 2, background: it.color }}/>
                        {it.cat}
                      </span>
                    )}
                    {it.due && <span style={{ color: D.ink2 }}>· {it.due}</span>}
                    {it.priority && <span className="mono" style={{ color: D.red, fontSize: 10 }}>· {it.priority}</span>}
                    <div style={{ flex: 1 }}/>
                    <span className="mono" style={{ color: D.ink3, fontSize: 10 }}>{it.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            borderTop: `1px solid ${D.hair}`,
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            background: D.surf,
          }}>
            <span className="mono" style={{
              fontSize: 10, padding: '2px 6px', background: D.surfHi,
              border: `1px solid ${D.hairHi}`, borderRadius: 4, color: D.ink2,
            }}>⌘N</span>
            <div style={{ flex: 1, fontSize: 13, color: D.ink3 }}>
              Capture com texto natural. Ex: <span className="mono" style={{ color: D.accent }}>amanhã 9h #trabalho</span>
            </div>
          </div>
        </div>

        {/* Right detail column */}
        <DesktopDetail/>
      </div>
    </DesktopChrome>
  );
}

function DesktopDetail() {
  return (
    <aside style={{
      borderLeft: `1px solid ${D.hair}`,
      display: 'flex', flexDirection: 'column',
      background: D.surf,
      minWidth: 0,
    }}>
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${D.hair}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span className="mono" style={{ fontSize: 10, color: D.ink3 }}>SAV-127</span>
        <div style={{ flex: 1 }}/>
        <span className="mono" style={{ fontSize: 10, color: D.red, padding: '1px 5px', border: `1px solid ${D.red}33`, borderRadius: 3 }}>P0</span>
      </div>

      <div style={{ padding: 18 }}>
        <div style={{
          fontSize: 18, fontWeight: 500, lineHeight: 1.35, letterSpacing: '-0.005em',
        }}>Revisar PR do refresh token rotation</div>
        <div style={{
          marginTop: 8, fontSize: 12.5, color: D.ink2, lineHeight: 1.55,
        }}>
          Olhar com atenção os edge cases de rotação. O Pedro deixou um TODO sobre Redis e múltiplas instâncias.
        </div>
      </div>

      <div style={{ padding: '0 18px 18px' }}>
        <PropRow label="Status" value={<Status color={D.amber} text="Em aberto"/>}/>
        <PropRow label="Categoria" value={<Status color={D.accent} text="trabalho"/>}/>
        <PropRow label="Prazo" value={<span style={{ fontSize: 12 }}>Hoje · <span style={{ color: D.amber }}>16:00</span></span>}/>
        <PropRow label="Lembrete" value={<span style={{ fontSize: 12, color: D.ink2 }}>15min antes</span>}/>
        <PropRow label="Capturado" value={<span className="mono" style={{ fontSize: 11, color: D.ink3 }}>10:15 · 30 abr</span>}/>
      </div>

      <div style={{
        margin: '0 18px',
        height: 1, background: D.hair,
      }}/>

      <div style={{ padding: 18, fontSize: 12 }}>
        <div className="mono" style={{ fontSize: 10, color: D.ink3, letterSpacing: '0.12em', marginBottom: 8 }}>
          RELACIONADAS
        </div>
        <RelatedRow text="Anotação sobre rate-limit consistency" cat="trabalho" color={D.accent}/>
        <RelatedRow text="Notas da reunião com Pedro" cat="trabalho" color={D.accent}/>
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{
        padding: 12, borderTop: `1px solid ${D.hair}`,
        display: 'flex', gap: 6,
      }}>
        <button style={{
          flex: 1, padding: '8px 10px', borderRadius: 6,
          background: D.green, color: '#0a0c10',
          fontSize: 12, fontWeight: 500,
        }}>Concluir</button>
        <button style={{
          padding: '8px 10px', borderRadius: 6,
          background: D.surfHi, color: D.ink2, border: `1px solid ${D.hairHi}`,
          fontSize: 12,
        }}>Adiar</button>
        <button style={{
          padding: '8px 10px', borderRadius: 6,
          background: D.surfHi, color: D.ink2, border: `1px solid ${D.hairHi}`,
          fontSize: 12,
        }}>···</button>
      </div>
    </aside>
  );
}

function PropRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '6px 0', fontSize: 12,
    }}>
      <div style={{ width: 80, color: D.ink3 }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}

function Status({ color, text }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '2px 8px', borderRadius: 4,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${D.hair}`,
      fontSize: 11.5, color: D.ink,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 2, background: color }}/>
      {text}
    </span>
  );
}

function RelatedRow({ text, cat, color }) {
  return (
    <div style={{
      padding: '8px 0', borderTop: `1px solid ${D.hair}`,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color }}/>
      <span style={{ fontSize: 12.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
      <span style={{ fontSize: 10, color: D.ink3 }}>{cat}</span>
    </div>
  );
}

function DesktopTasks() {
  const cols = [
    { title: 'Hoje', count: 2, color: D.amber, tasks: [
      { text: 'Revisar PR do refresh token rotation', cat: 'trabalho', color: D.accent, time: '16:00', priority: 'P0' },
      { text: 'Ligar pro João', cat: 'pessoal', color: D.green, time: '18:30' },
    ]},
    { title: 'Amanhã', count: 2, color: D.accent, tasks: [
      { text: 'Trocar a lâmpada da sala', cat: 'casa', color: '#a78bfa', time: 'manhã' },
      { text: 'Comprar pão', cat: 'casa', color: '#a78bfa', time: 'manhã', done: true },
    ]},
    { title: 'Esta semana', count: 1, color: D.ink2, tasks: [
      { text: 'Dentista', cat: 'saúde', color: '#ff8aa3', time: 'qua 14h' },
    ]},
    { title: 'Sem prazo', count: 3, color: D.ink3, tasks: [
      { text: 'Estudar regex avançado', cat: 'trabalho', color: D.accent },
      { text: 'Comprar presente da Lu', cat: 'pessoal', color: D.green },
      { text: 'Ler "Slow Productivity"', cat: 'leitura', color: D.amber },
    ]},
  ];

  return (
    <DesktopChrome page="tasks">
      <DesktopHeader
        title="Tarefas"
        sub="5 PENDENTES · 1 CONCLUÍDA · STREAK 12 DIAS"
        right={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{
              padding: '4px 8px', borderRadius: 6,
              background: D.surf, border: `1px solid ${D.hair}`,
              display: 'flex', gap: 2, fontSize: 11,
            }}>
              <span style={{ padding: '3px 8px', borderRadius: 4, background: D.surfHi, color: D.ink }}>Quadro</span>
              <span style={{ padding: '3px 8px', color: D.ink2 }}>Lista</span>
              <span style={{ padding: '3px 8px', color: D.ink2 }}>Calendário</span>
            </div>
            <button style={{
              padding: '6px 10px', borderRadius: 6,
              background: D.accent, color: '#fff',
              fontSize: 12, fontWeight: 500,
            }}>+ Tarefa</button>
          </div>
        }
      />

      <div style={{
        flex: 1, padding: 16,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
        overflow: 'hidden',
      }}>
        {cols.map((col, i) => (
          <div key={i} style={{
            background: D.surf,
            border: `1px solid ${D.hair}`,
            borderRadius: 10,
            display: 'flex', flexDirection: 'column',
            minHeight: 0,
          }}>
            <div style={{
              padding: '10px 12px',
              borderBottom: `1px solid ${D.hair}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: col.color }}/>
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{col.title}</span>
              <span className="mono" style={{ fontSize: 10, color: D.ink3 }}>{col.count}</span>
              <div style={{ flex: 1 }}/>
              <span style={{ color: D.ink3, fontSize: 14 }}>+</span>
            </div>
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
              {col.tasks.map((t, j) => (
                <div key={j} style={{
                  background: D.surf2,
                  border: `1px solid ${D.hair}`,
                  borderRadius: 7,
                  padding: 10,
                  opacity: t.done ? 0.5 : 1,
                }}>
                  <div style={{
                    fontSize: 12.5, lineHeight: 1.4,
                    textDecoration: t.done ? 'line-through' : 'none',
                  }}>{t.text}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 11 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: D.ink2 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 2, background: t.color }}/>
                      {t.cat}
                    </span>
                    {t.time && <span style={{ color: D.ink3 }}>· {t.time}</span>}
                    <div style={{ flex: 1 }}/>
                    {t.priority && <span className="mono" style={{ color: D.red, fontSize: 10 }}>{t.priority}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DesktopChrome>
  );
}

function DesktopDash() {
  return (
    <DesktopChrome page="dash">
      <DesktopHeader title="Dashboard" sub="ÚLTIMOS 30 DIAS · COMPARADO COM MARÇO"/>

      <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Kpi label="CAPTURADAS" value="128" delta="+24% vs. mar"/>
          <Kpi label="CONCLUÍDAS" value="84" delta="+12%"/>
          <Kpi label="PENDENTES" value="14" delta="-3 vs. mar"/>
          <Kpi label="STREAK" value="12d" delta="seu recorde"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 12 }}>
          {/* Activity */}
          <Card title="Atividade" sub="POR DIA">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140 }}>
              {[3,5,2,8,6,9,4,7,11,8,5,12,9,14,10,6,8,11,7,13,9,16,12,8,11,14,10,9,7,12].map((v, i) => (
                <div key={i} style={{
                  flex: 1, height: `${v * 6}%`,
                  background: i >= 27 ? D.accent : (i >= 20 ? D.accentDim : D.surfHi),
                  borderRadius: 2,
                }}/>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span className="mono" style={{ fontSize: 10, color: D.ink3 }}>1 ABR</span>
              <span className="mono" style={{ fontSize: 10, color: D.ink3 }}>HOJE</span>
            </div>
          </Card>

          <Card title="Top categorias" sub="DISTRIBUIÇÃO">
            {[
              { name: 'trabalho', count: 42, pct: 0.85, color: D.accent },
              { name: 'pessoal', count: 28, pct: 0.55, color: D.green },
              { name: 'casa', count: 19, pct: 0.38, color: '#a78bfa' },
              { name: 'leitura', count: 14, pct: 0.28, color: D.amber },
              { name: 'ideias', count: 11, pct: 0.22, color: '#5b8cff' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: c.color }}/>
                <div style={{ width: 64, fontSize: 12 }}>{c.name}</div>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: D.surfHi, overflow: 'hidden' }}>
                  <div style={{ width: `${c.pct * 100}%`, height: '100%', background: c.color }}/>
                </div>
                <div className="mono" style={{ fontSize: 11, color: D.ink2, width: 24, textAlign: 'right' }}>{c.count}</div>
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <Card title="Quando você captura" sub="HORA × DIA">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Array.from({ length: 7 }).map((_, r) => (
                <div key={r} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <div style={{ width: 26, fontSize: 10, color: D.ink3 }} className="mono">
                    {['SEG','TER','QUA','QUI','SEX','SÁB','DOM'][r]}
                  </div>
                  {Array.from({ length: 24 }).map((__, c) => {
                    const v = Math.max(0, Math.sin((r + c * 0.4) * 0.7) * 0.5 + Math.random() * 0.4);
                    return (
                      <div key={c} style={{
                        flex: 1, height: 16, borderRadius: 2,
                        background: v > 0.7 ? D.accent : v > 0.45 ? D.accentDim : v > 0.2 ? D.surfHi : 'rgba(255,255,255,0.025)',
                      }}/>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Resumo da semana" sub="EDITORIAL · TODA SEGUNDA">
            <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, lineHeight: 1.3, color: D.ink }}>
              Você capturou <span style={{ color: D.accent }}>26 ideias</span> essa semana — quase tudo de manhã, e principalmente de trabalho. Seis viraram tarefa.
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['+30% manhãs', '6 viraram tarefa', '2 categorias dominam', 'streak 12d'].map((t, i) => (
                <span key={i} style={{
                  padding: '4px 10px', borderRadius: 999,
                  background: D.surfHi, border: `1px solid ${D.hair}`,
                  fontSize: 11, color: D.ink2,
                }}>{t}</span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DesktopChrome>
  );
}

function Card({ title, sub, children }) {
  return (
    <div style={{
      background: D.surf,
      border: `1px solid ${D.hair}`,
      borderRadius: 10,
      padding: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
        {sub && <div className="mono" style={{ fontSize: 10, color: D.ink3, letterSpacing: '0.08em' }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

Object.assign(window, { DesktopHome, DesktopTasks, DesktopDash });
