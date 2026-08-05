import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { format, parseISO, differenceInDays, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { Loader2, Flag, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const STATUS_STYLE = {
  'Ikke startet': 'bg-slate-100 text-slate-600',
  'I gang': 'bg-blue-100 text-blue-700',
  'Gennemført': 'bg-emerald-100 text-emerald-700',
  'Forsinket': 'bg-rose-100 text-rose-700',
};

export default function ProjektTidsplan() {
  const [projects, setProjects] = useState(null);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [p, m] = await Promise.all([
          base44.entities.Project.list('-updated_date', 200),
          base44.entities.Milestone.list('-updated_date', 1000),
        ]);
        setProjects(p);
        setMilestones(m);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const { activeProjects, range, totalDays } = useMemo(() => {
    if (!projects) return { activeProjects: [], range: null, totalDays: 0 };
    const active = projects.filter((p) => p.start_date && p.end_date && p.status !== 'Afsluttet' && p.status !== 'Færdig');
    if (active.length === 0) return { activeProjects: [], range: null, totalDays: 0 };
    const dates = active.flatMap((p) => [parseISO(p.start_date), parseISO(p.end_date)]);
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    const days = eachDayOfInterval({ start: min, end: max });
    return { activeProjects: active, range: { start: min, end: max }, totalDays: days.length };
  }, [projects]);

  if (!projects) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  const pctPos = (dateStr) => {
    if (!range) return 0;
    const d = parseISO(dateStr);
    const offset = differenceInDays(d, range.start);
    return Math.max(0, Math.min(100, (offset / totalDays) * 100));
  };

  const projectMilestones = (pid) =>
    milestones
      .filter((m) => m.project_id === pid)
      .sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(a.due_date || 0) - new Date(b.due_date || 0));

  const today = new Date();
  const todayPct = range ? Math.max(0, Math.min(100, (differenceInDays(today, range.start) / totalDays) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projekt Tidsplan</h1>
        <p className="text-slate-500 mt-1">Interaktiv tidslinje over faser, deadlines og milepæle for alle aktive entrepriser</p>
      </div>

      {!range || activeProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Ingen aktive projekter med start- og slutdato.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {format(range.start, 'dd.MM.yyyy')} → {format(range.end, 'dd.MM.yyyy')}</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-400" /> Fase</span>
              <span className="flex items-center gap-1.5"><Flag className="w-3.5 h-3.5 text-amber-500" /> Milepæl</span>
              <span className="flex items-center gap-1.5"><span className="w-0.5 h-4 bg-rose-500" /> I dag</span>
            </div>
          </div>

          {/* Timeline header with month markers */}
          <div className="relative h-6 ml-0 border-b border-slate-200">
            {(() => {
              const markers = [];
              const cursor = new Date(range.start);
              cursor.setDate(1);
              while (cursor <= range.end) {
                const pos = pctPos(cursor.toISOString());
                markers.push({ pos, label: format(cursor, 'MMM yy') });
                cursor.setMonth(cursor.getMonth() + 1);
              }
              return markers.map((mk, i) => (
                <div key={i} className="absolute top-0 text-xs text-slate-400" style={{ left: `${mk.pos}%` }}>
                  <div className="border-l border-slate-200 h-3" />
                  <span className="ml-1">{mk.label}</span>
                </div>
              ));
            })()}
          </div>

          {/* Timeline rows */}
          <div className="space-y-5">
            {activeProjects.map((p) => {
              const startPct = pctPos(p.start_date);
              const endPct = pctPos(p.end_date);
              const widthPct = Math.max(2, endPct - startPct);
              const ms = projectMilestones(p.id);
              const done = ms.filter((m) => m.status === 'Gennemført').length;
              const progress = ms.length > 0 ? Math.round((done / ms.length) * 100) : 0;
              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium text-slate-900 truncate">{p.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{format(parseISO(p.start_date), 'dd.MM')} – {format(parseISO(p.end_date), 'dd.MM')}</span>
                      {ms.length > 0 && <span className="text-slate-400">· {progress}%</span>}
                    </div>
                  </div>

                  <div className="relative h-10 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                    {/* Today line */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20" style={{ left: `${todayPct}%` }} />

                    {/* Project phase bar */}
                    <div
                      className="absolute top-1.5 bottom-1.5 rounded-md bg-gradient-to-r from-slate-700 to-slate-500 flex items-center px-2 z-10"
                      style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                    >
                      <span className="text-xs text-white truncate">{p.status}</span>
                    </div>

                    {/* Milestones */}
                    {ms.map((m) => {
                      if (!m.due_date) return null;
                      const pos = pctPos(m.due_date);
                      return (
                        <div
                          key={m.id}
                          className="absolute top-0 bottom-0 flex flex-col items-center justify-center z-30 group"
                          style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
                          title={`${m.title} (${format(parseISO(m.due_date), 'dd.MM.yyyy')})`}
                        >
                          <Flag className={`w-4 h-4 ${
                            m.status === 'Gennemført' ? 'text-emerald-500' :
                            m.status === 'Forsinket' ? 'text-rose-500' :
                            m.status === 'I gang' ? 'text-blue-500' : 'text-amber-500'
                          }`} />
                          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                            {m.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Milestone list */}
                  {ms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ms.map((m) => (
                        <span key={m.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status] || 'bg-slate-100'}`}>
                          {m.status === 'Gennemført' ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> :
                           m.status === 'Forsinket' ? <AlertTriangle className="w-3 h-3 inline mr-1" /> :
                           <Clock className="w-3 h-3 inline mr-1" />}
                          {m.title}
                          {m.due_date && <span className="text-slate-400 ml-1">· {format(parseISO(m.due_date), 'dd.MM')}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}