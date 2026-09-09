import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatDKK } from '@/lib/format';
import { TrendingUp, Target, Trophy, Percent, BarChart3 } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const QUOTE_COLORS = { Accepteret: '#10b981', Sendt: '#3b82f6', Kladde: '#94a3b8', Afvist: '#ef4444', Udløbet: '#f59e0b' };

export default function Salgsstatistik() {
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    setLoading(true);
    try {
      const [q, inv] = await Promise.all([
        base44.entities.Quote.list(),
        base44.entities.Invoice.list(),
      ]);
      setQuotes(q || []);
      setInvoices(inv || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const quoteTotal = (q) => (q.line_items || []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const invoiceTotal = (inv) => (inv.line_items || []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);

  const monthData = useMemo(() => {
    const data = MONTHS.map((m, i) => ({
      name: m,
      omsaetning: 0,
      tilbudSendt: 0,
      tilbudVundet: 0,
      tilbudVaerdi: 0,
    }));
    invoices.forEach((inv) => {
      if (!inv.date) return;
      const d = new Date(inv.date);
      if (d.getFullYear() !== year) return;
      if (inv.status === 'Betalt' || inv.status === 'Sendt') {
        data[d.getMonth()].omsaetning += invoiceTotal(inv);
      }
    });
    quotes.forEach((q) => {
      if (!q.date) return;
      const d = new Date(q.date);
      if (d.getFullYear() !== year) return;
      if (q.status === 'Sendt' || q.status === 'Accepteret' || q.status === 'Afvist' || q.status === 'Udløbet') {
        data[d.getMonth()].tilbudSendt++;
        data[d.getMonth()].tilbudVaerdi += quoteTotal(q);
      }
      if (q.status === 'Accepteret') {
        data[d.getMonth()].tilbudVundet++;
      }
    });
    return data;
  }, [quotes, invoices, year]);

  const stats = useMemo(() => {
    const yearQuotes = quotes.filter((q) => q.date && new Date(q.date).getFullYear() === year);
    const yearInvoices = invoices.filter((i) => i.date && new Date(i.date).getFullYear() === year);
    const won = yearQuotes.filter((q) => q.status === 'Accepteret');
    const lost = yearQuotes.filter((q) => q.status === 'Afvist' || q.status === 'Udløbet');
    const sent = yearQuotes.filter((q) => ['Sendt', 'Accepteret', 'Afvist', 'Udløbet'].includes(q.status));
    const winRate = sent.length > 0 ? Math.round((won.length / sent.length) * 100) : 0;
    const totalRev = yearInvoices.filter((i) => ['Betalt', 'Sendt'].includes(i.status)).reduce((s, i) => s + invoiceTotal(i), 0);
    const avgQuote = won.length > 0 ? won.reduce((s, q) => s + quoteTotal(q), 0) / won.length : 0;
    return { totalRev, wonCount: won.length, sentCount: sent.length, lostCount: lost.length, winRate, avgQuote };
  }, [quotes, invoices, year]);

  const statusDist = useMemo(() => {
    const map = {};
    quotes.forEach((q) => { map[q.status] = (map[q.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [quotes]);

  const years = useMemo(() => {
    const ys = new Set([new Date().getFullYear()]);
    quotes.forEach((q) => q.date && ys.add(new Date(q.date).getFullYear()));
    invoices.forEach((i) => i.date && ys.add(new Date(i.date).getFullYear()));
    return [...ys].sort((a, b) => b - a);
  }, [quotes, invoices]);

  if (loading) return <div className="text-center py-20 text-slate-400">Indlæser statistik...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Salgsstatistik</h1>
            <p className="text-slate-500 mt-0.5">Månedlig omsætning, vundne tilbud og salgseffektivitet</p>
          </div>
        </div>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Omsætning {year}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatDKK(stats.totalRev)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Vundne tilbud</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Trophy className="w-4 h-4 text-amber-600" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.wonCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">af {stats.sentCount} sendte</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Vinderrate</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Percent className="w-4 h-4 text-blue-600" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.winRate}%</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Gns. ordreværdi</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><Target className="w-4 h-4 text-purple-600" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatDKK(stats.avgQuote)}</div>
        </div>
      </div>

      {/* Monthly revenue chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Månedlig omsætning</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatDKK(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
            <Bar dataKey="omsaetning" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Omsætning" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quotes won per month */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Tilbud pr. måned</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend />
              <Bar dataKey="tilbudSendt" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Sendte" />
              <Bar dataKey="tilbudVundet" fill="#10b981" radius={[4, 4, 0, 0]} name="Vundne" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quote status distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Tilbudsstatus (alle)</h3>
          {statusDist.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Ingen tilbud endnu</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name}: ${e.value}`}>
                  {statusDist.map((entry) => <Cell key={entry.name} fill={QUOTE_COLORS[entry.name] || '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}