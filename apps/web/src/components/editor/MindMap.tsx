// Mind map baseado em React Flow (xyflow). Nós custom (ThoughtNode) com texto
// editável, conexões smoothstep, auto-save debounced.
//
// Toolbar: + nó, fit-view, deletar selecionados.
// Atalhos no nó: Tab cria filho à direita, Enter encerra edição, Esc descarta.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ThoughtNode, type ThoughtNodeData } from './ThoughtNode';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

export interface MindMapDoc {
  nodes: Node<ThoughtNodeData>[];
  edges: Edge[];
}

interface MindMapProps {
  initial?: unknown | null;
  /** Cor padrão pra novos nós (vinda da categoria da nota, se houver). */
  defaultColor?: string | null;
  onChange: (doc: MindMapDoc) => void;
}

const nodeTypes: NodeTypes = {
  thought: ThoughtNode as unknown as NodeTypes['thought'],
};

const SEED: MindMapDoc = {
  nodes: [
    {
      id: 'root',
      type: 'thought',
      position: { x: 320, y: 200 },
      data: { text: 'Ideia central', autoEdit: true } as ThoughtNodeData,
    },
  ],
  edges: [],
};

function loadInitial(initial: unknown | null | undefined): MindMapDoc {
  if (initial && typeof initial === 'object' && 'nodes' in initial) {
    const i = initial as MindMapDoc;
    if (Array.isArray(i.nodes) && i.nodes.length > 0) {
      return { nodes: i.nodes, edges: Array.isArray(i.edges) ? i.edges : [] };
    }
  }
  return SEED;
}

export function MindMap(props: MindMapProps) {
  return (
    <div
      className="rounded-md border hairline overflow-hidden bg-bg"
      style={{ height: '70vh' }}
    >
      <ReactFlowProvider>
        <Inner {...props} />
      </ReactFlowProvider>
    </div>
  );
}

function Inner({ initial, defaultColor, onChange }: MindMapProps) {
  const seed = useMemo(() => loadInitial(initial), [initial]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ThoughtNodeData>>(seed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(seed.edges);
  const { fitView, screenToFlowPosition } = useReactFlow<Node<ThoughtNodeData>, Edge>();

  // mantém uma ref do estado atual pra event listeners não pegarem snapshot velho
  const stateRef = useRef({ nodes, edges });
  stateRef.current = { nodes, edges };

  // Debounced save
  const debouncedEmit = useDebouncedCallback((doc: MindMapDoc) => onChange(doc), 700);
  useEffect(() => {
    debouncedEmit({ nodes, edges });
  }, [nodes, edges, debouncedEmit]);

  // Eventos vindos do ThoughtNode
  useEffect(() => {
    function onEdit(e: Event) {
      const { id, text } = (e as CustomEvent<{ id: string; text: string }>).detail;
      setNodes((curr) =>
        curr.map((n) =>
          n.id === id
            ? { ...n, data: { ...(n.data as ThoughtNodeData), text, autoEdit: false } }
            : n,
        ),
      );
    }
    function onAddChild(e: Event) {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      const parent = stateRef.current.nodes.find((n) => n.id === id);
      if (!parent) return;
      const newId = `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const newNode: Node<ThoughtNodeData> = {
        id: newId,
        type: 'thought',
        position: { x: parent.position.x + 220, y: parent.position.y + 40 },
        data: { text: '', color: defaultColor ?? null, autoEdit: true },
      };
      setNodes((curr) => [...curr, newNode]);
      setEdges((curr) => [
        ...curr,
        { id: `e_${id}_${newId}`, source: id, target: newId, type: 'smoothstep' },
      ]);
    }

    window.addEventListener('thought:edit', onEdit);
    window.addEventListener('thought:add-child', onAddChild);
    return () => {
      window.removeEventListener('thought:edit', onEdit);
      window.removeEventListener('thought:add-child', onAddChild);
    };
  }, [setNodes, setEdges, defaultColor]);

  const onConnect = useCallback(
    (conn: Connection) => {
      setEdges((eds) => addEdge({ ...conn, type: 'smoothstep' }, eds));
    },
    [setEdges],
  );

  const addNode = useCallback(() => {
    const newId = `n_${Date.now().toString(36)}`;
    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    setNodes((curr) => [
      ...curr,
      {
        id: newId,
        type: 'thought',
        position: center,
        data: { text: '', color: defaultColor ?? null, autoEdit: true },
      },
    ]);
  }, [setNodes, defaultColor, screenToFlowPosition]);

  const removeSelected = useCallback(() => {
    setNodes((curr) => curr.filter((n) => !n.selected));
    setEdges((curr) =>
      curr.filter((e) => {
        // remove edges órfãs também
        const fromExists = stateRef.current.nodes.some((n) => n.id === e.source && !n.selected);
        const toExists = stateRef.current.nodes.some((n) => n.id === e.target && !n.selected);
        return fromExists && toExists && !e.selected;
      }),
    );
  }, [setNodes, setEdges]);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} color="var(--hair)" />
        <Controls showInteractive={false} />
      </ReactFlow>

      <div className="absolute top-3 right-3 z-10 flex gap-1 rounded-md border hairline bg-surface shadow-card p-1">
        <ToolbarBtn onClick={addNode} label="+ nó" />
        <ToolbarBtn onClick={() => fitView({ padding: 0.2, duration: 250 })} label="ajustar" />
        <ToolbarBtn onClick={removeSelected} label="apagar" danger />
      </div>

      <p className="absolute bottom-3 left-3 z-10 text-[10px] font-mono uppercase tracking-mono text-ink-3 bg-surface/70 backdrop-blur px-2 py-1 rounded">
        duplo-clique pra editar · Tab cria filho · Enter sai
      </p>
    </div>
  );
}

function ToolbarBtn({
  onClick,
  label,
  danger,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-xs rounded transition-colors ${
        danger ? 'text-danger hover:bg-danger/10' : 'text-ink-2 hover:text-ink hover:bg-surface-2'
      }`}
    >
      {label}
    </button>
  );
}
