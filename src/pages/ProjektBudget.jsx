import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { formatDKK } from '@/lib/format';

export default function ProjektBudget() {
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, e] = await Promise.all([base44.entities.Project.list().catch(() => []), base44.entities.Expense.list().catch(() => [])]);
        setProjects(p || []); setExpenses(e || []);
      } finally { setLoading(false); }
    })();
  }, []);

  const rows = projects.map((p) => {
    const budget = p.budget || 0;
    const spent = expenses.filter((e) => e.project_id === p.id).reduce((s, e) => s + (e.amount || 0), 0);
    const remaining = budget - spent;
    const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
    return { ...p, budget, spent, remaining, pct };
  });

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><PiggyBank className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Projekt Budgetoverblik</h1>
          <p className="text-slate-500">Budget sat op mod faktiske udgifter og forventet restbeløb</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-500">Ingen projekter.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.customer_name || ''} · {p.status}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${p.remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatDKK(p.remaining)}</div>
                  <div className="text-[11px] text-slate-400">restbeløb</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{formatDKK(p.spent)} brugt</span>
                  <span>af {formatDKK(p.budget)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full ${p.pct > 90 ? 'bg-rose-500' : p.pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-slate-50 rounded-lg p-2"><div className="text-[11px] text-slate-500 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" />Budget</div><div className="text-sm font-semibold">{formatDKK(p.budget)}</div></div>
                <div className="bg-rose-50 rounded-lg p-2"><div className="text-[11px] text-rose-500 flex items-center justify-center gap-1"><TrendingDown className="w-3 h-3" />Brugt</div><div className="text-sm font-semibold text-rose-700">{formatDKK(p.spent)}</div></div>
                <div className="bg-emerald-50 rounded-lg p-2"><div className="text-[11px] text-emerald-600">Rest</div><div className="text-sm font-semibold text-emerald-700">{formatDKK(Math.max(0, p.remaining))}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}