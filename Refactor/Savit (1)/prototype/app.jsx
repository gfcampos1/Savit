// Savit Prototype — top-level App + global keyboard shortcuts

function useGlobalHotkeys(store) {
  useEffect(() => {
    const onKey = (e) => {
      const tgt = e.target;
      const isTyping = tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA';

      // ⌘K / Ctrl+K — open search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        store.setSearchOpen(true);
      }
      // Esc — close stuff
      else if (e.key === 'Escape') {
        if (store.searchOpen) store.setSearchOpen(false);
        else if (store.tweaksOpen) store.setTweaksOpen(false);
        else if (store.selectedId) store.setSelectedId(null);
      }
      // / — focus search (only when not typing)
      else if (e.key === '/' && !isTyping) {
        e.preventDefault();
        store.setSearchOpen(true);
      }
      // g i / g t / g c / g p — go to (Linear-style)
      else if (e.key === 'g' && !isTyping) {
        const handler = (ev) => {
          if (ev.key === 'i') store.setTab('all');
          else if (ev.key === 't') store.setTab('tasks');
          else if (ev.key === 'c') store.setTab('cats');
          else if (ev.key === 'p') store.setTab('profile');
          window.removeEventListener('keydown', handler);
        };
        window.addEventListener('keydown', handler);
        setTimeout(() => window.removeEventListener('keydown', handler), 1500);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store.searchOpen, store.tweaksOpen, store.selectedId]);
}

function App() {
  const store = useStore();
  const [colorPicker, setColorPicker] = useState(null);

  // Wire color picker into store
  store.colorPicker = colorPicker;
  store.openColorPicker = (catId, pos) => setColorPicker({ catId, pos });
  store.closeColorPicker = () => setColorPicker(null);

  useGlobalHotkeys(store);

  // Welcome toast
  useEffect(() => {
    const t = setTimeout(() => {
      store.pushToast('Bem-vinda de volta, Bia ✦', { kind: 'info', timeout: 3000 });
    }, 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="app" data-modal={store.searchOpen ? 'true' : 'false'}>
      <Sidebar store={store}/>

      <main className="main">
        {store.tab === 'all' && <FeedView store={store}/>}
        {store.tab === 'tasks' && <TasksView store={store}/>}
        {store.tab === 'cats' && <CategoriesView store={store}/>}
        {store.tab === 'profile' && <ProfileView store={store}/>}

        {(store.tab === 'all' || store.tab === 'tasks') && <Composer store={store}/>}
      </main>

      <DetailPanel store={store}/>

      <ToastStack store={store}/>
      <SearchOverlay store={store}/>
      <ColorPicker store={store}/>
      <TweaksPanel store={store}/>
      <TweaksLauncher store={store}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
