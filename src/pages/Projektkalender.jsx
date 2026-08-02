import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameDay, isSameMonth, parseISO, isValid } from 'date-fns';
import { da } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, Flag } from 'lucide-react';

const statusColor = {
  Planlægning: 'bg-blue-500',
  'I gang': 'bg-amber-500',
  Færdig: 'bg-emerald-500',
  Afsluttet: 'bg-slate-500',
  'På hold': 'bg-purple-500',
};

const typeColor = {
  Gravearbejde: 'text-blue-700',
  Kloak: 'text-teal-700',
  Asfalt: 'text-slate-700',
  Beton: 'text-stone-700',
  Nedrivning: 'text-red-700',
  Anlæg: 'text-emerald-700',
  Andet: 'text-slate-600',
};

export default function Projektkalender() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Project.list();
      setProjects(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const activeProjects = useMemo(() => projects.filter((p) => p.status !== 'Afsluttet' && p.status !== 'På hold'), [projects]);

  const toKey = (d) => (isValid(d) ? format(d, 'yyyy-MM-dd') : null);

  // Map each project to its start, end, and deadline events
  const events = useMemo(() => {
    const map = {};
    activeProjects.forEach((p) => {
      [['start', p.start_date], ['end', p.end_date]].forEach(([kind, ds]) => {
        if (!ds) return;
        const d = parseISO(ds);
        if (!isValid(d)) return;
        const key = toKey(d);
        if (!map[key]) map[key] = [];
        map[key].push({ project: p, kind });
      });
    });
    return map;
  }, [activeProjects]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const stats = useMemo(() => {
    const upcoming = activeProjects.filter((p) => {
      if (!p.end_date) return false;
      const d = parseISO(p.end_date);
      const horizon = addMonths(new Date(), 1);
      return isValid(d) && d >= new Date() && d <= horizon;
    });
    return { active: activeProjects.length, upcoming: upcoming.length };
  }, [activeProjects]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projektkalender</h1>
            <p className="text-slate-500 mt-0.5">Alle aktive projekter og vigtige deadlines for hele firmaet</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCursor(addMonths(cursor, -1))}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" onClick={() => { setCursor(startOfMonth(new Date())); setSelected(null); }}>I dag</Button>
          <Button variant="outline" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Aktive projekter</div>
          <div className="text-2xl font-bold text-slate-900">{stats.active}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Deadlines (næste måned)</div>
          <div className="text-2xl font-bold text-amber-600">{stats.upcoming}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">Måned</div>
          <div className="text-2xl font-bold text-slate-900 capitalize">{format(cursor, 'MMMM yyyy', { locale: da })}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = toKey(day);
              const dayEvents = events[key] || [];
              const isToday = isSameDay(day, new Date());
              const isSelected = selected && isSameDay(day, parseISO(selected));
              return (
                <button
                  key={key}
                  onClick={() => setSelected(isSelected ? null : key)}
                  className={`min-h-[64px] rounded-lg border p-1.5 text-left transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'} ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                >
                  <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : isSameMonth(day, cursor) ? 'text-slate-700' : 'text-slate-300'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev, i) => (
                      <div key={i} className={`flex items-center gap-1 text-[10px] leading-tight ${typeColor[ev.project.type] || 'text-slate-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor[ev.project.status] || 'bg-slate-400'}`} />
                        <span className="truncate">{ev.project.name}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div className="text-[10px] text-slate-400">+{dayEvents.length - 3} mere</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">
            {selected ? `Dag: ${format(parseISO(selected), 'd. MMMM yyyy', { locale: da })}` : 'Vælg en dato'}
          </h3>
          {selected ? (
            (events[selected] || []).length === 0 ? (
              <p className="text-sm text-slate-400">Ingen projekthændelser denne dag.</p>
            ) : (
              <div className="space-y-2">
                {events[selected].map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50">
                    <Flag className={`w-4 h-4 mt-0.5 flex-shrink-0 ${ev.kind === 'end' ? 'text-red-500' : 'text-blue-500'}`} />
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-slate-900 truncate">{ev.project.name}</div>
                      <div className="text-xs text-slate-500">
                        {ev.kind === 'start' ? 'Startdato' : 'Slutdato / deadline'} · {ev.project.status}
                      </div>
                      {ev.project.customer_name && <div className="text-xs text-slate-400">{ev.project.customer_name}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-sm text-slate-400">Klik på en dato i kalenderen for at se projekthændelser den dag.</p>
          )}
          {/* Upcoming deadlines list */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Kommende deadlines</h4>
            <div className="space-y-1.5">
              {activeProjects.filter((p) => p.end_date).sort((a, b) => a.end_date.localeCompare(b.end_date)).slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-700">{p.name}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{format(parseISO(p.end_date), 'dd.MM', { locale: da })}</span>
                </div>
              ))}
              {activeProjects.filter((p) => p.end_date).length === 0 && <p className="text-xs text-slate-400">Ingen deadlines.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}