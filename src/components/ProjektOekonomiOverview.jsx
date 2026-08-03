import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, BarChart3 } from 'lucide-react';

const CATEGORY_COLORS = [
  '#0f172a', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6',
  '#ec4899', '#14b8a6', '#ef4444', '#6366f1', '#64748b',
];

const STAT_CARDS = [
  { key: 'budget', label: 'Total budget', icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'costs', label: 'Faktiske omkostninger', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'profit', label: 'Forventet avance', icon: PiggyBank, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'margin', label: 'Avance %', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
];

function DKKTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-md px-3 py-2 text-xs">
      <div className="font-semibold text-slate-900 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
            {p.name}
          </span>
          <span className="font-medium text-slate-900">{formatDKK(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-md px-3 py-2 text-xs">
      <div className="font-semibold text-slate-900">{p.name}</div>
      <div className="text-slate-500">{formatDKK(p.value)}</div>
    </div>
  );
}

export default function ProjektOekonomiOverview() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [p, e] = await Promise.all([
          base44.entities.Project.list('-created_date', 50),
          base44.entities.Expense.list('-created_date', 200),
        ]);
        setProjects(p);
        setExpenses(e);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Projektøkonomi</h2>
        </div>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Saml omkostninger pr. projekt
  const costsByProject = {};
  expenses.forEach((ex) => {
    const pid = ex.project_id || 'none';
    costsByProject[pid] = (costsByProject[pid] || 0) + (ex.amount || 0);
  });

  // Omkostninger pr. kategori
  const categoryMap = {};
  expenses.forEach((ex) => {
    const cat = ex.category || 'Andet';
    categoryMap[cat] = (categoryMap[cat] || 0) + (ex.amount || 0);
  });

  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalCosts = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const profit = totalBudget - totalCosts;
  const margin = totalBudget > 0 ? Math.round((profit / totalBudget) * 100) : 0;

  const summary = { budget: formatDKK(totalBudget), costs: formatDKK(totalCosts), profit: formatDKK(profit), margin: `${margin}%` };

  // Bar chart data — top 6 projekter efter budget
  const barData = projects
    .map((p) => {
      const cost = costsByProject[p.id] || 0;
      const budget = p.budget || 0;
      return {
        name: p.name?.length > 18 ? p.name.slice(0, 16) + '…' : p.name || 'Uden navn',
        Budget: budget,
        Omkostninger: cost,
        Avance: budget - cost,
      };
    })
    .filter((d) => d.Budget > 0 || d.Omkostninger > 0)
    .sort((a, b) => b.Budget - a.Budget)
    .slice(0, 6);

  const pieData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const hasData = totalBudget > 0 || totalCosts > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Projektøkonomi</h2>
        </div>
        <div className="py-10 text-center text-sm text-slate-400">
          Ingen budget- eller omkostningsdata endnu. Tilføj budget på projekter og registrer omkostninger for at se økonomioverblikket.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Projektøkonomi</h2>
            <p className="text-xs text-slate-500">Forventet avance vs. faktiske omkostninger</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {STAT_CARDS.map((s) => (
            <div key={s.key} className="rounded-lg border border-slate-200 p-3">
              <div className={`w-8 h-8 rounded-md ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="text-xl font-bold text-slate-900">{summary[s.key]}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {barData.length > 0 && (
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Forventet avance vs. faktiske omkostninger pr. projekt</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-12} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip content={<DKKTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Budget" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={38} />
                <Bar dataKey="Omkostninger" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={38} />
                <Bar dataKey="Avance" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {pieData.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6 border-t border-slate-100 pt-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Omkostninger pr. kategori</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Avance pr. projekt</h3>
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {projects
                  .filter((p) => p.budget || costsByProject[p.id])
                  .map((p) => {
                    const cost = costsByProject[p.id] || 0;
                    const projProfit = (p.budget || 0) - cost;
                    const pct = p.budget > 0 ? Math.round((projProfit / p.budget) * 100) : 0;
                    const positive = projProfit >= 0;
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900 truncate">{p.name || 'Uden navn'}</div>
                          <div className="text-xs text-slate-400">{formatDKK(p.budget || 0)} budget · {formatDKK(cost)} omk.</div>
                        </div>
                        <div className={`text-right ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
                          <div className="text-sm font-semibold">{positive ? '+' : ''}{formatDKK(projProfit)}</div>
                          <div className="text-xs">{pct}%</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}