import { useEffect, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Users, X, GripVertical } from 'lucide-react';
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

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const isPoolItem = draggableId.startsWith('pool-');
    const employeeName = isPoolItem ? draggableId.slice(5) : null;
    const assignmentId = isPoolItem ? null : draggableId.slice(8);

    // Pool → Pool: nothing
    if (source.droppableId === 'pool' && destination.droppableId === 'pool') return;

    // Day → Pool: delete assignment
    if (destination.droppableId === 'pool') {
      if (assignmentId) {
        await base44.entities.Assignment.delete(assignmentId);
        loadAssignments();
      }
      return;
    }

    // Pool → Day: create new assignment
    if (source.droppableId === 'pool') {
      // Prevent duplicate (same employee, same day)
      const exists = assignments.find(
        (a) => a.employee_name === employeeName && a.date === destination.droppableId
      );
      if (exists) return;
      const project = projects.find((p) => p.status === 'I gang') || projects[0];
      await base44.entities.Assignment.create({
        project_id: project?.id || '',
        project_name: project?.name || '',
        employee_name: employeeName,
        date: destination.droppableId,
      });
      loadAssignments();
      return;
    }

    // Day → Day: move assignment
    if (assignmentId) {
      const entry = assignments.find((a) => a.id === assignmentId);
      if (!entry) return;
      // Prevent duplicate at destination
      if (source.droppableId !== destination.droppableId) {
        const exists = assignments.find(
          (a) => a.id !== assignmentId && a.employee_name === entry.employee_name && a.date === destination.droppableId
        );
        if (exists) return;
      }
      await base44.entities.Assignment.update(assignmentId, { date: destination.droppableId });
      loadAssignments();
    }
  };

  const updateProject = async (entryId, projectId) => {
    const project = projects.find((p) => p.id === projectId);
    await base44.entities.Assignment.update(entryId, { project_id: projectId, project_name: project?.name || '' });
    loadAssignments();
  };

  const removeAssignment = async (entryId) => {
    await base44.entities.Assignment.delete(entryId);
    loadAssignments();
  };

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Ugeplanlægning</h1>
          <p className="text-slate-500 mt-1">Træk medarbejdere fra puljen over på dage og vælg projekt</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>I dag</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-[200px_repeat(7,minmax(140px,1fr))] gap-2">
          {/* Employee pool */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Medarbejdere
            </div>
            <Droppable droppableId="pool">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-slate-100 rounded-lg p-2 min-h-[400px] space-y-2"
                >
                  {employees.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center pt-4">Ingen aktive medarbejdere</p>
                  ) : employees.map((e, idx) => {
                    const busyDays = assignments.filter((a) => a.employee_name === e.name).length;
                    return (
                      <Draggable key={`pool-${e.name}`} draggableId={`pool-${e.name}`} index={idx}>
                        {(p, snapshot) => (
                          <div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            className={`bg-white rounded-lg p-2.5 shadow-sm border border-slate-200 cursor-grab hover:shadow-md transition-shadow ${snapshot.isDragging ? 'ring-2 ring-amber-400' : ''}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900 truncate">{e.name}</div>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                  {e.trade}
                                  {busyDays > 0 && <span className="text-amber-500">• {busyDays} dag{busyDays > 1 ? 'e' : ''}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Day columns */}
          {weekDates.map((date, dayIdx) => {
            const dayAssignments = assignments.filter((a) => a.date === date);
            const isWeekend = dayIdx >= 5;
            const isToday = date === new Date().toISOString().slice(0, 10);
            return (
              <div key={date}>
                <div className={`text-xs font-semibold uppercase mb-2 flex items-center gap-1 ${isWeekend ? 'text-slate-300' : 'text-slate-500'}`}>
                  {DAY_NAMES[dayIdx]}
                  <span className="font-normal normal-case">{formatDate(date).slice(0, 5)}</span>
                  {isToday && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
                <Droppable droppableId={date}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`rounded-lg p-2 min-h-[400px] space-y-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-amber-50 border-2 border-dashed border-amber-300' :
                        isWeekend ? 'bg-slate-50 border border-slate-100' : 'bg-white border border-slate-200'
                      }`}
                    >
                      {dayAssignments.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-xs text-slate-300 text-center pt-4">—</p>
                      )}
                      {dayAssignments.map((a, idx) => {
                        const emp = employees.find((e) => e.name === a.employee_name);
                        return (
                          <Draggable key={`assign-${a.id}`} draggableId={`assign-${a.id}`} index={idx}>
                            {(p, snap) => (
                              <div
                                ref={p.innerRef}
                                {...p.draggableProps}
                                {...p.dragHandleProps}
                                className={`bg-amber-50 border border-amber-200 rounded-lg p-2.5 cursor-grab hover:shadow-sm ${snap.isDragging ? 'shadow-lg ring-2 ring-amber-400' : ''}`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-900 truncate">{a.employee_name}</div>
                                    <div className="text-xs text-slate-400">{emp?.trade}</div>
                                  </div>
                                  <button
                                    onClick={() => removeAssignment(a.id)}
                                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <Select value={a.project_id} onValueChange={(v) => updateProject(a.id, v)}>
                                  <SelectTrigger className="h-7 mt-1.5 text-xs">
                                    <SelectValue placeholder="Vælg projekt" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {projects.map((proj) => (
                                      <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <p className="text-xs text-slate-400 pt-2">
        Tip: Træk et kort tilbage til puljen for at fjerne tildelingen. Brug ×-knappen for at slette direkte.
      </p>
    </div>
  );
}