import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatDKK } from '@/lib/format';
import { TrendingUp, Users, DollarSign, Activity, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export default function Driftsrapport() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [times, setTimes] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [inv, t, p] = await Promise.all([
          base44.entities.Invoice.list('-created_date', 200).catch(() => []),
          base44.entities.TimeEntry.list('-created_date', 500).catch(() => []),
          base44.entities.Project.list('-created_date', 200).catch(() => []),
        ]);
        setInvoices(inv); setTimes(t); setProjects(p);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const data = useMemo(() => {
    const now = new Date();
    const buckets = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets[monthKey(d)] = { month: MONTHS[d.getMonth()], omsaetning: 0, timer: 0 };
    }
    (invoices || []).forEach((inv) => {
      if (inv.status !== 'Betalt' && inv.status !== 'Sendt') return;
      const d = new Date(inv.date);
      if (isNaN(d.getTime())) return;
      const k = monthKey(d);
      if (buckets[k]) buckets[k].omsaetning += (inv.line_items || []).reduce((s, li) => s + (Number(li.quantity) || 0) * (Number(li.unit_price) || 0), 0);
    });
    (times || []).forEach((t) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const k = monthKey(d);
      if (buckets[k]) buckets[k].timer += Number(t.hours) || 0;
    });
    const rows = Object.values(buckets);
    const totalRev = rows.reduce((s, r) => s + r.omsaetning, 0);
    const totalHours = rows.reduce((s, r) => s + r.timer, 0);
    const avgMonthly = totalRev / 12;
    const effektivitet = totalHours > 0 ? totalRev / totalHours : 0;
    const activeProjects = (projects || []).filter((p) => p.status === 'I gang').length;
    return { rows, totalRev, totalHours, avgMonthly, effektivitet, activeProjects };
  }, [invoices, times, projects]);

  function exportCsv() {
    const rows = [['Måned', 'Omsætning (DKK)', 'Timer', 'Effektivitet (DKK/t)']];
    data.rows.forEach((r) => rows.push([r.month, Math.round(r.omsaetning), r.timer.toFixed(1), r.timer > 0 ? Math.round(r.omsaetning / r.timer) : 0]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'driftsrapport.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Driftsrapport</h1>
          <p className="text-slate-500 mt-1">Samlet drift — omsætning, ressourceforbrug og effektivitetsnøgletal for ledelsen</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-1" /> Eksportér</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><DollarSign className="w-4 h-4 text-emerald-600" /> Årlig omsætning</div><div className="text-2xl font-bold mt-1">{formatDKK(data.totalRev)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><TrendingUp className="w-4 h-4 text-blue-600" /> Gns./md</div><div className="text-2xl font-bold mt-1">{formatDKK(data.avgMonthly)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><Users className="w-4 h-4 text-amber-600" /> Total timer</div><div className="text-2xl font-bold mt-1">{data.totalHours.toFixed(0)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 text-slate-500 text-sm"><Activity className="w-4 h-4 text-purple-600" /> DKK/t effektivitet</div><div className="text-2xl font-bold mt-1">{formatDKK(data.effektivitet)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Månedlig omsætning (12 mdr)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.rows} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
              <Tooltip formatter={(v) => [formatDKK(v), 'Omsætning']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Bar dataKey="omsaetning" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ressourceforbrug — timer pr. måned</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.rows} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} timer`, 'Timer']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Line type="monotone" dataKey="timer" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Nøgletal</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg"><div className="text-slate-500">Aktive projekter</div><div className="text-xl font-bold mt-1">{data.activeProjects}</div></div>
            <div className="p-3 bg-slate-50 rounded-lg"><div className="text-slate-500">Timer pr. aktivt projekt</div><div className="text-xl font-bold mt-1">{data.activeProjects > 0 ? (data.totalHours / data.activeProjects).toFixed(0) : '—'}</div></div>
            <div className="p-3 bg-slate-50 rounded-lg"><div className="text-slate-500">Omsætning pr. projekt</div><div className="text-xl font-bold mt-1">{data.activeProjects > 0 ? formatDKK(data.totalRev / data.activeProjects) : '—'}</div></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}