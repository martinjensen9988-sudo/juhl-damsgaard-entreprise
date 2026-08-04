import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, HardHat } from 'lucide-react';
import {
  startOfWeek, endOfWeek, addDays, format, isSameDay, isWithinInterval,
} from 'date-fns';
import { da } from 'date-fns/locale';

const TASK_COLORS = {
  Gravearbejde: 'bg-amber-100 border-amber-300 text-amber-800',
  Kørsel: 'bg-blue-100 border-blue-300 text-blue-800',
  Maskinarbejde: 'bg-purple-100 border-purple-300 text-purple-800',
  Håndarbejde: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  Møde: 'bg-rose-100 border-rose-300 text-rose-800',
  Andet: 'bg-slate-100 border-slate-300 text-slate-700',
};

const DAY_LABELS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

export default function Tidskalender() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
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

  const entriesByDay = useMemo(() => {
    const map = {};
    days.forEach((d) => (map[format(d, 'yyyy-MM-dd')] = []));
    filtered.forEach((e) => {
      if (!e.date) return;
      try {
        const d = new Date(e.date);
        if (isWithinInterval(d, { start: weekStart, end: weekEnd })) {
          const key = format(d, 'yyyy-MM-dd');
          if (map[key]) map[key].push(e);
        }
      } catch {}
    });
    return map;
  }, [filtered, weekStart, weekEnd, days]);

  const weekTotalHours = filtered
    .filter((e) => {
      if (!e.date) return false;
      try {
        return isWithinInterval(new Date(e.date), { start: weekStart, end: weekEnd });
      } catch {
        return false;
      }
    })
    .reduce((s, e) => s + (Number(e.hours) || 0), 0);

  // Per-employee totals within the week
  const employeeTotals = useMemo(() => {
    const totals = {};
    filtered.forEach((e) => {
      if (!e.date) return;
      try {
        if (isWithinInterval(new Date(e.date), { start: weekStart, end: weekEnd })) {
          totals[e.user_name || 'Ukendt'] = (totals[e.user_name || 'Ukendt'] || 0) + (Number(e.hours) || 0);
        }
      } catch {}
    });
    return totals;
  }, [filtered, weekStart, weekEnd]);

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
          <p className="text-slate-500 mt-1">Visuel ugeoversigt over tidsregistreringer pr. medarbejder og projekt</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrevWeek}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={goToday}>I dag</Button>
          <Button variant="outline" size="sm" onClick={goNextWeek}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="text-sm font-medium text-slate-700 px-3 py-2 bg-white rounded-lg border border-slate-200">
          Uge {format(weekStart, 'dd. MMM', { locale: da })} – {format(weekEnd, 'dd. MMM yyyy', { locale: da })}
        </div>
        <Select value={filterEmployee} onValueChange={setFilterEmployee}>
          <SelectTrigger className="sm:w-56 bg-white"><span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {filterEmployee === 'all' ? 'Alle medarbejdere' : filterEmployee}</span></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle medarbejdere</SelectItem>
            {employees.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="sm:w-56 bg-white"><span className="flex items-center gap-1.5"><HardHat className="w-3.5 h-3.5 text-slate-400" /> {filterProject === 'all' ? 'Alle projekter' : filterProject}</span></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle projekter</SelectItem>
            {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="sm:ml-auto flex items-center gap-2 text-sm">
          <span className="text-slate-500">Ugentlig total:</span>
          <span className="font-bold text-slate-900">{weekTotalHours.toFixed(1)} t</span>
        </div>
      </div>

      {/* Weekly grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((day, i) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEntries = (entriesByDay[key] || []).sort((a, b) => (a.user_name || '').localeCompare(b.user_name || ''));
          const dayTotal = dayEntries.reduce((s, e) => s + (Number(e.hours) || 0), 0);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={key} className={`bg-white rounded-xl border ${isToday ? 'border-amber-400 ring-1 ring-amber-200' : 'border-slate-200'} flex flex-col min-h-[180px]`}>
              <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">{DAY_LABELS[i]}</div>
                  <div className={`text-lg font-bold ${isToday ? 'text-amber-600' : 'text-slate-900'}`}>{format(day, 'dd')}</div>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{dayTotal.toFixed(1)} t</span>
              </div>
              <div className="p-2 space-y-2 flex-1">
                {dayEntries.length === 0 && (
                  <div className="text-center text-xs text-slate-300 py-6">Ingen registreringer</div>
                )}
                {dayEntries.map((e, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border px-2.5 py-2 text-xs ${TASK_COLORS[e.task_type] || TASK_COLORS.Andet}`}
                  >
                    <div className="font-semibold truncate">{e.user_name || 'Ukendt'}</div>
                    <div className="truncate opacity-80">{e.project_name || '—'}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="flex items-center gap-1 font-medium"><Clock className="w-3 h-3" /> {(Number(e.hours) || 0).toFixed(1)} t</span>
                      {e.task_type && <span className="opacity-70">{e.task_type}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}