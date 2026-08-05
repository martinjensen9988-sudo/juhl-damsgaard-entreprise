import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import { Loader2, FolderKanban, Activity, Pause, Wallet, MapPin, Calendar } from 'lucide-react';

const STATUS_STYLES = {
  Planlægning: 'bg-blue-100 text-blue-700',
  'I gang': 'bg-emerald-100 text-emerald-700',
  Færdig: 'bg-amber-100 text-amber-700',
  Afsluttet: 'bg-slate-200 text-slate-600',
  'På hold': 'bg-rose-100 text-rose-700',
};

const ACTIVE_STATUSES = ['Planlægning', 'I gang', 'På hold'];

export default function ProjektOversigt() {
  const [projects, setProjects] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [all, ms, exp] = await Promise.all([
          base44.entities.Project.list('-updated_date', 200),
          base44.entities.Milestone.list('-updated_date', 500),
          base44.entities.Expense.list('-updated_date', 500),
        ]);
        setProjects(all);
        setMilestones(ms);
        setExpenses(exp);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  if (!projects) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const active = projects.filter((p) => ACTIVE_STATUSES.includes(p.status));

  const projectProgress = (pid) => {
    const ms = milestones.filter((m) => m.project_id === pid);
    if (ms.length === 0) return 0;
    const done = ms.filter((m) => m.status === 'Gennemført').length;
    return Math.round((done / ms.length) * 100);
  };

  const projectSpent = (pid) =>
    expenses
      .filter((e) => e.project_id === pid)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalBudget = active.reduce((s, p) => s + Number(p.budget || 0), 0);
  const inProgress = active.filter((p) => p.status === 'I gang').length;
  const onHold = active.filter((p) => p.status === 'På hold').length;

  const kpis = [
    { label: 'Aktive projekter', value: active.length, icon: FolderKanban, color: 'text-blue-600 bg-blue-50' },
    { label: 'I gang', value: inProgress, icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'På hold', value: onHold, icon: Pause, color: 'text-rose-600 bg-rose-50' },
    { label: 'Samlet budget', value: formatDKK(totalBudget), icon: Wallet, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projekt Oversigt</h1>
        <p className="text-slate-500 mt-1">Samlet overblik over alle aktive projekter i realtid</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${k.color}`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{k.value}</div>
            <div className="text-sm text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {active.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Ingen aktive projekter lige nu.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {active.map((p) => {
            const progress = projectProgress(p.id);
            const spent = projectSpent(p.id);
            const budget = Number(p.budget || 0);
            const budgetPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
            return (
              <Link
                key={p.id}
                to="/projekter"
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                    <div className="text-sm text-slate-500 truncate">{p.customer_name || '—'}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_STYLES[p.status] || 'bg-slate-100'}`}>
                    {p.status}
                  </span>
                </div>

                {p.address && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5" /> {p.address}
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Fremskridt (milepæle)</span>
                    <span className="font-medium text-slate-700">{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Budgetforbrug</span>
                    <span className="font-medium text-slate-700">{budgetPct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${budgetPct > 90 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${budgetPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 pt-1">
                    <span>{formatDKK(spent)} brugt</span>
                    <span>{formatDKK(budget)} budget</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1 border-t border-slate-100">
                  <Calendar className="w-3.5 h-3.5" />
                  {p.start_date || '—'} → {p.end_date || '—'}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}