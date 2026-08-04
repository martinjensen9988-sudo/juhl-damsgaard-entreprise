import { useEffect, useState, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Clock, ListChecks, TrendingUp, Play, Square, Calendar, ArrowRight } from 'lucide-react';

export default function MaHome() {
  const { user, syncClock, clockedIn } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [startTs, setStartTs] = useState(null);
  const loadedRef = useRef(false);

  const load = async () => {
    const [tk, te, pr] = await Promise.all([
      base44.entities.Task.list().catch(() => []),
      base44.entities.TimeEntry.list('-date', 50).catch(() => []),
      base44.entities.Project.list().catch(() => []),
    ]);
    setTasks(tk || []);
    setTimeEntries(te || []);
    setProjects(pr || []);
    loadedRef.current = true;
  };

  useEffect(() => {
    load();
    const start = localStorage.getItem('ma_clock_start');
    if (start) setStartTs(Number(start));
  }, []);

  useEffect(() => {
    if (!startTs) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - startTs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTs]);

  const myName = user?.full_name || '';
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];

  const myTasks = tasks.filter((t) => !t.assigned_to || t.assigned_to === myName || myName === '');
  const openTasks = myTasks.filter((t) => t.status !== 'Gennemført' && t.status !== 'done');
  const todaysHours = (timeEntries || []).filter((t) => t.date === today && (!t.user_name || t.user_name === myName)).reduce((s, t) => s + (t.hours || 0), 0);
  const weekHours = (timeEntries || []).filter((t) => t.date >= weekAgo && (!t.user_name || t.user_name === myName)).reduce((s, t) => s + (t.hours || 0), 0);

  const clockIn = () => {
    const ts = Date.now();
    localStorage.setItem('ma_clock_start', String(ts));
    setStartTs(ts);
    syncClock();
  };

  const clockOut = async () => {
    if (!startTs) return;
    const hours = Math.max(0.25, Math.round(((Date.now() - startTs) / 3600000) * 4) / 4);
    try {
      await base44.entities.TimeEntry.create({
        date: today,
        hours,
        description: 'Tjekket ud via app',
        user_name: myName,
        task_type: 'Andet',
      });
    } catch (e) {}
    localStorage.removeItem('ma_clock_start');
    setStartTs(null);
    setElapsed(0);
    syncClock();
    load();
  };

  const fmtTime = (s) => `${Math.floor(s / 3600)}t ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;

  return (
    <div className="p-4 space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Hej{myName ? `, ${myName.split(' ')[0]}` : ''} 👋</h1>
        <p className="text-sm text-slate-500">{new Date().toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Clock in/out card */}
      <div className={`rounded-2xl p-5 ${clockedIn ? 'bg-emerald-600' : 'bg-slate-950'} text-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide opacity-80">{clockedIn ? 'Du er tjekket ind' : 'Klar til at starte?'}</div>
            {clockedIn ? (
              <div className="text-3xl font-bold tabular-nums mt-1">{fmtTime(elapsed)}</div>
            ) : (
              <div className="text-lg font-medium mt-1">Tjek ind for at registrere tid</div>
            )}
          </div>
          <button
            onClick={clockedIn ? clockOut : clockIn}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
              clockedIn ? 'bg-white text-emerald-600' : 'bg-amber-400 text-slate-950'
            }`}
          >
            {clockedIn ? <Square className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
        </div>
        {clockedIn && <p className="text-xs opacity-80 mt-3">Tryk på knappen for at tjekke ud og gemme tiden</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <Clock className="w-4 h-4 text-amber-500 mb-1" />
          <div className="text-lg font-bold text-slate-900">{todaysHours}t</div>
          <div className="text-[11px] text-slate-500">I dag</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <TrendingUp className="w-4 h-4 text-blue-500 mb-1" />
          <div className="text-lg font-bold text-slate-900">{weekHours}t</div>
          <div className="text-[11px] text-slate-500">Denne uge</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <ListChecks className="w-4 h-4 text-emerald-500 mb-1" />
          <div className="text-lg font-bold text-slate-900">{openTasks.length}</div>
          <div className="text-[11px] text-slate-500">Åbne opgaver</div>
        </div>
      </div>

      {/* Next tasks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-900">Dine opgaver</h2>
          <Link to="/app/opgaver" className="text-xs text-amber-600 flex items-center gap-1">Alle <ArrowRight className="w-3 h-3" /></Link>
        </div>
        {openTasks.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
            <ListChecks className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Ingen åbne opgaver</p>
          </div>
        ) : (
          <div className="space-y-2">
            {openTasks.slice(0, 4).map((t) => (
              <Link key={t.id} to="/app/opgaver" className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center gap-3 active:bg-slate-50">
                <div className={`w-2 h-2 rounded-full ${t.priority === 'Høj' ? 'bg-red-500' : t.priority === 'Normal' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{t.title}</div>
                  {t.due_date && <div className="text-[11px] text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {t.due_date}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Active projects */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-2">Aktive projekter</h2>
        <div className="space-y-2">
          {projects.filter((p) => p.status === 'I gang').slice(0, 3).map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-3.5 border border-slate-200">
              <div className="text-sm font-medium text-slate-900">{p.name}</div>
              {p.address && <div className="text-[11px] text-slate-500">{p.address}</div>}
            </div>
          ))}
          {projects.filter((p) => p.status === 'I gang').length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Ingen aktive projekter</p>
          )}
        </div>
      </div>
    </div>
  );
}