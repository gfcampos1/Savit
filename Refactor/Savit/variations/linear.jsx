// Variation C — Linear/Tech: dense, dark, blue-gray. Power-user feel.

const LINEAR = {
  bg: '#0a0c10',
  surf: '#0f1218',
  surf2: '#161922',
  surfHi: '#1c2030',
  ink: '#e6e8ec',
  ink2: '#9097a6',
  ink3: '#5a6172',
  hair: 'rgba(255,255,255,0.06)',
  hairHi: 'rgba(255,255,255,0.10)',
  accent: '#7c8bf5',
  accentDim: '#4d5db5',
  green: '#5cd49c',
  amber: '#f0b95c',
  red: '#f06c7c',
};

function LinearShell({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: LINEAR.bg,
      color: LINEAR.ink,
      fontFamily: '"Geist", system-ui, sans-serif',
      fontSize: 13.5,
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>{children}</div>
  );
}

function LinearTopBar({ title, subtitle, right }) {
  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: `1px solid ${LINEAR.hair}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background: LINEAR.surfHi,
        border: `1px solid ${LINEAR.hairHi}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        backgroundImage: `linear-gradient(135deg, ${LINEAR.accent}, ${LINEAR.accentDim})`,
        color: '#fff',
      }}>S</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em' }}>{title}</div>
        {subtitle && <div className="mono" style={{ fontSize: 10, color: LINEAR.ink3, letterSpacing: '0.06em' }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function LinearFeed() {
  const items = [
    { id: 'SAV-128', text: 'Pensar num nome melhor pra feature de export.', cat: 'work', priority: 'low', time: '09:42', isTask: false },
    { id: 'SAV-127', text: 'Revisar PR do refresh token rotation', cat: 'work', priority: 'high', time: '10:15', isTask: true, due: 'Hoje 16:00', status: 'todo' },
    { id: 'SAV-126', text: 'O café da Inhotim era melhor do que eu lembrava.', cat: 'personal', time: '12:08', isTask: false },
    { id: 'SAV-125', text: 'Trocar a lâmpada da sala', cat: 'home', time: '13:30', isTask: true, due: 'Sex 1/5', status: 'done' },
    { id: 'SAV-124', text: '"O que você protege com sua atenção?" — Tchekhov.', cat: 'reading', time: '21:14', isTask: false },
    { id: 'SAV-123', text: 'Sem categoria por enquanto. Voltar nessa amanhã.', cat: null, time: '22:01', isTask: false },
    { id: 'SAV-122', text: 'App de pomodoro mas que valoriza pausas, não foco.', cat: 'ideas', time: '08:14', isTask: false },
    { id: 'SAV-121', text: 'Dentista', cat: 'health', time: '07:30', isTask: true, due: 'Qua 6/5 14h', status: 'todo' },
  ];

  const catColor = {
    work: LINEAR.accent, personal: LINEAR.green, home: '#a78bfa',
    reading: LINEAR.amber, ideas: '#5b8cff', health: '#ff8aa3',
  };
  const catLabel = {
    work: 'work', personal: 'personal', home: 'home', reading: 'reading', ideas: 'ideas', health: 'health',
  };

  return (
    <LinearShell>
      <LinearTopBar
        title="Inbox"
        subtitle="THU, 30 APR · 28 ITEMS"
        right={
          <div style={{ display: 'flex', gap: 4 }}>
            <LinearIcon><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></LinearIcon>
            <LinearIcon><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 6h18M6 12h12M9 18h6"/></svg></LinearIcon>
          </div>
        }
      />

      {/* Filter strip */}
      <div style={{
        padding: '8px 16px',
        borderBottom: `1px solid ${LINEAR.hair}`,
        display: 'flex', gap: 6, alignItems: 'center',
        fontSize: 11.5,
      }}>
        <FilterChip active>All</FilterChip>
        <FilterChip>Tasks <span className="mono" style={{ color: LINEAR.ink3, marginLeft: 4 }}>4</span></FilterChip>
        <FilterChip>Notes <span className="mono" style={{ color: LINEAR.ink3, marginLeft: 4 }}>24</span></FilterChip>
        <div style={{ flex: 1 }}/>
        <span className="mono" style={{ fontSize: 10, color: LINEAR.ink3 }}>↑↓ navigate</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {items.map((it, i) => (
          <div key={i} style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${LINEAR.hair}`,
            display: 'flex', gap: 10, alignItems: 'flex-start',
            background: i === 1 ? 'rgba(124,139,245,0.04)' : 'transparent',
          }}>
            {/* Status / type icon */}
            <div style={{ width: 16, marginTop: 2, flexShrink: 0 }}>
              {it.isTask ? (
                it.status === 'done' ? (
                  <div style={{
                    width: 14, height: 14, borderRadius: 4,
                    background: LINEAR.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5L5 9L9.5 3.5" stroke="#0a0c10" strokeWidth="2" strokeLinecap="round"/></svg>
                  </div>
                ) : (
                  <div style={{
                    width: 14, height: 14, borderRadius: 4,
                    border: `1.5px solid ${LINEAR.ink3}`,
                  }}/>
                )
              ) : (
                <div style={{
                  width: 6, height: 6, borderRadius: 3, marginTop: 4, marginLeft: 4,
                  background: it.cat ? catColor[it.cat] : LINEAR.ink3,
                }}/>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13.5, lineHeight: 1.45,
                color: it.status === 'done' ? LINEAR.ink3 : LINEAR.ink,
                textDecoration: it.status === 'done' ? 'line-through' : 'none',
              }}>{it.text}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 11.5 }}>
                <span className="mono" style={{ color: LINEAR.ink3, fontSize: 11.5 }}>{it.id}</span>
                {it.cat && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: LINEAR.ink2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 2, background: catColor[it.cat] }}/>
                    {catLabel[it.cat]}
                  </span>
                )}
                {it.due && (
                  <span style={{ color: it.priority === 'high' ? LINEAR.amber : LINEAR.ink2, fontSize: 11.5 }}>
                    · {it.due}
                  </span>
                )}
                {it.priority === 'high' && (
                  <span className="mono" style={{ color: LINEAR.red, fontSize: 10, letterSpacing: '0.06em' }}>· P0</span>
                )}
                <div style={{ flex: 1 }}/>
                <span className="mono" style={{ color: LINEAR.ink3, fontSize: 10.5 }}>{it.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <LinearComposer/>
    </LinearShell>
  );
}

function LinearIcon({ children }) {
  return (
    <button style={{
      width: 28, height: 28, borderRadius: 6,
      color: LINEAR.ink2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  );
}

function FilterChip({ children, active }) {
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 6,
      background: active ? LINEAR.surfHi : 'transparent',
      border: `1px solid ${active ? LINEAR.hairHi : 'transparent'}`,
      color: active ? LINEAR.ink : LINEAR.ink2,
      fontSize: 11.5, fontWeight: 500,
      display: 'inline-flex', alignItems: 'center',
    }}>{children}</span>
  );
}

function LinearComposer() {
  return (
    <div style={{
      borderTop: `1px solid ${LINEAR.hair}`,
      background: LINEAR.surf,
      padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span className="mono" style={{
        fontSize: 11, color: LINEAR.ink3,
        padding: '3px 6px', background: LINEAR.surfHi, borderRadius: 4,
        border: `1px solid ${LINEAR.hairHi}`,
      }}>⌘N</span>
      <div style={{ flex: 1, fontSize: 13, color: LINEAR.ink3 }}>
        Type to capture. Use <span className="mono" style={{ color: LINEAR.accent }}>#trabalho</span>, <span className="mono" style={{ color: LINEAR.amber }}>amanhã 9h</span>…
      </div>
      <span className="mono" style={{
        fontSize: 11, color: LINEAR.ink3,
        padding: '3px 6px', background: LINEAR.surfHi, borderRadius: 4,
        border: `1px solid ${LINEAR.hairHi}`,
      }}>⌘↵</span>
      <button style={{
        padding: '6px 10px', borderRadius: 6,
        background: LINEAR.accent, color: '#fff',
        fontSize: 12, fontWeight: 500,
      }}>Save</button>
    </div>
  );
}

function LinearCommand() {
  return (
    <LinearShell>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(10,12,16,0.7)',
        backdropFilter: 'blur(8px)',
      }}/>
      <div style={{
        position: 'absolute', top: 80, left: 16, right: 16,
        background: LINEAR.surf,
        border: `1px solid ${LINEAR.hairHi}`,
        borderRadius: 12,
        boxShadow: '0 24px 60px -12px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Search input */}
        <div style={{
          padding: '14px 14px',
          borderBottom: `1px solid ${LINEAR.hair}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={LINEAR.ink3} strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <div style={{ flex: 1, fontSize: 14, color: LINEAR.ink }}>
            amanhã 9h <span style={{ color: LINEAR.ink3 }}>#trabalho</span>
            <span style={{ display: 'inline-block', width: 1, height: 16, background: LINEAR.accent, marginLeft: 2, verticalAlign: 'middle' }}/>
          </div>
          <span className="mono" style={{ fontSize: 10, color: LINEAR.ink3, padding: '2px 6px', background: LINEAR.surfHi, borderRadius: 4, border: `1px solid ${LINEAR.hair}` }}>esc</span>
        </div>

        {/* Parsed preview */}
        <div style={{
          padding: '10px 14px',
          background: 'rgba(124,139,245,0.06)',
          borderBottom: `1px solid ${LINEAR.hair}`,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
        }}>
          <span className="mono" style={{ color: LINEAR.accent, fontSize: 10, letterSpacing: '0.08em' }}>SMART</span>
          <span style={{ color: LINEAR.ink2 }}>Vai criar:</span>
          <span style={{
            padding: '2px 8px', borderRadius: 4,
            background: LINEAR.surfHi, border: `1px solid ${LINEAR.hairHi}`,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            color: LINEAR.ink,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            Tarefa · Sex 1/5, 09:00 ·
            <span style={{ width: 6, height: 6, borderRadius: 2, background: LINEAR.accent, marginLeft: 1 }}/>
            trabalho
          </span>
        </div>

        {/* Actions */}
        <div style={{ padding: 6 }}>
          <CmdRow icon="plus" label="Criar tarefa" hint="enter" active/>
          <CmdRow icon="note" label="Criar nota" hint="⌥enter"/>
          <CmdRow icon="search" label="Buscar “amanhã 9h trabalho”" hint="⌘enter"/>
          <CmdGroup label="Categorias" />
          <CmdRow color={LINEAR.accent} label="trabalho" hint="42 itens"/>
          <CmdRow color={LINEAR.green} label="pessoal" hint="28 itens"/>
          <CmdGroup label="Recentes" />
          <CmdRow icon="dot" label="Revisar PR do refresh token rotation" hint="2h atrás"/>
          <CmdRow icon="dot" label="Trocar a lâmpada da sala" hint="ontem"/>
        </div>

        <div style={{
          borderTop: `1px solid ${LINEAR.hair}`,
          padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 16,
          fontSize: 10, color: LINEAR.ink3,
        }}>
          <span><span className="mono" style={{ color: LINEAR.ink2 }}>↵</span> selecionar</span>
          <span><span className="mono" style={{ color: LINEAR.ink2 }}>↑↓</span> navegar</span>
          <span><span className="mono" style={{ color: LINEAR.ink2 }}>⌘K</span> comandos</span>
          <div style={{ flex: 1 }}/>
          <span>Savit Smart Capture</span>
        </div>
      </div>
    </LinearShell>
  );
}

function CmdRow({ icon, color, label, hint, active }) {
  const ic = {
    plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
    note: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>,
    search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
    dot: <span style={{ width: 6, height: 6, borderRadius: 3, background: LINEAR.ink3, display: 'inline-block' }}/>,
  }[icon];
  return (
    <div style={{
      padding: '8px 10px', borderRadius: 6,
      background: active ? LINEAR.surfHi : 'transparent',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ color: active ? LINEAR.ink : LINEAR.ink2, width: 16, display: 'flex', justifyContent: 'center' }}>
        {color ? <span style={{ width: 8, height: 8, borderRadius: 2, background: color }}/> : ic}
      </div>
      <div style={{ flex: 1, fontSize: 13, color: active ? LINEAR.ink : LINEAR.ink2 }}>{label}</div>
      <div className="mono" style={{ fontSize: 10, color: LINEAR.ink3 }}>{hint}</div>
    </div>
  );
}

function CmdGroup({ label }) {
  return (
    <div className="mono" style={{
      padding: '10px 10px 4px',
      fontSize: 9, color: LINEAR.ink3, letterSpacing: '0.14em',
    }}>{label.toUpperCase()}</div>
  );
}

function LinearDash() {
  return (
    <LinearShell>
      <LinearTopBar title="Dashboard" subtitle="LAST 30 DAYS" />

      <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Kpi label="Capturadas" value="128" delta="+24%" up />
          <Kpi label="Concluídas" value="84" delta="+12%" up />
          <Kpi label="Pendentes" value="14" delta="-3" />
          <Kpi label="Streak" value="12d" delta="recorde" up />
        </div>

        {/* Sparkline / chart */}
        <div style={{
          marginTop: 12,
          background: LINEAR.surf,
          border: `1px solid ${LINEAR.hair}`,
          borderRadius: 10,
          padding: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Atividade</div>
            <div className="mono" style={{ fontSize: 10, color: LINEAR.ink3, letterSpacing: '0.08em' }}>POR DIA</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 3, height: 70,
          }}>
            {[3,5,2,8,6,9,4,7,11,8,5,12,9,14,10,6,8,11,7,13,9,16,12,8,11,14,10,9,7,12].map((v, i) => (
              <div key={i} style={{
                flex: 1, height: `${v * 5}%`,
                background: i >= 27 ? LINEAR.accent : (i >= 20 ? LINEAR.accentDim : LINEAR.surfHi),
                borderRadius: 2,
              }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="mono" style={{ fontSize: 10, color: LINEAR.ink3 }}>1 ABR</span>
            <span className="mono" style={{ fontSize: 10, color: LINEAR.ink3 }}>30 ABR</span>
          </div>
        </div>

        {/* Top categories */}
        <div style={{
          marginTop: 12,
          background: LINEAR.surf,
          border: `1px solid ${LINEAR.hair}`,
          borderRadius: 10,
          padding: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Categorias</div>
            <div className="mono" style={{ fontSize: 10, color: LINEAR.ink3, letterSpacing: '0.08em' }}>TOP 4</div>
          </div>
          {[
            { name: 'trabalho', count: 42, pct: 0.85, color: LINEAR.accent },
            { name: 'pessoal', count: 28, pct: 0.55, color: LINEAR.green },
            { name: 'casa', count: 19, pct: 0.38, color: '#a78bfa' },
            { name: 'leitura', count: 14, pct: 0.28, color: LINEAR.amber },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: c.color }}/>
              <div style={{ width: 64, fontSize: 12 }}>{c.name}</div>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: LINEAR.surfHi, overflow: 'hidden' }}>
                <div style={{ width: `${c.pct * 100}%`, height: '100%', background: c.color }}/>
              </div>
              <div className="mono" style={{ fontSize: 11, color: LINEAR.ink2, width: 24, textAlign: 'right' }}>{c.count}</div>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div style={{
          marginTop: 12,
          background: LINEAR.surf,
          border: `1px solid ${LINEAR.hair}`,
          borderRadius: 10,
          padding: 14,
          marginBottom: 30,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Quando você captura</div>
            <div className="mono" style={{ fontSize: 10, color: LINEAR.ink3, letterSpacing: '0.08em' }}>HOUR × DAY</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {(() => {
              // R-21 — deterministic heatmap, hand-tuned to look like a workday pattern
              // (mornings warm, late nights cooler; weekends calmer)
              const HEAT = [
                // 0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23
                [0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 3, 2, 2, 3, 3, 2, 2, 2, 1, 1, 1, 1, 0, 0], // SEG
                [0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 3, 2, 3, 4, 3, 2, 2, 1, 1, 0, 1, 0, 0], // TER
                [0, 0, 0, 0, 0, 0, 0, 1, 2, 4, 4, 3, 2, 3, 4, 3, 2, 2, 1, 1, 1, 1, 0, 0], // QUA
                [0, 0, 0, 0, 0, 0, 0, 1, 3, 3, 4, 3, 3, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0], // QUI
                [0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 3, 3, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0], // SEX
                [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0], // SÁB
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0], // DOM
              ];
              const dows = ['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
              const tone = (v) => v >= 4 ? LINEAR.accent
                : v === 3 ? LINEAR.accentDim
                : v === 2 ? LINEAR.surfHi
                : v === 1 ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.025)';
              return HEAT.map((row, r) => (
                <div key={r} style={{ display: 'flex', gap: 3 }}>
                  <div style={{ width: 22, fontSize: 10, color: LINEAR.ink3 }} className="mono">
                    {dows[r]}
                  </div>
                  {row.map((v, c) => (
                    <div key={c} style={{
                      flex: 1, height: 14, borderRadius: 2,
                      background: tone(v),
                    }}/>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </LinearShell>
  );
}

function Kpi({ label, value, delta, up }) {
  return (
    <div style={{
      background: LINEAR.surf,
      border: `1px solid ${LINEAR.hair}`,
      borderRadius: 10,
      padding: 12,
    }}>
      <div className="mono" style={{ fontSize: 10, color: LINEAR.ink3, letterSpacing: '0.08em' }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: up ? LINEAR.green : LINEAR.ink2, marginTop: 2 }}>{delta}</div>
    </div>
  );
}

Object.assign(window, { LinearFeed, LinearCommand, LinearDash, LINEAR });
