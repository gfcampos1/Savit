// Savit Prototype — Sidebar component

function Sidebar({ store }) {
  const { tab, setTab, categories, items, setSearchOpen } = store;
  const counts = useMemo(() => ({
    all: items.length,
    tasks: items.filter(i => i.kind === 'task' && !i.done).length,
    cats: categories.length,
  }), [items, categories]);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">S</div>
        <div className="name">Savit</div>
        <div className="v mono">v2</div>
      </div>

      <button className={`nav-item ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
        <span className="ico"><Icon.inbox/></span>
        Inbox
        <span className="count">{counts.all}</span>
      </button>
      <button className={`nav-item ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
        <span className="ico"><Icon.check/></span>
        Tarefas
        <span className="count">{counts.tasks}</span>
      </button>
      <button className={`nav-item ${tab === 'cats' ? 'active' : ''}`} onClick={() => setTab('cats')}>
        <span className="ico"><Icon.hash/></span>
        Categorias
        <span className="count">{counts.cats}</span>
      </button>
      <button className={`nav-item ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
        <span className="ico"><Icon.user/></span>
        Perfil
      </button>

      <div className="nav-group">
        <div className="label">CATEGORIAS</div>
        {categories.map(c => {
          const n = items.filter(i => i.cat === c.id).length;
          return (
            <button key={c.id} className="nav-item cat-row" onClick={() => { store.setCategoryFilter && store.setCategoryFilter(c.id); }}>
              <span className="swatch" style={{ background: c.color }}/>
              {c.name}
              <span className="count">{n}</span>
            </button>
          );
        })}
      </div>

      <button className="search-btn" onClick={() => setSearchOpen(true)}>
        <Icon.search/>
        <span>Buscar</span>
        <span className="kbd mono">⌘K</span>
      </button>

      <button className="user-pill" onClick={() => store.setTab('profile')}>
        <div className="av">B</div>
        <div>
          <div className="name">Beatriz</div>
          <div className="email">bia@savit.app</div>
        </div>
      </button>
    </aside>
  );
}

Object.assign(window, { Sidebar });
