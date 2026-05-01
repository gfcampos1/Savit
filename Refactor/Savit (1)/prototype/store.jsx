// Savit Prototype — data store, mock data, natural-language parser, helpers

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---------- Categories ----------
const PALETTE = [
  { id: 'citrus', color: '#c0563a', name: 'Citrus' },
  { id: 'terra',  color: '#b8472d', name: 'Terra'  },
  { id: 'amber',  color: '#d4a128', name: 'Amber'  },
  { id: 'mint',   color: '#3a8a6a', name: 'Mint'   },
  { id: 'olive',  color: '#7a8a3a', name: 'Olive'  },
  { id: 'forest', color: '#2d6e4a', name: 'Forest' },
  { id: 'sky',    color: '#3a76b8', name: 'Sky'    },
  { id: 'blue',   color: '#2a5fb8', name: 'Blue'   },
  { id: 'purple', color: '#7a5cc7', name: 'Purple' },
  { id: 'pink',   color: '#d96fa0', name: 'Pink'   },
  { id: 'slate',  color: '#5b6470', name: 'Slate'  },
  { id: 'ink',    color: '#1d1a14', name: 'Ink'    },
];

const INITIAL_CATEGORIES = [
  { id: 'work',     name: 'Trabalho', color: '#c0563a', initial: 'T' },
  { id: 'personal', name: 'Pessoal',  color: '#3a8a6a', initial: 'P' },
  { id: 'home',     name: 'Casa',     color: '#7a5cc7', initial: 'C' },
  { id: 'reading',  name: 'Leitura',  color: '#d4a128', initial: 'L' },
  { id: 'ideas',    name: 'Ideias',   color: '#2a5fb8', initial: 'I' },
  { id: 'health',   name: 'Saúde',    color: '#d96fa0', initial: 'S' },
];

// ---------- Mock items ----------
function nowMinus(daysAgo, hour, min) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, min || 0, 0, 0);
  return d.getTime();
}

const INITIAL_ITEMS = [
  { id: 'i-128', kind: 'note', cat: 'work', createdAt: nowMinus(0, 9, 42),
    text: 'Pensar num nome melhor pra feature de export. "Compartilhar" tá ambíguo.' },
  { id: 'i-127', kind: 'task', cat: 'work', createdAt: nowMinus(0, 10, 15),
    text: 'Revisar PR do refresh token rotation', dueAt: (() => { const d=new Date(); d.setHours(16,0,0,0); return d.getTime(); })(),
    done: false, priority: 'high' },
  { id: 'i-126', kind: 'note', cat: 'personal', createdAt: nowMinus(0, 12, 8),
    text: 'O café da Inhotim era melhor do que eu lembrava.' },
  { id: 'i-125', kind: 'task', cat: 'home', createdAt: nowMinus(0, 13, 30),
    text: 'Trocar a lâmpada da sala', dueAt: nowMinus(-1, 9, 0), done: true },
  { id: 'i-124', kind: 'note', cat: 'reading', createdAt: nowMinus(1, 21, 14),
    text: '"O que você protege com sua atenção?" — anotação do Tchekhov.' },
  { id: 'i-123', kind: 'note', cat: null, createdAt: nowMinus(1, 22, 1),
    text: 'Sem categoria por enquanto. Voltar nessa amanhã.' },
  { id: 'i-122', kind: 'task', cat: 'personal', createdAt: nowMinus(1, 18, 30),
    text: 'Ligar pro João', dueAt: (() => { const d=new Date(); d.setHours(18,30,0,0); return d.getTime(); })(),
    done: false },
  { id: 'i-121', kind: 'note', cat: 'ideas', createdAt: nowMinus(2, 8, 14),
    text: 'App de pomodoro mas que valoriza pausas, não foco.' },
  { id: 'i-120', kind: 'task', cat: 'health', createdAt: nowMinus(2, 7, 30),
    text: 'Dentista', dueAt: nowMinus(-6, 14, 0), done: false },
  { id: 'i-119', kind: 'note', cat: 'work', createdAt: nowMinus(3, 11, 22),
    text: 'A telemetria da onboarding tá enviando dois eventos pro mesmo step. Investigar.' },
  { id: 'i-118', kind: 'note', cat: 'personal', createdAt: nowMinus(3, 19, 5),
    text: 'Lembrar de pegar a Nina na escola sexta — mãe viaja.' },
];

// ---------- Date helpers ----------
const PT_DAYS_SHORT = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
const PT_MONTHS_SHORT = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

function isSameDay(a, b) {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}
function startOfDay(t) { const d = new Date(t); d.setHours(0,0,0,0); return d.getTime(); }

