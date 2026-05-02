// Savit Prototype — Detail panel (right column): edit selected item

function DetailPanel({ store }) {
  const item = store.items.find(i => i.id === store.selectedId);

  if (!item) {
    return (
      <aside className="detail">
        <div className="empty">
          <div className="glyph serif">"</div>
          <div className="head serif">Selecione algo<br/>para editar.</div>
          <div className="sub">Toque em qualquer nota ou tarefa pra abrir os detalhes aqui.</div>
        </div>
      </aside>
    );
  }

  const cat = store.getCat(item.cat);
  const isTask = item.kind === 'task';

  return (
    <aside className="detail">
      <div className="head-bar">
        <span className="badge">{isTask ? 'TAREFA' : 'NOTA'}</span>
        {item.priority === 'high' && (
          <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em' }}>· P0</span>
        )}
        <span className="id">{item.id.toUpperCase()}</span>
        <button className="close" onClick={() => store.setSelectedId(null)}><Icon.close/></button>
      </div>

      <div className="detail-body">
        <div className="note-task-seg">
          <button
            className={!isTask ? 'on' : ''}
            onClick={() => store.updateItem(item.id, { kind: 'note', dueAt: null, done: false })}
          >Nota</button>
          <button
            className={isTask ? 'on' : ''}
            onClick={() => store.updateItem(item.id, { kind: 'task' })}
          >Tarefa</button>
        </div>

        <textarea
          className={`text-edit ${isTask ? 'task-mode' : ''}`}
          value={item.text}
          onChange={(e) => store.updateItem(item.id, { text: e.target.value })}
        />

        <div className="field-grid">
          <FieldRow
            label="Categoria"
            onClick={(e) => store.openCatPicker && store.openCatPicker(item.id, e.currentTarget)}
          >
            {cat ? (
              <div className="val">
                <Swatch color={cat.color}/>
                {cat.name}
              </div>
            ) : (
              <div className="val muted">— sem categoria</div>
            )}
            <Icon.chev/>
          </FieldRow>

          {isTask && (
            <>
              <FieldRow
                label="Quando"
                onClick={() => {
                  const next = item.dueAt ? null : Date.now() + 86400000;
                  store.updateItem(item.id, { dueAt: next });
                }}
              >
                <div className={`val ${!item.dueAt ? 'muted' : ''}`}>
                  {item.dueAt ? dueLabel(item.dueAt) : '— sem prazo'}
                </div>
                <Icon.chev/>
              </FieldRow>

              <FieldRow
                label="Prioridade"
                onClick={() => store.updateItem(item.id, { priority: item.priority === 'high' ? null : 'high' })}
              >
                <div className={`val ${!item.priority ? 'muted' : ''}`}>
                  {item.priority === 'high' ? (
                    <span style={{ color: 'var(--accent)' }}>Urgente</span>
                  ) : '— normal'}
                </div>
                <Icon.chev/>
              </FieldRow>

              <FieldRow label="Lembrete">
                <div className="val muted">15 min antes</div>
                <Icon.chev/>
              </FieldRow>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--ink-3)' }}>
            ATIVIDADE
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>
            <span className="mono">{timeLabel(item.createdAt)}</span> · capturado
          </div>
          {item.done && (
            <div style={{ fontSize: 11.5, color: 'var(--green)' }}>
              <span className="mono">agora</span> · concluído
            </div>
          )}
        </div>
      </div>

      <div className="detail-footer">
        <button className="ghost"><Icon.archive/> Arquivar</button>
        <button className="danger" onClick={() => store.deleteItem(item.id)}><Icon.trash/> Excluir</button>
      </div>
    </aside>
  );
}

function FieldRow({ label, children, onClick }) {
  return (
    <div className="field-row" onClick={onClick}>
      <div className="lbl">{label}</div>
      {children}
    </div>
  );
}

Object.assign(window, { DetailPanel });
