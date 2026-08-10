import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, HardHat, Users, Layers } from 'lucide-react';
import {
  startOfWeek, endOfWeek, addDays, format, isSameDay, isWithinInterval,
} from 'date-fns';
import { da } from 'date-fns/locale';

const TASK_COLORS = {
  Gravearbejde: 'bg-amber-100 border-amber-400 text-amber-800',
  Kørsel: 'bg-blue-100 border-blue-400 text-blue-800',
  Maskinarbejde: 'bg-purple-100 border-purple-400 text-purple-800',
  Håndarbejde: 'bg-emerald-100 border-emerald-400 text-emerald-800',
  Møde: 'bg-rose-100 border-rose-400 text-rose-800',
  Andet: 'bg-slate-100 border-slate-400 text-slate-700',
};
const TASK_DOT = {
  Gravearbejde: 'bg-amber-400',
  Kørsel: 'bg-blue-400',
  Maskinarbejde: 'bg-purple-400',
  Håndarbejde: 'bg-emerald-400',
  Møde: 'bg-rose-400',
  Andet: 'bg-slate-400',
};

const DAY_LABELS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

export default function Tidskalender() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [view, setView] = useState('employee'); // 'employee' | 'project'
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterProject, setFilterProject] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        setEntries(await base44.entities.TimeEntry.list('-created_date', 500));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const employees = useMemo(
    () => [...new Set(entries.map((e) => e.user_name).filter(Boolean))].sort(),
    [entries]
  );
  const projects = useMemo(
    () => [...new Set(entries.map((e) => e.project_name).filter(Boolean))].sort(),
    [entries]
  );

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (filterEmployee !== 'all' && e.user_name !== filterEmployee) return false;
        if (filterProject !== 'all' && e.project_name !== filterProject) return false;
        return true;
      }),
    [entries, filterEmployee, filterProject]
  );

  const inWeek = (e) => {
    if (!e.date) return false;
    try { return isWithinInterval(new Date(e.date), { start: weekStart, end: weekEnd }); }
    catch { return false; }
  };

  const weekEntries = useMemo(() => filtered.filter(inWeek), [filtered, weekStart, weekEnd]);

  const weekTotalHours = weekEntries.reduce((s, e) => s + (Number(e.hours) || 0), 0);

  // Rows depend on view
  const rows = view === 'employee'
    ? (filterEmployee === 'all' ? employees : [filterEmployee])
    : (filterProject === 'all' ? projects : [filterProject]);

  const rowKey = view === 'employee' ? 'user_name' : 'project_name';
  const rowLabel = view === 'employee' ? 'Medarbejder' : 'Projekt';

  // Build matrix: rows x days
  const matrix = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      map[r] = {};
      days.forEach((d) => { map[r][format(d, 'yyyy-MM-dd')] = []; });
    });
    weekEntries.forEach((e) => {
      const r = e[rowKey];
      if (!r || !map[r]) return;
      try {
        const key = format(new Date(e.date), 'yyyy-MM-dd');
        if (map[r][key]) map[r][key].push(e);
      } catch {}
    });
    return map;
     
  }, [weekEntries, rows, view, weekStart]);

  // Row totals
  const rowTotals = useMemo(() => {
    const t = {};
    rows.forEach((r) => {
      t[r] = days.reduce((sum, d) => {
        const cell = matrix[r]?.[format(d, 'yyyy-MM-dd')] || [];
        return sum + cell.reduce((s, e) => s + (Number(e.hours) || 0), 0);
      }, 0);
    });
    return t;
     
  }, [matrix, rows, weekStart]);

  // Day totals
  const dayTotals = useMemo(() => {
    const t = {};
    days.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      t[key] = rows.reduce((sum, r) => {
        const cell = matrix[r]?.[key] || [];
        return sum + cell.reduce((s, e) => s + (Number(e.hours) || 0), 0);
      }, 0);
    });
    return t;
     
  }, [matrix, rows, weekStart]);

  // Employee totals (for summary regardless of view)
  const employeeTotals = useMemo(() => {
    const t = {};
    weekEntries.forEach((e) => {
      const n = e.user_name || 'Ukendt';
      t[n] = (t[n] || 0) + (Number(e.hours) || 0);
    });
    return t;
  }, [weekEntries]);

  const goPrevWeek = () => setWeekStart(addDays(weekStart, -7));
  const goNextWeek = () => setWeekStart(addDays(weekStart, 7));
  const goToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-amber-500" /> Tidskalender
          </h1>
          <p className="text-slate-500 mt-1">Visuel ugematrix over tidsregistreringer pr. medarbejder og projekt</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrevWeek}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={goToday}>I dag</Button>
          <Button variant="outline" size="sm" onClick={goNextWeek}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center flex-wrap">
        <div className="text-sm font-medium text-slate-700 px-3 py-2 bg-white rounded-lg border border-slate-200">
          Uge {format(weekStart, 'dd. MMM', { locale: da })} – {format(weekEnd, 'dd. MMM yyyy', { locale: da })}
        </div>

        {/* View toggle */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => setView('employee')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'employee' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Users className="w-4 h-4" /> Medarbejder
          </button>
          <button
            onClick={() => setView('project')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'project' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Layers className="w-4 h-4" /> Projekt
          </button>
        </div>

        {view === 'employee' ? (
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="sm:w-56 bg-white"><span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {filterEmployee === 'all' ? 'Alle medarbejdere' : filterEmployee}</span></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle medarbejdere</SelectItem>
              {employees.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="sm:w-56 bg-white"><span className="flex items-center gap-1.5"><HardHat className="w-3.5 h-3.5 text-slate-400" /> {filterProject === 'all' ? 'Alle projekter' : filterProject}</span></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle projekter</SelectItem>
              {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <div className="lg:ml-auto flex items-center gap-2 text-sm">
          <span className="text-slate-500">Ugentlig total:</span>
          <span className="font-bold text-slate-900">{weekTotalHours.toFixed(1)} t</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TASK_DOT).map(([task, color]) => (
          <div key={task} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} /> {task}
          </div>
        ))}
      </div>

      {/* Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-slate-400">Ingen tidsregistreringer for denne uge</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase border-b border-r border-slate-200 w-44">
                    {rowLabel}
                  </th>
                  {days.map((day, i) => {
                    const key = format(day, 'yyyy-MM-dd');
                    const isToday = isSameDay(day, new Date());
                    return (
                      <th key={key} className={`px-2 py-3 text-center border-b border-slate-200 ${isToday ? 'bg-amber-50' : 'bg-slate-50'}`}>
                        <div className="text-xs font-semibold text-slate-500 uppercase">{DAY_LABELS[i]}</div>
                        <div className={`text-sm font-bold ${isToday ? 'text-amber-600' : 'text-slate-900'}`}>{format(day, 'dd. MMM', { locale: da })}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{(dayTotals[key] || 0).toFixed(1)} t</div>
                      </th>
                    );
                  })}
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 bg-slate-50">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r} className="hover:bg-slate-50/50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 border-b border-r border-slate-200 align-top">
                      <div className="font-semibold text-slate-900 text-sm truncate max-w-[160px]" title={r}>{r}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{(rowTotals[r] || 0).toFixed(1)} t ugen</div>
                    </td>
                    {days.map((day) => {
                      const key = format(day, 'yyyy-MM-dd');
                      const cell = matrix[r]?.[key] || [];
                      const cellTotal = cell.reduce((s, e) => s + (Number(e.hours) || 0), 0);
                      const isToday = isSameDay(day, new Date());
                      return (
                        <td key={key} className={`px-1.5 py-2 border-b border-slate-100 align-top ${isToday ? 'bg-amber-50/40' : ''}`}>
                          <div className="min-h-[56px] space-y-1">
                            {cell.map((e, idx) => {
                              const secondary = view === 'employee' ? e.project_name : e.user_name;
                              return (
                                <div key={idx} className={`rounded-md border px-2 py-1 text-[11px] leading-tight ${TASK_COLORS[e.task_type] || TASK_COLORS.Andet}`}>
                                  <div className="font-semibold truncate">{secondary || '—'}</div>
                                  <div className="flex items-center justify-between mt-0.5">
                                    <span className="flex items-center gap-1 font-medium"><Clock className="w-2.5 h-2.5" /> {(Number(e.hours) || 0).toFixed(1)} t</span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${TASK_DOT[e.task_type] || TASK_DOT.Andet}`} />
                                  </div>
                                </div>
                              );
                            })}
                            {cell.length === 0 && <div className="text-center text-[10px] text-slate-200 py-3">—</div>}
                            {cellTotal > 0 && (
                              <div className="text-[10px] text-slate-400 text-right font-medium pr-0.5">{cellTotal.toFixed(1)} t</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 border-b border-slate-100 text-center align-top">
                      <span className="inline-flex items-center justify-center min-w-[3rem] text-sm font-bold text-slate-900 bg-slate-100 rounded-full px-2 py-1">
                        {(rowTotals[r] || 0).toFixed(1)} t
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee summary */}
      {!loading && Object.keys(employeeTotals).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-amber-500" /> Timer pr. medarbejder denne uge</h2>
          <div className="space-y-2">
            {Object.entries(employeeTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([name, hours]) => {
                const maxHours = Math.max(...Object.values(employeeTotals));
                const pct = maxHours > 0 ? (hours / maxHours) * 100 : 0;
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-slate-700 truncate">{name}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${pct}%` }}>
                        <span className="text-xs font-semibold text-slate-800">{hours.toFixed(1)} t</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}