function dayLabel(t) {
  const today = startOfDay(Date.now());
  const day = startOfDay(t);
  const diff = Math.round((today - day) / (1000 * 60 * 60 * 24));
  const d = new Date(t);
  const dn = `${PT_DAYS_SHORT[d.getDay()]} ${d.getDate()} ${PT_MONTHS_SHORT[d.getMonth()]}`;
  if (diff === 0) return `Hoje · ${dn.toLowerCase()}`;
  if (diff === 1) return `Ontem · ${dn.toLowerCase()}`;
  if (diff === -1) return `Amanhã · ${dn.toLowerCase()}`;
  if (diff > 1 && diff < 7) return `${diff} dias atrás · ${dn.toLowerCase()}`;
  return dn.toLowerCase();
}

function timeLabel(t) {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function dueLabel(t) {
  if (!t) return null;
  const today = startOfDay(Date.now());
  const day = startOfDay(t);
  const diff = Math.round((day - today) / (1000 * 60 * 60 * 24));
  const d = new Date(t);
  const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  if (diff === 0) return `Hoje, ${time}`;
  if (diff === 1) return `Amanhã, ${time}`;
  if (diff < 0) return `Atrasada · ${d.getDate()}/${d.getMonth()+1}`;
  if (diff < 7) return `${PT_DAYS_SHORT[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}, ${time}`;
  return `${d.getDate()}/${d.getMonth()+1}, ${time}`;
}

// ---------- Natural language parser ----------
// Detects: #cat, @date, time, task verbs
const TIME_KEYWORDS = {
  'hoje': 0, 'amanhã': 1, 'amanha': 1, 'depois de amanhã': 2, 'depois de amanha': 2,
  'segunda': 1, 'terça': 2, 'terca': 2, 'quarta': 3, 'quinta': 4, 'sexta': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0,
  'próxima semana': 7, 'proxima semana': 7,
};

const DAY_OF_WEEK = { domingo: 0, segunda: 1, terça: 2, terca: 2, quarta: 3, quinta: 4, sexta: 5, sábado: 6, sabado: 6 };

const TASK_VERBS = ['lembrar', 'ligar', 'enviar', 'mandar', 'comprar', 'fazer', 'revisar', 'escrever', 'agendar', 'pagar', 'reservar', 'finalizar', 'terminar', 'responder', 'estudar', 'ler'];

function parseInput(text, categories) {
  const out = { text: text, isTask: false, categoryId: null, categoryName: null, categoryColor: null, dueAt: null, dueLabel: null, urgentMatch: null };
  if (!text || !text.trim()) return out;

  const lower = text.toLowerCase();

  // Category by hashtag
  const hashMatch = text.match(/#(\w+)/i);
  if (hashMatch) {
    const tag = hashMatch[1].toLowerCase();
    const cat = categories.find(c =>
      c.name.toLowerCase().startsWith(tag) ||
      c.id.toLowerCase().startsWith(tag) ||
      tag.startsWith(c.name.toLowerCase().slice(0, 3))
    );
    if (cat) {
      out.categoryId = cat.id;
      out.categoryName = cat.name;
      out.categoryColor = cat.color;
    }
  }

  // Time hour (Xh, X:Y, Xh30) — must come first since "amanhã 9h" benefits
  const hourMatch = lower.match(/(\d{1,2})h(?:(\d{2}))?|(\d{1,2}):(\d{2})/);
  let hour = null, minute = 0;
  if (hourMatch) {
    if (hourMatch[1]) { hour = +hourMatch[1]; minute = +(hourMatch[2] || 0); }
    else if (hourMatch[3]) { hour = +hourMatch[3]; minute = +hourMatch[4]; }
  }

  // Date keyword
  let dateOffset = null;
  for (const k of Object.keys(TIME_KEYWORDS)) {
    if (lower.includes(k)) { dateOffset = TIME_KEYWORDS[k]; break; }
  }

  if (dateOffset !== null || hour !== null) {
    const d = new Date();
    if (dateOffset !== null) {
      const target = DAY_OF_WEEK[Object.keys(TIME_KEYWORDS).find(k => lower.includes(k))];
      if (target !== undefined && !lower.includes('próxima') && !lower.includes('proxima')) {
        // find next occurrence of weekday
        const today = d.getDay();
        let delta = (target - today + 7) % 7;
        if (delta === 0) delta = 7;
        d.setDate(d.getDate() + delta);
      } else {
        d.setDate(d.getDate() + dateOffset);
      }
    }
    if (hour !== null) d.setHours(hour, minute, 0, 0);
    else d.setHours(9, 0, 0, 0);
    out.dueAt = d.getTime();
    out.dueLabel = dueLabel(d.getTime());
    out.isTask = true;
  }

  // Task verbs
  if (!out.isTask) {
    for (const v of TASK_VERBS) {
      if (lower.startsWith(v + ' ') || lower.includes(' ' + v + ' ')) {
        out.isTask = true;
        break;
      }
    }
  }

  // Urgent
  if (lower.includes('urgente') || lower.includes('!!')) {
    out.priority = 'high';
  }

  return out;
}

// ---------- Store (single global state, hook-based) ----------
function useStore() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [tab, setTab] = useState('all'); // all | tasks | cats | profile
  const [selectedId, setSelectedId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [accent, setAccent] = useState('citrus');
  const [density, setDensity] = useState('comfortable');
  const undoStackRef = useRef([]);

  // Apply accent + density to <html>
  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    document.documentElement.dataset.density = density;
  }, [accent, density]);

  const pushToast = useCallback((msg, opts = {}) => {
    const id = 't-' + Math.random().toString(36).slice(2, 7);
    const t = { id, msg, undo: opts.undo, kind: opts.kind || 'info', timeout: opts.timeout || 4200 };
    setToasts(prev => [...prev, t]);
    setTimeout(() => {
      setToasts(prev => prev.map(x => x.id === id ? { ...x, removing: true } : x));
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 240);
    }, t.timeout);
    return id;
  }, []);

  const addItem = useCallback((parsed, rawText) => {
    const id = 'i-' + (130 + Math.floor(Math.random() * 1000));
    const item = {
      id,
      kind: parsed.isTask ? 'task' : 'note',
      cat: parsed.categoryId,
      createdAt: Date.now(),
      text: rawText.replace(/#\w+/g, '').trim(),
      dueAt: parsed.dueAt || null,
      done: false,
      priority: parsed.priority || null,
    };
    setItems(prev => [item, ...prev]);
    pushToast(parsed.isTask ? 'Tarefa criada' : 'Nota salva', {
      kind: 'success',
      undo: () => setItems(prev => prev.filter(x => x.id !== id)),
    });
    return id;
  }, [pushToast]);

  const updateItem = useCallback((id, patch) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
  }, []);

  const toggleDone = useCallback((id) => {
    setItems(prev => prev.map(x => {
      if (x.id !== id) return x;
      const newDone = !x.done;
      if (newDone) {
        setTimeout(() => pushToast('Tarefa concluída', {
          kind: 'success',
          undo: () => updateItem(id, { done: false }),
        }), 80);
      }
      return { ...x, done: newDone };
    }));
  }, [pushToast, updateItem]);

  const deleteItem = useCallback((id) => {
    const item = items.find(x => x.id === id);
    if (!item) return;
    setItems(prev => prev.filter(x => x.id !== id));
    setSelectedId(null);
    pushToast('Item excluído', {
      kind: 'danger',
      undo: () => setItems(prev => [item, ...prev]),
    });
  }, [items, pushToast]);

  const updateCategory = useCallback((id, patch) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    pushToast('Categoria atualizada', { kind: 'success' });
  }, [pushToast]);

  const getCat = useCallback((catId) => categories.find(c => c.id === catId), [categories]);

  return {
    items, categories, tab, selectedId, toasts, searchOpen, tweaksOpen, accent, density,
    setTab, setSelectedId, setSearchOpen, setTweaksOpen, setAccent, setDensity,
    addItem, updateItem, toggleDone, deleteItem, updateCategory, getCat, pushToast,
  };
}

