import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDKK } from '@/lib/format';
import { Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export default function OekonomiskStatus() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [inv, sup] = await Promise.all([
          base44.entities.Invoice.list('-created_date', 200).catch(() => []),
          base44.entities.SupplierInvoice.list('-created_date', 200).catch(() => []),
        ]);
        setInvoices(inv); setSupplierInvoices(sup);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const data = useMemo(() => {
    const now = new Date();
    const buckets = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets[monthKey(d)] = { month: MONTHS[d.getMonth()], indtaegt: 0, udgift: 0, profit: 0 };
    }
    (invoices || []).forEach((inv) => {
      if (inv.status !== 'Betalt' && inv.status !== 'Sendt') return;
      const d = new Date(inv.date);
      if (isNaN(d.getTime())) return;
      const k = monthKey(d);
      if (buckets[k]) buckets[k].indtaegt += (inv.line_items || []).reduce((s, li) => s + (Number(li.quantity) || 0) * (Number(li.unit_price) || 0), 0);
    });
    (supplierInvoices || []).forEach((inv) => {
      const d = new Date(inv.date);
      if (isNaN(d.getTime())) return;
      const k = monthKey(d);
      if (buckets[k]) buckets[k].udgift += (Number(inv.amount) || 0) + (Number(inv.vat_amount) || 0);
    });
    Object.values(buckets).forEach((b) => { b.profit = b.indtaegt - b.udgift; });
    const rows = Object.values(buckets);
    return {
      rows,
      totalIndtaegt: rows.reduce((s, r) => s + r.indtaegt, 0),
      totalUdgift: rows.reduce((s, r) => s + r.udgift, 0),
    };
  }, [invoices, supplierInvoices]);

  const totalProfit = data.totalIndtaegt - data.totalUdgift;
  const margin = data.totalIndtaegt > 0 ? (totalProfit / data.totalIndtaegt) * 100 : 0;

  function exportCsv() {
    const rows = [['Måned', 'Indtægt', 'Udgift', 'Profit']];
    data.rows.forEach((r) => rows.push([r.month, Math.round(r.indtaegt), Math.round(r.udgift), Math.round(r.profit)]));
    rows.push(['TOTAL', Math.round(data.totalIndtaegt), Math.round(data.totalUdgift), Math.round(totalProfit)]);
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'oekonomisk-status.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Økonomisk Status</h1>
          <p className="text-slate-500 mt-1">Indtægter fra fakturaer mod udgifter fra leverandørfakturaer — månedlig profit</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-1" /> Eksportér</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><TrendingUp className="w-4 h-4 text-emerald-600" /> Indtægter (12 mdr)</div><div className="text-2xl font-bold mt-1 text-emerald-600">{formatDKK(data.totalIndtaegt)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><TrendingDown className="w-4 h-4 text-red-600" /> Udgifter</div><div className="text-2xl font-bold mt-1 text-red-600">{formatDKK(data.totalUdgift)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><Wallet className="w-4 h-4 text-blue-600" /> Profit</div><div className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatDKK(totalProfit)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-slate-500">Dækningsgrad</div><div className={`text-2xl font-bold mt-1 ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{margin.toFixed(1)}%</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Indtægter vs. udgifter (12 mdr)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.rows} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
              <Tooltip formatter={(v) => formatDKK(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="indtaegt" name="Indtægter" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="udgift" name="Udgifter" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Månedlig profit</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {data.rows.map((r) => (
              <div key={r.month} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0 text-sm">
                <span className="text-slate-600 w-16">{r.month}</span>
                <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden relative">
                  <div className={`h-full ${r.profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.abs(r.profit) / (Math.max(data.totalIndtaegt, 1) / 12) * 100)}%` }} />
                </div>
                <span className={`font-medium w-28 text-right ${r.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatDKK(r.profit)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}