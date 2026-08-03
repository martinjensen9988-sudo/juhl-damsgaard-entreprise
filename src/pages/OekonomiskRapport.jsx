import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Receipt, ArrowDownUp } from 'lucide-react';

const formatDKK = (n) => (Number(n) || 0).toLocaleString('da-DK', {
  style: 'currency', currency: 'DKK', maximumFractionDigits: 0,
});

const lineTotal = (items = []) =>
  (items || []).reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);

export default function OekonomiskRapport() {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [inv, exp, proj] = await Promise.all([
          base44.entities.Invoice.list('-date', 500),
          base44.entities.Expense.list('-date', 500),
          base44.entities.Project.list('-created_date', 500),
        ]);
        setInvoices(inv);
        setExpenses(exp);
        setProjects(proj);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const revenue = invoices
      .filter((i) => i.status === 'Betalt')
      .reduce((s, i) => s + (lineTotal(i.line_items) + (Number(i.paid_amount) || 0) / 1), 0);
    // Use invoice total (line items) for revenue approximation when paid
    const totalInvoiced = invoices.reduce((s, i) => s + lineTotal(i.line_items), 0);
    const totalPaid = invoices
      .filter((i) => i.status === 'Betalt')
      .reduce((s, i) => s + lineTotal(i.line_items), 0);
    const outstanding = invoices
      .filter((i) => i.status === 'Sendt' || i.status === 'Forfalden')
      .reduce((s, i) => s + lineTotal(i.line_items), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const contribution = totalPaid - totalExpenses;
    return { totalInvoiced, totalPaid, outstanding, totalExpenses, contribution };
  }, [invoices, expenses]);

  const perProject = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      map[p.id] = {
        name: p.name,
        revenue: 0,
        expenses: 0,
        invoiceCount: 0,
      };
    });
    invoices.forEach((i) => {
      const key = i.project_id;
      if (key && map[key] && i.status === 'Betalt') {
        map[key].revenue += lineTotal(i.line_items);
        map[key].invoiceCount += 1;
      }
    });
    expenses.forEach((e) => {
      const key = e.project_id;
      if (key && map[key]) map[key].expenses += Number(e.amount) || 0;
    });
    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v, contribution: v.revenue - v.expenses }))
      .sort((a, b) => b.contribution - a.contribution);
  }, [invoices, expenses, projects]);

  const chartData = perProject.slice(0, 10).map((p) => ({
    name: p.name?.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
    Indtægter: Math.round(p.revenue),
    Udgifter: Math.round(p.expenses),
  }));

  const expenseByCategory = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const c = e.category || 'Andet';
      map[c] = (map[c] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  const cards = [
    { label: 'Faktureret i alt', value: stats.totalInvoiced, icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Indbetalt', value: stats.totalPaid, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Udestående', value: stats.outstanding, icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Udgifter', value: stats.totalExpenses, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Dækningsbidrag', value: stats.contribution, icon: ArrowDownUp, color: stats.contribution >= 0 ? 'text-emerald-600' : 'text-red-600', bg: stats.contribution >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Økonomisk overblik</h1>
        <p className="text-slate-500 text-sm mt-1">
          Samlet rapport over indtægter, udgifter og dækningsbidrag på tværs af alle projekter.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border p-5">
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className="text-lg font-bold text-slate-900 mt-1">{formatDKK(c.value)}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Indtægter vs. udgifter (top 10 projekter)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatDKK(v)} />
              <Legend />
              <Bar dataKey="Indtægter" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Udgifter" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b font-semibold text-slate-900">Dækningsbidrag pr. projekt</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Projekt</th>
                  <th className="px-4 py-3 font-medium text-right">Indtægter</th>
                  <th className="px-4 py-3 font-medium text-right">Udgifter</th>
                  <th className="px-4 py-3 font-medium text-right">Dækningsbidrag</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {perProject.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Ingen data</td></tr>
                ) : perProject.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.name || '—'}</td>
                    <td className="px-4 py-3 text-right text-green-700">{formatDKK(p.revenue)}</td>
                    <td className="px-4 py-3 text-right text-red-700">{formatDKK(p.expenses)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${p.contribution >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {formatDKK(p.contribution)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Udgifter pr. kategori</h2>
          <div className="space-y-3">
            {expenseByCategory.length === 0 ? (
              <p className="text-sm text-slate-400">Ingen udgifter registreret</p>
            ) : expenseByCategory.map((c) => {
              const max = expenseByCategory[0].value || 1;
              return (
                <div key={c.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{c.name}</span>
                    <span className="font-medium text-slate-900">{formatDKK(c.value)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${(c.value / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}