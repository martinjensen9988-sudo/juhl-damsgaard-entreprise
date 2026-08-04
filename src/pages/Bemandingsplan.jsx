import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Users, GripVertical, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/format';

export default function Bemandingsplan() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, e, a] = await Promise.all([
        base44.entities.Project.list().catch(() => []),
        base44.entities.Employee.list().catch(() => []),
        base44.entities.Assignment.list().catch(() => []),
      ]);
      setProjects((p || []).filter((x) => x.status === 'I gang' || x.status === 'Planlægning'));
      setEmployees((e || []).filter((x) => x.status === 'Aktiv'));
      setAssignments(a || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const dayAssignments = assignments.filter((a) => a.date === date);
  const assignedNames = new Set(dayAssignments.map((a) => a.employee_name));
  const pool = employees.filter((e) => !assignedNames.has(e.name));

  const onDragEnd = async (res) => {
    const { source, destination, draggableId } = res;
    if (!destination) return;
    const isPool = destination.droppableId === 'pool';
    const fromPool = source.droppableId === 'pool';

    if (isPool) {
      // delete assignment (moved back to pool)
      const a = dayAssignments.find((x) => x.id === draggableId);
      if (a) { await base44.entities.Assignment.delete(a.id); load(); }
      return;
    }

    const proj = projects.find((p) => p.id === destination.droppableId);
    if (!proj) return;

    if (fromPool) {
      // create assignment
      const emp = employees.find((e) => e.name === draggableId);
      if (emp) { await base44.entities.Assignment.create({ project_id: proj.id, project_name: proj.name, employee_name: emp.name, date, notes: '' }); load(); }
    } else {
      // move assignment to new project
      const a = dayAssignments.find((x) => x.id === draggableId);
      if (a && a.project_id !== proj.id) { await base44.entities.Assignment.update(a.id, { project_id: proj.id, project_name: proj.name }); load(); }
    }
  };

  const assignToFirst = async (empName) => {
    if (projects.length === 0) return;
    const proj = projects[0];
    await base44.entities.Assignment.create({ project_id: proj.id, project_name: proj.name, employee_name: empName, date, notes: '' });
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bemandingsplanlægning</h1>
            <p className="text-slate-500">Træk medarbejdere ind på projekter for valgt dato</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
          {/* Pool */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Ledige medarbejdere ({pool.length})</div>
            <Droppable droppableId="pool">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="bg-white rounded-xl border border-slate-200 p-2 min-h-[120px] space-y-2">
                  {pool.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Alle er tildelt</p>}
                  {pool.map((e, i) => (
                    <Draggable key={e.name} draggableId={e.name} index={i}>
                      {(p) => (
                        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100 cursor-grab active:cursor-grabbing hover:border-slate-300">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300" />
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">{e.name?.[0]?.toUpperCase()}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{e.name}</div>
                            <div className="text-[11px] text-slate-400 truncate">{e.trade}</div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Project lanes */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {projects.map((proj) => {
              const lanes = dayAssignments.filter((a) => a.project_id === proj.id);
              return (
                <Droppable key={proj.id} droppableId={proj.id}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="bg-white rounded-xl border border-slate-200 p-3 min-h-[160px] flex flex-col">
                      <div className="mb-2">
                        <div className="text-sm font-semibold text-slate-900 truncate">{proj.name}</div>
                        <div className="text-[11px] text-slate-400">{lanes.length} tildelt · {proj.status}</div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {lanes.map((a, i) => (
                          <Draggable key={a.id} draggableId={a.id} index={i}>
                            {(p) => (
                              <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} className="flex items-center gap-2 bg-slate-900 text-white rounded-lg p-2.5 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                                <div className="w-6 h-6 rounded-full bg-white/15 text-xs font-semibold flex items-center justify-center">{a.employee_name?.[0]?.toUpperCase()}</div>
                                <div className="flex-1 text-sm truncate">{a.employee_name}</div>
                                <button onClick={() => base44.entities.Assignment.delete(a.id).then(load)} className="p-0.5 rounded hover:bg-white/10"><Trash2 className="w-3 h-3 text-slate-300" /></button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {lanes.length === 0 && <div className="text-xs text-slate-300 text-center py-4 border border-dashed border-slate-200 rounded-lg">Træk medarbejder hertil</div>}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              );
            })}
            {projects.length === 0 && <div className="col-span-full text-center py-10 text-slate-400 text-sm">Ingen aktive projekter.</div>}
          </div>
        </div>
      </DragDropContext>

      <p className="text-xs text-slate-400">Tip: Træk medarbejdere fra venstre over på et projekt — eller flyt dem mellem projekter. Tilbage til venstre fjerner tildelingen.</p>
    </div>
  );
}