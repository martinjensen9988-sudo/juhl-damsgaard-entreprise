import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Building2 } from 'lucide-react';
import { formatDKK, calcSubtotal } from '@/lib/format';

const COST_COLORS = ['#0f172a', '#b45309', '#0369a1', '#15803d', '#9333ea', '#dc2626', '#475569', '#ca8a04'];

export default function OekonomiskOversigt() {
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [p, inv, exp] = await Promise.all([
          base44.entities.Project.list().catch(() => []),
          base44.entities.Invoice.list().catch(() => []),
          base44.entities.Expense.list().catch(() => []),
        ]);
        setProjects(p || []); setInvoices(inv || []); setExpenses(exp || []);
      } finally { setLoading(false); }
    })();
  }, []);

  const active = projects.filter((p) => p.status === 'I gang' || p.status === 'Planlægning');

  const perProject = useMemo(() => active.map((p) => {
    const rev = invoices.filter((i) => i.project_id === p.id).reduce((s, i) => s + calcSubtotal(i.line_items || []), 0);
    const cost = expenses.filter((e) => e.project_id === p.id).reduce((s, e) => s + (e.amount || 0), 0);
    const label = p.name?.length > 14 ? p.name.slice(0, 14) + '…' : (p.name || '—');
    return { name: label, fullName: p.name, revenue: Math.round(rev), cost: Math.round(cost), contribution: Math.round(rev - cost) };
  }), [active, invoices, expenses]);

  const totalRev = perProject.reduce((s, x) => s + x.revenue, 0);
  const totalCost = perProject.reduce((s, x) => s + x.cost, 0);

  const costByCategory = useMemo(() => {
    const m = {};
    expenses.forEach((e) => { if (e.amount) m[e.category] = (m[e.category] || 0) + e.amount; });
    return Object.entries(m).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [expenses]);

  const monthly = useMemo(() => {
    const m = {};
    invoices.forEach((i) => { const k = (i.date || '').slice(0, 7); if (k) m[k] = (m[k] || 0) + calcSubtotal(i.line_items || []); });
    expenses.forEach((e) => { const k = (e.date || '').slice(0, 7); if (k) m[k] = (m[k] || 0) - (e.amount || 0); });
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([måned, bidrag]) => ({ måned, bidrag: Math.round(bidrag) }));
  }, [invoices, expenses]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Økonomisk Oversigt</h1>
        <p className="text-slate-500">Indtægter, omkostninger og dækningsbidrag på tværs af aktive byggeprojekter</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={<TrendingUp className="w-5 h-5" />} label="Indtægter" value={formatDKK(totalRev)} tone="emerald" />
        <KPI icon={<TrendingDown className="w-5 h-5" />} label="Omkostninger" value={formatDKK(totalCost)} tone="rose" />
        <KPI icon={<Wallet className="w-5 h-5" />} label="Dækningsbidrag" value={formatDKK(totalRev - totalCost)} tone="amber" />
        <KPI icon={<Building2 className="w-5 h-5" />} label="Aktive projekter" value={String(active.length)} tone="slate" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold mb-4">Indtægter, omkostninger & dækningsbidrag per projekt</h2>
        {perProject.length === 0 ? <p className="text-slate-400 text-sm">Ingen aktive projekter.</p> : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={perProject}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatDKK(v)} />
              <Legend />
              <Bar dataKey="revenue" name="Indtægter" fill="#0369a1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" name="Omkostninger" fill="#dc2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="contribution" name="Dækningsbidrag" fill="#b45309" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold mb-4">Omkostninger pr. kategori</h2>
          {costByCategory.length === 0 ? <p className="text-slate-400 text-sm">Ingen omkostninger registreret.</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={costByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                  {costByCategory.map((_, i) => <Cell key={i} fill={COST_COLORS[i % COST_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatDKK(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold mb-4">Månedligt dækningsbidrag</h2>
          {monthly.length === 0 ? <p className="text-slate-400 text-sm">Ingen data.</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="måned" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatDKK(v)} />
                <Line dataKey="bidrag" stroke="#0f172a" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, tone }) {
  const tones = { emerald: 'bg-emerald-100 text-emerald-700', rose: 'bg-rose-100 text-rose-700', amber: 'bg-amber-100 text-amber-700', slate: 'bg-slate-200 text-slate-700' };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${tones[tone]}`}>{icon}</div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}