// Savit Prototype — Feed (Inbox) view: notes + task cards, day dividers

function NoteRow({ item, store }) {
  const cat = store.getCat(item.cat);
  const selected = store.selectedId === item.id;
  return (
    <div className={`note ${selected ? 'selected' : ''}`} onClick={() => store.setSelectedId(item.id)}>
      <div className="text">{item.text}</div>
      <div className="meta">
        <CategoryBadge cat={cat}/>
        <span className="time">{timeLabel(item.createdAt)}</span>
      </div>
    </div>
  );
}

function TaskCard({ item, store }) {
  const cat = store.getCat(item.cat);
  const selected = store.selectedId === item.id;
  return (
    <div className={`task-card ${item.done ? 'done' : ''} ${selected ? 'selected' : ''}`}
         onClick={() => store.setSelectedId(item.id)}>
      <div className={`checkbox ${item.done ? 'done' : ''}`}
           style={{ '--cat': cat?.color }}
           onClick={(e) => { e.stopPropagation(); store.toggleDone(item.id); }}>
        <svg className="check" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.5L5 9L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="body">
        {item.priority === 'high' && !item.done && <div className="urgent">URGENTE</div>}
        <div className="text">{item.text}</div>
        <div className="meta">
          <CategoryBadge cat={cat}/>
          {item.dueAt && (
            <span className="when">
              <Icon.clock/>
              {dueLabel(item.dueAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FeedView({ store }) {
  const groups = useMemo(() => groupByDay(store.items), [store.items]);
  return (
    <>
      <div className="page-head">
        <div>
          <div className="sub mono">QUI · 30 ABR</div>
          <h1 className="serif">Hoje</h1>
        </div>
        <div className="actions">
          <button className="icon-btn" onClick={() => store.setSearchOpen(true)}><Icon.search/></button>
          <button className="icon-btn"><Icon.more/></button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${store.tab === 'all' ? 'active' : ''}`} onClick={() => store.setTab('all')}>
          Tudo <span className="count">{store.items.length}</span>
        </button>
        <button className={`tab ${store.tab === 'tasks' ? 'active' : ''}`} onClick={() => store.setTab('tasks')}>
          Tarefas <span className="count">{store.items.filter(i => i.kind === 'task' && !i.done).length}</span>
        </button>
        <button className={`tab ${store.tab === 'cats' ? 'active' : ''}`} onClick={() => store.setTab('cats')}>
          Categorias <span className="count">{store.categories.length}</span>
        </button>
      </div>

      <div className="feed">
        {groups.map(g => (
          <React.Fragment key={g.day}>
            <div className="day-div">
              <div className="label">{g.label.toUpperCase()}</div>
              <div className="line"/>
            </div>
            {g.items.map(it => it.kind === 'task'
              ? <TaskCard key={it.id} item={it} store={store}/>
              : <NoteRow key={it.id} item={it} store={store}/>
            )}
          </React.Fragment>
        ))}
        <div style={{ height: 80 }}/>
      </div>
      <div className="feed-fade"/>
    </>
  );
}

Object.assign(window, { FeedView, NoteRow, TaskCard });
