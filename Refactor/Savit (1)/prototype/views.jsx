// Savit Prototype — Tasks, Categories, Profile, Search, Toast, Color Picker, Tweaks

// ---------- Tasks view ----------
function TasksView({ store }) {
  const buckets = useMemo(() => groupTasksByDue(store.items.filter(i => i.kind === 'task')), [store.items]);
  const sections = [
    { key: 'hoje', label: 'Hoje', items: buckets.hoje },
    { key: 'amanha', label: 'Amanhã', items: buckets.amanha },
    { key: 'semana', label: 'Esta semana', items: buckets.semana },
    { key: 'depois', label: 'Depois', items: buckets.depois },
    { key: 'semData', label: 'Sem prazo', items: buckets.semData },
    { key: 'concluidas', label: 'Concluídas', items: buckets.concluidas },
  ].filter(s => s.items.length > 0);

  const totalPending = buckets.hoje.length + buckets.amanha.length + buckets.semana.length + buckets.depois.length + buckets.semData.length;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="sub mono">{totalPending} PENDENTES · {buckets.concluidas.length} CONCLUÍDA{buckets.concluidas.length === 1 ? '' : 'S'}</div>
          <h1 className="serif">Tarefas</h1>
        </div>
        <div className="actions">
          <button className="icon-btn"><Icon.search/></button>
          <button className="icon-btn"><Icon.more/></button>
        </div>
      </div>

      <div className="feed">
        {/* Foco do dia */}
        {buckets.hoje.length > 0 && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--hair)',
            borderRadius: 14, padding: 16, margin: '12px 0',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Instrument Serif", serif', fontSize: 28,
            }}>{buckets.hoje.length}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Foco do dia</div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{buckets.hoje.length} tarefa{buckets.hoje.length === 1 ? '' : 's'} pra fechar antes das 19h</div>
            </div>
            <button style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'var(--ink)', color: 'var(--bg)', fontWeight: 500 }}>
              Iniciar →
            </button>
          </div>
        )}

        {sections.map(s => (
          <div key={s.key}>
            <div className="day-div">
              <div className="label">{s.label.toUpperCase()}</div>
              <div className="line"/>
            </div>
            {s.items.map(it => <TaskCard key={it.id} item={it} store={store}/>)}
          </div>
        ))}
        <div style={{ height: 80 }}/>
      </div>
      <div className="feed-fade"/>
    </>
  );
}

