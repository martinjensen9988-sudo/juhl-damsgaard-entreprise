import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ListChecks, Calendar, Check, Circle, Clock, AlertCircle } from 'lucide-react';

const STATUS = ['Ikke startet', 'I gang', 'Afventer', 'Gennemført'];
const STATUS_ICON = {
  'Ikke startet': Circle,
  'I gang': Clock,
  'Afventer': AlertCircle,
  'Gennemført': Check,
};

export default function MaOpgaver() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('Åben');

  const load = useCallback(async () => {
    const [u, tk] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.Task.list('-due_date', 100).catch(() => []),
    ]);
    setUser(u);
    setTasks(tk || []);
  }, []);

  const { markTasksRead } = useOutletContext() || {};

  useEffect(() => { load(); }, [load]);

  // Marker opgaver som læst når siden vises
  useEffect(() => { markTasksRead?.(); }, [markTasksRead]);

  const myName = user?.full_name || '';
  const myTasks = tasks.filter((t) => !t.assigned_to || t.assigned_to === myName || myName === '');
  const open = myTasks.filter((t) => t.status !== 'Gennemført' && t.status !== 'done');
  const done = myTasks.filter((t) => t.status === 'Gennemført' || t.status === 'done');
  const shown = filter === 'Gennemført' ? done : open;

  const cycleStatus = async (task) => {
    const idx = STATUS.indexOf(task.status || 'Ikke startet');
    const next = STATUS[(idx + 1) % STATUS.length];
    try {
      await base44.entities.Task.update(task.id, {
        status: next,
        completed_date: next === 'Gennemført' ? new Date().toISOString().split('T')[0] : null,
      });
      load();
    } catch (e) { alert('Kunne ikke opdatere'); }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Mine opgaver</h1>

      <div className="flex gap-2">
        {['Åben', 'Gennemført'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {f === 'Åben' ? `Åbne (${open.length})` : `Færdige (${done.length})`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <ListChecks className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{filter === 'Åben' ? 'Ingen åbne opgaver' : 'Ingen gennemførte opgaver'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((t) => {
            const Icon = STATUS_ICON[t.status] || Circle;
            const done = t.status === 'Gennemført';
            return (
              <div key={t.id} className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => cycleStatus(t)}
                    className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300 text-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</div>
                    {t.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{t.status || 'Ikke startet'}</span>
                      {t.priority && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          t.priority === 'Høj' ? 'bg-red-100 text-red-600' : t.priority === 'Normal' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                        }`}>{t.priority}</span>
                      )}
                      {t.due_date && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {t.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-slate-400 text-center pt-2">Tryk på cirklen for at skifte status</p>
    </div>
  );
}