// Savit Prototype — Composer with live parser preview

function Composer({ store }) {
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const taRef = useRef(null);
  const parsed = useMemo(() => parseInput(text, store.categories), [text, store.categories]);

  const hasChips = parsed.categoryName || parsed.dueLabel || parsed.isTask || parsed.priority === 'high';

  const submit = () => {
    if (!text.trim()) return;
    store.addItem(parsed, text);
    setText('');
    setExpanded(false);
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    } else if (e.key === 'Enter' && !e.shiftKey && !text.includes('\n')) {
      e.preventDefault();
      submit();
    }
  };

  const onChange = (e) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  return (
    <div className="composer-wrap">
      <div className={`preview-chips ${hasChips ? 'show' : ''}`}>
        {parsed.isTask && (
          <span className="chip">
            <Icon.check style={{ width: 11, height: 11 }}/>
            Tarefa
          </span>
        )}
        {parsed.dueLabel && (
          <span className="chip">
            <Icon.clock/>
            {parsed.dueLabel}
          </span>
        )}
        {parsed.categoryName && (
          <span className="chip">
            <Swatch color={parsed.categoryColor}/>
            {parsed.categoryName}
          </span>
        )}
        {parsed.priority === 'high' && (
          <span className="chip" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'transparent' }}>
            <Icon.flame/> Urgente
          </span>
        )}
      </div>

      <div className={`composer ${expanded ? 'expanded' : ''}`}>
        <div className="quote serif">"</div>
        <textarea
          ref={taRef}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setExpanded(true)}
          onBlur={() => { if (!text.trim()) setExpanded(false); }}
          placeholder="Anote uma ideia… use #trabalho ou amanhã 9h"
          rows={1}
        />
        <button className="mic-btn" title="Gravar áudio"><Icon.mic/></button>
        <button className="send-btn" disabled={!text.trim()} onClick={submit} title="Enviar (⌘↵)">
          <Icon.send/>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Composer });
