import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import { Filter, Plus } from 'lucide-react';

const STAGES = [
  { key: 'Nyt lead', color: 'bg-slate-100 border-slate-200', badge: 'bg-slate-200 text-slate-700' },
  { key: 'Kontaktet', color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-200 text-blue-700' },
  { key: 'Tilbud sendt', color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-200 text-amber-700' },
  { key: 'Forhandling', color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-200 text-purple-700' },
  { key: 'Vundet', color: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-200 text-emerald-700' },
  { key: 'Tabt', color: 'bg-red-50 border-red-200', badge: 'bg-red-200 text-red-700' },
];

export default function SalgsPipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setLeads(await base44.entities.Lead.list('-created_date', 200));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newStage = destination.droppableId;
    const lead = leads.find((l) => l.id === draggableId);
    if (!lead || lead.stage === newStage) return;
    try {
      await base44.entities.Lead.update(draggableId, { stage: newStage });
      setLeads(leads.map((l) => (l.id === draggableId ? { ...l, stage: newStage } : l)));
    } catch (e) { console.error(e); }
  };

  const totalValue = leads.filter((l) => l.stage === 'Vundet').reduce((s, l) => s + (l.estimated_value || 0), 0);
  const pipelineValue = leads.filter((l) => !['Vundet', 'Tabt'].includes(l.stage)).reduce((s, l) => s + (l.estimated_value || 0), 0);

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Salgspipeline</h1>
          <p className="text-slate-500 mt-1">Træk leads mellem faser for at opdatere status</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right"><div className="text-xs text-slate-500">Pipeline værdi</div><div className="font-bold text-slate-900">{formatDKK(pipelineValue)}</div></div>
          <div className="text-right"><div className="text-xs text-slate-500">Vundet</div><div className="font-bold text-emerald-600">{formatDKK(totalValue)}</div></div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.key);
            const stageValue = stageLeads.reduce((s, l) => s + (l.estimated_value || 0), 0);
            return (
              <div key={stage.key} className={`rounded-xl border ${stage.color} flex flex-col min-h-[400px]`}>
                <div className="p-3 border-b border-current/10">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${stage.badge}`}>{stage.key}</span>
                    <span className="text-xs text-slate-500 font-medium">{stageLeads.length}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{formatDKK(stageValue)}</div>
                </div>
                <Droppable droppableId={stage.key}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="p-2 flex-1 space-y-2 overflow-y-auto">
                      {stageLeads.map((lead, idx) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={idx}>
                          {(p, snapshot) => (
                            <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                              className={`bg-white rounded-lg p-3 shadow-sm border border-slate-200 cursor-grab ${snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'} transition-all`}>
                              <div className="font-medium text-slate-900 text-sm">{lead.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{lead.customer_name || '—'}</div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{lead.project_type}</span>
                                {lead.estimated_value > 0 && <span className="text-xs font-semibold text-slate-700">{formatDKK(lead.estimated_value)}</span>}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {stageLeads.length === 0 && <p className="text-xs text-slate-400 text-center pt-4">Ingen leads</p>}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}