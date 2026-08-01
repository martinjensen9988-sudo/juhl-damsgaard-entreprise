import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Users, X } from 'lucide-react';
import { formatDate } from '@/lib/format';

const DAY_NAMES = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export default function Ugeplanlaegning() {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = getWeekDates(weekOffset);

  const load = async () => {
    setLoading(true);
    try {
      const [e, p] = await Promise.all([
        base44.entities.Employee.list('-created_date', 200),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setEmployees(e.filter((emp) => emp.status === 'Aktiv'));
      setProjects(p);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadAssignments = useCallback(async () => {
    try {
      const all = await base44.entities.Assignment.list('-date', 500);
      setAssignments(all.filter((a) => a.date >= weekDates[0] && a.date <= weekDates[6]));
    } catch (err) { console.error(err); }
  }, [weekDates[0], weekDates[6]]);

  useEffect(() => { load(); }, []);
  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const assignedNames = assignments.map((a) => a.employee_name);
  const availableEmployees = employees.filter((e) => !assignedNames.includes(e.name));

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const employeeName = draggableId;

    if (destination.droppableId === 'pool') {
      const entry = assignments.find((a) => a.employee_name === employeeName && a.date === source.droppableId);
      if (entry) { await base44.entities.Assignment.delete(entry.id); loadAssignments(); }
    } else if (source.droppableId === 'pool') {
      const project = projects.find((p) => p.status === 'I gang') || projects[0];
      await base44.entities.Assignment.create({
        project_id: project?.id || '', project_name: project?.name || '',
        employee_name: employeeName, date: destination.droppableId,
      });
      loadAssignments();
    } else {
      const entry = assignments.find((a) => a.employee_name === employeeName && a.date === source.droppableId);
      if (entry) { await base44.entities.Assignment.update(entry.id, { date: destination.droppableId }); loadAssignments(); }
    }
  };

  const updateProject = async (entryId, projectId) => {
    const project = projects.find((p) => p.id === projectId);
    await base44.entities.Assignment.update(entryId, { project_id: projectId, project_name: project?.name || '' });
    loadAssignments();
  };

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Ugeplanlægning</h1>
          <p className="text-slate-500 mt-1">Træk medarbejdere onto dage for at planlægge ugen</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>I dag</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-[180px_repeat(7,1fr)] gap-2">
          {/* Employee pool */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Ledige</div>
            <Droppable droppableId="pool">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="bg-slate-100 rounded-lg p-2 min-h-[300px] space-y-2">
                  {availableEmployees.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center pt-4">Alle er planlagt</p>
                  ) : availableEmployees.map((e, idx) => (
                    <Draggable key={e.name} draggableId={e.name} index={idx}>
                      {(p) => (
                        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                          className="bg-white rounded-lg p-2.5 shadow-sm border border-slate-200 cursor-grab hover:shadow-md transition-shadow">
                          <div className="text-sm font-medium text-slate-900">{e.name}</div>
                          <div className="text-xs text-slate-400">{e.trade}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Day columns */}
          {weekDates.map((date, dayIdx) => {
            const dayAssignments = assignments.filter((a) => a.date === date);
            const isWeekend = dayIdx >= 5;
            return (
              <div key={date}>
                <div className={`text-xs font-semibold uppercase mb-2 ${isWeekend ? 'text-slate-300' : 'text-slate-500'}`}>
                  {DAY_NAMES[dayIdx]} <span className="font-normal normal-case">{formatDate(date).slice(0, 5)}</span>
                </div>
                <Droppable droppableId={date}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`rounded-lg p-2 min-h-[300px] space-y-2 ${isWeekend ? 'bg-slate-50' : 'bg-white border border-slate-200'}`}>
                      {dayAssignments.map((a, idx) => (
                        <Draggable key={a.id} draggableId={a.employee_name} index={idx}>
                          {(p) => (
                            <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                              className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 cursor-grab hover:shadow-sm">
                              <div className="flex items-start justify-between gap-1">
                                <div className="text-sm font-medium text-slate-900 truncate">{a.employee_name}</div>
                              </div>
                              <Select value={a.project_id} onValueChange={(v) => updateProject(a.id, v)}>
                                <SelectTrigger className="h-7 mt-1 text-xs"><SelectValue placeholder="Projekt" /></SelectTrigger>
                                <SelectContent>
                                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
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
    </div>
  );
}