import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameDay, isSameMonth, parseISO, isValid, startOfWeek, endOfWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, Flag, Briefcase, CheckSquare, Users, Clock, GripVertical } from 'lucide-react';

const projectStatusColor = {
  Planlægning: 'bg-blue-500',
  'I gang': 'bg-amber-500',
  Færdig: 'bg-emerald-500',
  Afsluttet: 'bg-slate-500',
  'På hold': 'bg-purple-500',
};
const taskStatusColor = {
  'Ikke startet': 'bg-slate-400',
  'I gang': 'bg-blue-500',
  Afventer: 'bg-amber-500',
  Gennemført: 'bg-emerald-500',
};
const taskPrioRing = { Høj: 'ring-red-400', Normal: 'ring-slate-300', Lav: 'ring-slate-200' };

export default function Projektkalender() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [selected, setSelected] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ projects: true, tasks: true, employees: true });

  const load = async () => {
    setLoading(true);
    try {
      const [p, t, a, s] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Task.list().catch(() => []),
        base44.entities.Assignment.list().catch(() => []),
        base44.entities.Shift.list().catch(() => []),
      ]);
      setProjects(p || []);
      setTasks(t || []);
      setAssignments(a || []);
      setShifts(s || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const activeProjects = useMemo(() => projects.filter((p) => p.status !== 'Afsluttet' && p.status !== 'På hold'), [projects]);
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== 'Gennemført'), [tasks]);

  const toKey = (d) => (isValid(d) ? format(d, 'yyyy-MM-dd') : null);

  // Build event map: key -> array of events
  const events = useMemo(() => {
    const map = {};
    const push = (key, ev) => { if (!key) return; if (!map[key]) map[key] = []; map[key].push(ev); };

    if (filters.projects) {
      activeProjects.forEach((p) => {
        if (p.start_date) push(toKey(parseISO(p.start_date)), { kind: 'project-start', source: p, label: p.name, color: projectStatusColor[p.status] || 'bg-slate-400', icon: Briefcase, entity: 'Project', id: p.id, field: 'start_date' });
        if (p.end_date) push(toKey(parseISO(p.end_date)), { kind: 'project-end', source: p, label: p.name, color: projectStatusColor[p.status] || 'bg-slate-400', icon: Flag, entity: 'Project', id: p.id, field: 'end_date' });
      });
    }
    if (filters.tasks) {
      openTasks.forEach((t) => {
        if (t.due_date) push(toKey(parseISO(t.due_date)), { kind: 'task', source: t, label: t.title, color: taskStatusColor[t.status] || 'bg-slate-400', icon: CheckSquare, entity: 'Task', id: t.id, field: 'due_date', ring: taskPrioRing[t.priority] });
      });
    }
    if (filters.employees) {
      assignments.forEach((a) => {
        if (a.date) push(toKey(parseISO(a.date)), { kind: 'assignment', source: a, label: a.employee_name, sub: a.project_name, color: 'bg-teal-500', icon: Users, entity: 'Assignment', id: a.id, field: 'date' });
      });
      shifts.forEach((s) => {
        if (s.date && s.status !== 'Aflyst') push(toKey(parseISO(s.date)), { kind: 'shift', source: s, label: s.employee_name, sub: s.role, color: 'bg-cyan-500', icon: Clock, entity: 'Shift', id: s.id, field: 'date' });
      });
    }
    return map;
  }, [activeProjects, openTasks, assignments, shifts, filters]);

  // Calendar grid: include full weeks
  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const stats = useMemo(() => {
    const upcoming = activeProjects.filter((p) => {
      if (!p.end_date) return false;
      const d = parseISO(p.end_date);
      return isValid(d) && d >= new Date() && d <= addMonths(new Date(), 1);
    });
    return { active: activeProjects.length, upcoming: upcoming.length, tasks: openTasks.length, employees: assignments.length + shifts.filter((s) => s.status !== 'Aflyst').length };
  }, [activeProjects, openTasks, assignments, shifts]);

  // Drag and drop handlers
  const onDragStart = (e, ev) => { setDragItem(ev); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', ev.id); } catch {} };
  const onDragEnd = () => { setDragItem(null); setDragOverKey(null); };
  const onDragOver = (e, key) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverKey !== key) setDragOverKey(key); };
  const onDrop = async (e, key) => {
    e.preventDefault();
    setDragOverKey(null);
    if (!dragItem || !key) return;
    setSaving(true);
    try {
      if (dragItem.entity === 'Project') await base44.entities.Project.update(dragItem.id, { [dragItem.field]: key });
      else if (dragItem.entity === 'Task') await base44.entities.Task.update(dragItem.id, { due_date: key });
      else if (dragItem.entity === 'Assignment') await base44.entities.Assignment.update(dragItem.id, { date: key });
      else if (dragItem.entity === 'Shift') await base44.entities.Shift.update(dragItem.id, { date: key });
      await load();
    } catch (err) { console.error(err); alert('Kunne ikke flytte begivenheden'); }
    setDragItem(null);
    setSaving(false);
  };

  const toggleFilter = (key) => setFilters((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projektkalender</h1>
            <p className="text-slate-500 mt-0.5">Træk og slip opgaver, projekter og medarbejdere — alle deadlines samlet ét sted</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCursor(addMonths(cursor, -1))}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" onClick={() => { setCursor(startOfMonth(new Date())); setSelected(null); }}>I dag</Button>
          <Button variant="outline" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Aktive projekter</div><div className="text-2xl font-bold text-slate-900">{stats.active}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Deadlines (1 md)</div><div className="text-2xl font-bold text-amber-600">{stats.upcoming}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Åbne opgaver</div><div className="text-2xl font-bold text-blue-600">{stats.tasks}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Medarbejdertilbud</div><div className="text-2xl font-bold text-teal-600">{stats.employees}</div></div>
      </div>

      {/* Filter toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400">Vis:</span>
        {[
          ['projects', 'Projekter', 'bg-blue-500'],
          ['tasks', 'Opgaver', 'bg-slate-500'],
          ['employees', 'Medarbejdere', 'bg-teal-500'],
        ].map(([key, label, color]) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${filters[key] ? 'border-slate-300 bg-white text-slate-900' : 'border-slate-200 bg-slate-50 text-slate-400'}`}
          >
            <span className={`w-2 h-2 rounded-full ${filters[key] ? color : 'bg-slate-300'}`} />
            {label}
          </button>
        ))}
        <div className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
          <GripVertical className="w-3 h-3" /> Træk begivenheder for at omplanlægge
          {saving && <span className="text-amber-600 ml-2">Gemmer...</span>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-3 overflow-hidden">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = toKey(day);
              const dayEvents = events[key] || [];
              const isToday = isSameDay(day, new Date());
              const isSelected = selected && isSameDay(day, parseISO(selected));
              const isDragOver = dragOverKey === key;
              return (
                <div
                  key={key}
                  onClick={() => setSelected(isSelected ? null : key)}
                  onDragOver={(e) => onDragOver(e, key)}
                  onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                  onDrop={(e) => onDrop(e, key)}
                  className={`min-h-[78px] rounded-lg border p-1 text-left transition cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'} ${isDragOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''} ${isToday ? 'ring-2 ring-blue-400' : ''} ${!isSameMonth(day, cursor) ? 'bg-slate-50/50' : 'bg-white'}`}
                >
                  <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : isSameMonth(day, cursor) ? 'text-slate-700' : 'text-slate-300'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 4).map((ev, i) => {
                      const Icon = ev.icon;
                      return (
                        <div
                          key={i}
                          draggable
                          onDragStart={(e) => onDragStart(e, ev)}
                          onDragEnd={onDragEnd}
                          title={`${ev.label}${ev.sub ? ' — ' + ev.sub : ''}`}
                          className={`group flex items-center gap-1 text-[10px] leading-tight rounded px-1 py-0.5 bg-slate-50 hover:bg-slate-100 cursor-grab active:cursor-grabbing ${ev.ring ? `ring-1 ${ev.ring}` : ''} ${dragItem?.id === ev.id ? 'opacity-40' : ''}`}
                        >
                          <Icon className="w-2.5 h-2.5 flex-shrink-0 text-slate-400" />
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.color}`} />
                          <span className="truncate text-slate-700">{ev.label}</span>
                          {ev.sub && <span className="truncate text-slate-400 hidden sm:inline">· {ev.sub}</span>}
                        </div>
                      );
                    })}
                    {dayEvents.length > 4 && <div className="text-[10px] text-slate-400 pl-1">+{dayEvents.length - 4} mere</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">
            {selected ? format(parseISO(selected), 'd. MMMM yyyy', { locale: da }) : 'Vælg en dato'}
          </h3>
          {selected ? (
            (events[selected] || []).length === 0 ? (
              <p className="text-sm text-slate-400">Ingen begivenheder denne dag. Træk en begivenhed hertil for at omplanlægge.</p>
            ) : (
              <div className="space-y-2">
                {events[selected].map((ev, i) => {
                  const Icon = ev.icon;
                  const kindLabel = {
                    'project-start': 'Projekt start',
                    'project-end': 'Deadline',
                    task: 'Opgave deadline',
                    assignment: 'Medarbejder tildelt',
                    shift: 'Vagt',
                  }[ev.kind];
                  return (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 group">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${ev.kind === 'project-end' ? 'text-red-500' : 'text-slate-500'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-slate-900 truncate">{ev.label}</div>
                        <div className="text-xs text-slate-500">{kindLabel}{ev.sub ? ` · ${ev.sub}` : ''}</div>
                        {ev.source.assigned_to && <div className="text-xs text-slate-400">👤 {ev.source.assigned_to}</div>}
                        {ev.source.status && <div className="text-xs text-slate-400">{ev.source.status}</div>}
                      </div>
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <p className="text-sm text-slate-400">Klik på en dato for at se begivenheder — eller træk en begivenhed til en anden dag for at flytte den.</p>
          )}

          {/* Upcoming deadlines list */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="font-semibold text-slate-500 uppercase mb-2 text-xs">Kommende deadlines</h4>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {activeProjects.filter((p) => p.end_date).sort((a, b) => a.end_date.localeCompare(b.end_date)).slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-700 flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${projectStatusColor[p.status] || 'bg-slate-400'}`} />{p.name}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{format(parseISO(p.end_date), 'dd.MM', { locale: da })}</span>
                </div>
              ))}
              {openTasks.filter((t) => t.due_date).sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-700 flex items-center gap-1.5"><CheckSquare className="w-3 h-3 text-slate-400" />{t.title}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{format(parseISO(t.due_date), 'dd.MM', { locale: da })}</span>
                </div>
              ))}
              {activeProjects.filter((p) => p.end_date).length === 0 && openTasks.filter((t) => t.due_date).length === 0 && <p className="text-xs text-slate-400">Ingen deadlines.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}