// Group items by day
function groupByDay(items) {
  const groups = [];
  let curr = null;
  items.forEach(it => {
    const day = startOfDay(it.createdAt);
    if (!curr || curr.day !== day) {
      curr = { day, label: dayLabel(it.createdAt), items: [] };
      groups.push(curr);
    }
    curr.items.push(it);
  });
  return groups;
}

// Group tasks by due
function groupTasksByDue(tasks) {
  const buckets = { hoje: [], amanha: [], semana: [], depois: [], semData: [], concluidas: [] };
  const todayStart = startOfDay(Date.now());
  const tomorrowStart = todayStart + 86400000;
  const weekEnd = todayStart + 86400000 * 7;
  tasks.forEach(t => {
    if (t.done) { buckets.concluidas.push(t); return; }
    if (!t.dueAt) { buckets.semData.push(t); return; }
    const due = startOfDay(t.dueAt);
    if (due <= todayStart) buckets.hoje.push(t);
    else if (due === tomorrowStart) buckets.amanha.push(t);
    else if (due < weekEnd) buckets.semana.push(t);
    else buckets.depois.push(t);
  });
  return buckets;
}

Object.assign(window, {
  PALETTE, INITIAL_CATEGORIES, INITIAL_ITEMS,
  useStore, parseInput, groupByDay, groupTasksByDue,
  dayLabel, timeLabel, dueLabel, isSameDay, startOfDay,
});
