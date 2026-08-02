import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MapPin, Calendar } from 'lucide-react';
import { formatDKK, formatDate } from '@/lib/format';

// Kanban-søjler og den kanoniske status der gemmes ved flytning
const COLUMNS = [
  { id: 'Ikke startet', status: 'Planlægning', accent: 'border-t-slate-400', dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600' },
  { id: 'I gang', status: 'I gang', accent: 'border-t-blue-500', dot: 'bg-blue-500', chip: 'bg-blue-100 text-blue-700' },
  { id: 'Færdig', status: 'Færdig', accent: 'border-t-emerald-500', dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700' },
];

const statusToColumn = (status) => {
  if (status === 'I gang') return 'I gang';
  if (status === 'Færdig' || status === 'Afsluttet') return 'Færdig';
  return 'Ikke startet'; // Planlægning + På hold
};

export default function ProjectKanban({ projects, onMove }) {
  const [columns, setColumns] = useState(() => {
    const groups = { 'Ikke startet': [], 'I gang': [], 'Færdig': [] };
    projects.forEach((p) => groups[statusToColumn(p.status)].push(p));
    return groups;
  });

  // hold lokal kopi synkroniseret når projekter ændres udefra
  React.useEffect(() => {
    const groups = { 'Ikke startet': [], 'I gang': [], 'Færdig': [] };
    projects.forEach((p) => groups[statusToColumn(p.status)].push(p));
    setColumns(groups);
  }, [projects]);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const srcCol = source.droppableId;
    const dstCol = destination.droppableId;
    if (srcCol === dstCol) return;

    const moved = columns[srcCol][source.index];
    const next = { ...columns };
    next[srcCol] = [...columns[srcCol]];
    next[dstCol] = [...columns[dstCol]];
    next[srcCol].splice(source.index, 1);
    next[dstCol].splice(destination.index, 0, moved);
    setColumns(next);

    const targetCol = COLUMNS.find((c) => c.id === dstCol);
    if (moved && targetCol && moved.status !== targetCol.status) {
      onMove(moved.id, targetCol.status);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const items = columns[col.id] || [];
          return (
            <div key={col.id} className={`bg-slate-100 rounded-xl border-t-4 ${col.accent} flex flex-col min-h-[200px]`}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <h3 className="font-semibold text-slate-900 text-sm">{col.id}</h3>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 px-3 pb-3 space-y-2 min-h-[120px] rounded-b-xl transition-colors ${snapshot.isDraggingOver ? 'bg-amber-50' : ''}`}
                  >
                    {items.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-xs text-slate-400 text-center py-6">Træk projekter hertil</div>
                    )}
                    {items.map((p, idx) => (
                      <Draggable key={p.id} draggableId={p.id} index={idx}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition ${snap.isDragging ? 'shadow-lg ring-2 ring-amber-300' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-semibold text-slate-900 text-sm leading-tight">{p.name}</div>
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${col.chip}`}>
                                {p.type}
                              </span>
                            </div>
                            {p.customer_name && (
                              <div className="text-xs text-slate-500 mt-1">{p.customer_name}</div>
                            )}
                            <div className="space-y-1 mt-2 text-[11px] text-slate-500">
                              {p.start_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(p.start_date)}{p.end_date ? ` → ${formatDate(p.end_date)}` : ''}
                                </div>
                              )}
                              {p.address && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{p.address}</span>
                                </div>
                              )}
                            </div>
                            {p.budget != null && (
                              <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-[10px] text-slate-400">Budget</span>
                                <span className="text-xs font-semibold text-slate-900">{formatDKK(p.budget)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}