// ---------- Categories view ----------
function CategoriesView({ store }) {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="sub mono">{store.categories.length} ESPAÇOS</div>
          <h1 className="serif">Categorias</h1>
        </div>
        <div className="actions">
          <button className="icon-btn" onClick={() => store.pushToast('Em breve: nova categoria')}>
            <Icon.plus/>
          </button>
        </div>
      </div>

      <div className="feed">
        <div className="cats-grid">
          {store.categories.map(c => {
            const itemsIn = store.items.filter(i => i.cat === c.id);
            const tasks = itemsIn.filter(i => i.kind === 'task' && !i.done).length;
            const recent = itemsIn[0];
            return (
              <div key={c.id} className="cat-tile" onClick={() => {
                store.setTab('all');
                if (recent) store.setSelectedId(recent.id);
              }}>
                <div className="row">
                  <div className="av serif" style={{ background: c.color }}>{c.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div className="name">{c.name}</div>
                  </div>
                  <button
                    className="icon-btn"
                    style={{ width: 28, height: 28 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      store.openColorPicker(c.id, { top: rect.bottom + 6, left: rect.left - 220 });
                    }}
                    title="Trocar cor"
                  >
                    <Icon.swatch/>
                  </button>
                </div>
                <div className="recent">{recent ? recent.text.slice(0, 60) + (recent.text.length > 60 ? '…' : '') : '— vazio'}</div>
                <div className="stats">
                  <span className="n serif">{itemsIn.length}</span>
                  <span className="lbl">{itemsIn.length === 1 ? 'item' : 'itens'}</span>
                  {tasks > 0 && <span className="tasks">· {tasks} TAREFA{tasks === 1 ? '' : 'S'}</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ height: 60 }}/>
      </div>
      <div className="feed-fade"/>
    </>
  );
}

// ---------- Profile view ----------
function ProfileView({ store }) {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="sub mono">CONTA</div>
          <h1 className="serif">Perfil</h1>
        </div>
      </div>

      <div className="feed">
        <div className="profile">
          <div className="hero">
            <div className="av">B</div>
            <div className="meta">
              <div className="name">Beatriz Souza</div>
              <div className="em">bia@savit.app · membro desde abr/26</div>
            </div>
          </div>

          <div className="stats-strip">
            <div className="cell">
              <div className="n">{store.items.length}</div>
              <div className="l">CAPTURAS</div>
            </div>
            <div className="cell">
              <div className="n">{store.items.filter(i => i.kind === 'task' && i.done).length}</div>
              <div className="l">CONCLUÍDAS</div>
            </div>
            <div className="cell">
              <div className="n">12d</div>
              <div className="l">STREAK</div>
            </div>
          </div>

          <div className="settings-group">
            <div className="gl">CONTA</div>
            <div className="settings-row" onClick={() => store.pushToast('Em breve')}>
              <span className="ico"><Icon.user/></span>
              <span className="lbl">Editar perfil</span>
              <Icon.chev/>
            </div>
            <div className="settings-row" onClick={() => store.pushToast('Em breve')}>
              <span className="ico"><Icon.lock/></span>
              <span className="lbl">Email e senha</span>
              <Icon.chev/>
            </div>
            <div className="settings-row" onClick={() => store.pushToast('2FA configurado')}>
              <span className="ico"><Icon.shield/></span>
              <span className="lbl">Autenticação em 2 fatores</span>
              <span className="right" style={{ color: 'var(--green)' }}>Ativa</span>
            </div>
            <div className="settings-row" onClick={() => store.pushToast('2 dispositivos ativos')}>
              <span className="ico"><Icon.device/></span>
              <span className="lbl">Sessões ativas</span>
              <span className="right">2 dispositivos</span>
            </div>
          </div>

          <div className="settings-group">
            <div className="gl">DADOS</div>
            <div className="settings-row" onClick={() => store.pushToast('Exportando…')}>
              <span className="ico"><Icon.down/></span>
              <span className="lbl">Exportar tudo</span>
              <Icon.chev/>
            </div>
            <div className="settings-row" onClick={() => store.pushToast('Selecione um arquivo')}>
              <span className="ico"><Icon.up/></span>
              <span className="lbl">Importar JSON</span>
              <Icon.chev/>
            </div>
            <div className="settings-row danger" onClick={() => store.pushToast('Cuidado!', { kind: 'danger' })}>
              <span className="ico"><Icon.trash/></span>
              <span className="lbl">Limpar histórico</span>
            </div>
          </div>

          <div className="settings-group">
            <div className="gl">APARÊNCIA</div>
            <div className="settings-row" onClick={() => store.setTweaksOpen(true)}>
              <span className="ico"><Icon.theme/></span>
              <span className="lbl">Tema e cores</span>
              <span className="right">Paper · {store.accent}</span>
            </div>
          </div>

          <div style={{ height: 60 }}/>
        </div>
      </div>
      <div className="feed-fade"/>
    </>
  );
}

// ---------- Toasts ----------
function ToastStack({ store }) {
  return (
    <div className="toast-stack">
      {store.toasts.map(t => (
        <div key={t.id} className={`toast ${t.removing ? 'removing' : ''}`}>
          <span className="ico">
            {t.kind === 'danger' ? <Icon.trash/> : <Icon.check style={{ width: 14, height: 14 }}/>}
          </span>
          <span>{t.msg}</span>
          {t.undo && <button className="undo" onClick={() => { t.undo(); }}>Desfazer</button>}
        </div>
      ))}
    </div>
  );
}

// ---------- Search overlay ----------
function SearchOverlay({ store }) {
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (store.searchOpen) {
      setQ(''); setFocused(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [store.searchOpen]);

  const results = useMemo(() => {
    if (!q.trim()) {
      return [
        { group: 'RECENTES', items: store.items.slice(0, 4).map(i => ({
          id: i.id, label: i.text, hint: timeLabel(i.createdAt), cat: store.getCat(i.cat),
        })) },
      ];
    }
    const lower = q.toLowerCase();
    const matches = store.items.filter(i => i.text.toLowerCase().includes(lower));
    const tasks = matches.filter(i => i.kind === 'task');
    const notes = matches.filter(i => i.kind === 'note');
    const cats = store.categories.filter(c => c.name.toLowerCase().includes(lower));
    const groups = [];
    if (tasks.length) groups.push({ group: `TAREFAS · ${tasks.length}`, items: tasks.map(i => ({ id: i.id, label: i.text, hint: i.dueAt ? dueLabel(i.dueAt) : 'sem prazo', cat: store.getCat(i.cat) })) });
    if (notes.length) groups.push({ group: `NOTAS · ${notes.length}`, items: notes.map(i => ({ id: i.id, label: i.text, hint: timeLabel(i.createdAt), cat: store.getCat(i.cat) })) });
    if (cats.length) groups.push({ group: 'CATEGORIAS', items: cats.map(c => ({ id: 'cat-' + c.id, label: c.name, hint: store.items.filter(i => i.cat === c.id).length + ' itens', cat: c })) });
    return groups;
  }, [q, store.items, store.categories]);

  const flat = useMemo(() => results.flatMap(g => g.items), [results]);

  const onKey = (e) => {
    if (e.key === 'Escape') { store.setSearchOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, flat.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    else if (e.key === 'Enter') {
      const r = flat[focused];
      if (r && !r.id.startsWith('cat-')) {
        store.setSelectedId(r.id);
        store.setSearchOpen(false);
      }
    }
  };

  const renderHighlight = (text) => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return text;
    return <>{text.slice(0, idx)}<mark>{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>;
  };

  return (
    <div className={`search-overlay ${store.searchOpen ? 'open' : ''}`} onClick={() => store.setSearchOpen(false)}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-row">
          <Icon.search/>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setFocused(0); }}
            onKeyDown={onKey}
            placeholder="Buscar notas, tarefas, categorias…"
          />
          <span className="esc">esc</span>
        </div>
        <div className="search-results">
          {flat.length === 0 ? (
            <div className="search-empty">
              <div className="em serif">Nenhum resultado para "{q}"</div>
              <div>Tente outra palavra-chave.</div>
            </div>
          ) : (
            results.map((g, gi) => (
              <React.Fragment key={gi}>
                <div className="search-group-label">{g.group}</div>
                {g.items.map((r, ri) => {
                  const flatIdx = results.slice(0, gi).reduce((s, x) => s + x.items.length, 0) + ri;
                  return (
                    <div
                      key={r.id}
                      className={`search-result ${flatIdx === focused ? 'focused' : ''}`}
                      onMouseEnter={() => setFocused(flatIdx)}
                      onClick={() => {
                        if (!r.id.startsWith('cat-')) {
                          store.setSelectedId(r.id);
                          store.setSearchOpen(false);
                        }
                      }}
                    >
                      {r.cat ? <Swatch color={r.cat.color}/> : <Swatch color="var(--ink-3)"/>}
                      <span className="label">{renderHighlight(r.label)}</span>
                      <span className="hint">{r.hint}</span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))
          )}
        </div>
        <div className="search-footer">
          <span><span className="kbd">↵</span> abrir</span>
          <span><span className="kbd">↑↓</span> navegar</span>
          <span><span className="kbd">esc</span> fechar</span>
          <div style={{ flex: 1 }}/>
          <span>Savit · busca</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Color Picker ----------
function ColorPicker({ store }) {
  if (!store.colorPicker) return null;
  const { catId, pos } = store.colorPicker;
  const cat = store.getCat(catId);
  if (!cat) return null;

  return (
    <>
      <div className="popover-backdrop" onClick={() => store.closeColorPicker()}/>
      <div className="color-pop" style={{ top: pos.top, left: pos.left, width: 240 }}>
        <div className="head">COR DE {cat.name.toUpperCase()}</div>
        <div className="grid">
          {PALETTE.map(p => (
            <button
              key={p.id}
              className={`swatch-btn ${p.color === cat.color ? 'selected' : ''}`}
              style={{ background: p.color }}
              title={p.name}
              onClick={() => { store.updateCategory(catId, { color: p.color }); store.closeColorPicker(); }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ---------- Tweaks Panel ----------
function TweaksPanel({ store }) {
  if (!store.tweaksOpen) return null;
  return (
    <div className="tweaks-panel open">
      <div className="head">
        <div className="title serif">Tweaks</div>
        <button className="x" onClick={() => store.setTweaksOpen(false)}><Icon.close/></button>
      </div>

      <div className="tweak-section">
        <div className="lbl">ACCENT</div>
        <div className="row">
          {[
            { id: 'citrus', color: '#c0563a' },
            { id: 'terra', color: '#b8472d' },
            { id: 'amber', color: '#d4a128' },
            { id: 'mint', color: '#3a8a6a' },
            { id: 'purple', color: '#7a5cc7' },
            { id: 'blue', color: '#2a5fb8' },
          ].map(o => (
            <button
              key={o.id}
              className={`tweak-pill ${store.accent === o.id ? 'on' : ''}`}
              onClick={() => store.setAccent(o.id)}
            >
              <span className="swatch" style={{ background: o.color }}/>
              {o.id}
            </button>
          ))}
        </div>
      </div>

      <div className="tweak-section">
        <div className="lbl">DENSIDADE</div>
        <div className="row">
          {['comfortable', 'compact'].map(d => (
            <button
              key={d}
              className={`tweak-pill ${store.density === d ? 'on' : ''}`}
              onClick={() => store.setDensity(d)}
            >
              {d === 'comfortable' ? 'Confortável' : 'Compacta'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--ink-3)', borderTop: '1px solid var(--hair)', paddingTop: 10, lineHeight: 1.5 }}>
        Mudanças são aplicadas em tempo real. Recarregue para resetar tudo.
      </div>
    </div>
  );
}

function TweaksLauncher({ store }) {
  if (store.tweaksOpen) return null;
  return (
    <button className="tweaks-launcher" onClick={() => store.setTweaksOpen(true)} title="Tweaks">
      <Icon.cog/>
    </button>
  );
}

Object.assign(window, {
  TasksView, CategoriesView, ProfileView, ToastStack,
  SearchOverlay, ColorPicker, TweaksPanel, TweaksLauncher,
});
