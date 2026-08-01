import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PieChart as PieIcon, Loader2 } from 'lucide-react';
import { formatDKK } from '@/lib/format';

export default function Noegletal() {
  const [invoices, setInvoices] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [inv, t, m] = await Promise.all([
          base44.entities.Invoice.list('-created_date', 500),
          base44.entities.TimeEntry.list(),
          base44.entities.Material.list(),
        ]);
        setInvoices(inv); setTimeEntries(t); setMaterials(m);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const invoiceTotal = (inv) => (inv.line_items || []).reduce((s, li) => s + (li.quantity || 0) * (li.unit_price || 0), 0);

  const monthKey = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const monthLabel = (key) => {
    if (!key) return '';
    const [y, m] = key.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
  };

  const last6Months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const revenueByMonth = {};
  const costByMonth = {};

  invoices.forEach((inv) => {
    const k = monthKey(inv.date || inv.created_date);
    if (k) revenueByMonth[k] = (revenueByMonth[k] || 0) + invoiceTotal(inv);
  });
  timeEntries.forEach((t) => {
    const k = monthKey(t.date || t.created_date);
    if (k) costByMonth[k] = (costByMonth[k] || 0) + ((t.hours || 0) * (t.hourly_rate || 0));
  });
  materials.forEach((m) => {
    const k = monthKey(m.date || m.created_date);
    if (k) costByMonth[k] = (costByMonth[k] || 0) + ((m.quantity || 0) * (m.unit_price || 0));
  });

  const chartData = last6Months.map((k) => {
    const revenue = revenueByMonth[k] || 0;
    const cost = costByMonth[k] || 0;
    return { month: monthLabel(k), omsætning: Math.round(revenue), udgifter: Math.round(cost), dækningsbidrag: Math.round(revenue - cost) };
  });

  const totalRevenue = chartData.reduce((s, d) => s + d.omsætning, 0);
  const totalCost = chartData.reduce((s, d) => s + d.udgifter, 0);
  const totalMargin = totalRevenue - totalCost;
  const marginPct = totalRevenue > 0 ? Math.round((totalMargin / totalRevenue) * 100) : 0;

  const prevMonth = chartData[chartData.length - 2]?.omsætning || 0;
  const currMonth = chartData[chartData.length - 1]?.omsætning || 0;
  const growth = prevMonth > 0 ? Math.round(((currMonth - prevMonth) / prevMonth) * 100) : 0;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><PieIcon className="w-6 h-6 text-amber-500" /> Firma-nøgletal</h1>
        <p className="text-sm text-slate-500 mt-1">Omsætningsvækst, udgifter og dækningsbidrag (seneste 6 måneder)</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><TrendingUp className="w-4 h-4" /> Månedlig omsætning</div>
          <div className="text-xl font-bold text-slate-900">{formatDKK(currMonth)}</div>
          {growth !== 0 && <div className={`text-xs flex items-center gap-1 ${growth > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{growth > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(growth)}% vs forrige</div>}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Wallet className="w-4 h-4" /> Månedlige udgifter</div>
          <div className="text-xl font-bold text-red-600">{formatDKK(chartData[chartData.length - 1]?.udgifter || 0)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><PieIcon className="w-4 h-4" /> Dækningsbidrag</div>
          <div className="text-xl font-bold text-emerald-600">{formatDKK(chartData[chartData.length - 1]?.dækningsbidrag || 0)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><TrendingUp className="w-4 h-4" /> Dækningsgrad</div>
          <div className="text-xl font-bold text-slate-900">{marginPct}%</div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Omsætningsvækst</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatDKK(v)} />
            <Area type="monotone" dataKey="omsætning" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" name="Omsætning" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Omsætning vs udgifter</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatDKK(v)} />
              <Legend />
              <Bar dataKey="omsætning" fill="#10b981" name="Omsætning" radius={[4, 4, 0, 0]} />
              <Bar dataKey="udgifter" fill="#ef4444" name="Udgifter" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Dækningsbidrag over tid</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatDKK(v)} />
              <Line type="monotone" dataKey="dækningsbidrag" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} name="Dækningsbidrag" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}