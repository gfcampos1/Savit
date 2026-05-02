import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { Task } from '@savit/shared';
import { Column } from './Column';
import { DraggingTaskCard } from './SortableTaskCard';
import { KANBAN_COLUMNS } from './columns';
import { useMoveTask } from '@/hooks/useTasks';

interface BoardProps {
  tasks: Task[];
}

export function Board({ tasks }: BoardProps) {
  const move = useMoveTask();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Sensor com threshold pra não disparar drag em cliques no checkbox
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>(KANBAN_COLUMNS.map((c) => [c.key, []]));
    for (const t of tasks) {
      const bucket = map.get(t.column) ?? map.get('hoje');
      bucket?.push(t);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [tasks]);

  const draggingTask = draggingId ? tasks.find((t) => t.id === draggingId) ?? null : null;

  function onDragStart(e: DragStartEvent) {
    setDraggingId(e.active.id as string);
  }

  function onDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id as string;
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Identifica a coluna destino: pode ser uma droppable de coluna OU outra task
    let destColumn: string | null = null;
    let destIndex = 0;

    const overData = over.data.current;
    if (overData?.type === 'column') {
      destColumn = overData.column as string;
      destIndex = (grouped.get(destColumn) ?? []).length;
    } else if (overData?.type === 'task') {
      destColumn = overData.column as string;
      const arr = grouped.get(destColumn) ?? [];
      const overIdx = arr.findIndex((t) => t.id === over.id);
      destIndex = overIdx === -1 ? arr.length : overIdx;
    }

    if (!destColumn) return;
    // sem mudança nenhuma — abortar
    if (destColumn === activeTask.column && destIndex === activeTask.sortOrder) return;

    move.mutate({ id: activeTask.id, column: destColumn, sortOrder: destIndex });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {KANBAN_COLUMNS.map((col) => (
          <Column
            key={col.key}
            column={col}
            tasks={grouped.get(col.key) ?? []}
            draggingId={draggingId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180 }}>
        {draggingTask ? <DraggingTaskCard task={draggingTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
