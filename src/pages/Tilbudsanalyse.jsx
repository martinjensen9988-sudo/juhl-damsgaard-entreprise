import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const STATUS_COLORS = { Accepteret: '#10b981', Afvist: '#ef4444', Udløbet: '#f59e0b', Sendt: '#3b82f6', Kladde: '#94a3b8' };

export default function Tilbudsanalyse() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Quote.list('-created_date', 1000);
      setQuotes(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => quotes.filter((q) => {
    if (from && q.date && q.date < from) return false;
    if (to && q.date && q.date > to) return false;
    return true;
  }), [quotes, from, to]);

  const stats = useMemo(() => {
    const decided = filtered.filter((q) => q.status === 'Accepteret' || q.status === 'Afvist');
    const won = filtered.filter((q) => q.status === 'Accepteret');
    const lost = filtered.filter((q) => q.status === 'Afvist');
    const winRate = decided.length ? Math.round((won.length / decided.length) * 100) : 0;
    const wonValue = won.reduce((s, q) => s + (q.line_items || []).reduce((a, li) => a + (li.quantity || 0) * (li.unit_price || 0), 0), 0);
    return { total: filtered.length, won: won.length, lost: lost.length, winRate, wonValue, decided: decided.length };
  }, [filtered]);

  const statusDist = useMemo(() => {
    const map = {};
    filtered.forEach((q) => { map[q.status] = (map[q.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const byType = useMemo(() => {
    const map = {};
    filtered.forEach((q) => {
      const k = q.project_name ? (q.project_name) : 'Uden projekt';
      if (!map[k]) map[k] = { won: 0, lost: 0 };
      if (q.status === 'Accepteret') map[k].won++;
      else if (q.status === 'Afvist') map[k].lost++;
    });
    return Object.entries(map).filter(([, v]) => v.won + v.lost > 0).map(([name, v]) => ({ name, ...v }));
  }, [filtered]);

  const lost = filtered.filter((q) => q.status === 'Afvist' || q.status === 'Udløbet');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Tilbudsanalyse</h1>
        <p className="text-slate-500 mt-1">Succesrater og årsager til vundne eller tabte opgaver</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5"><Label>Fra dato</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" /></div>
        <div className="space-y-1.5"><Label>Til dato</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" /></div>
        <button onClick={() => { setFrom(''); setTo(''); }} className="text-sm text-slate-500 hover:text-slate-800 underline">Nulstil</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-2 text-slate-400 mb-1"><FileText className="w-4 h-4" /><span className="text-xs">Tilbud i alt</span></div><div className="text-2xl font-bold text-slate-900">{stats.total}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-2 text-emerald-500 mb-1"><CheckCircle2 className="w-4 h-4" /><span className="text-xs">Vundet</span></div><div className="text-2xl font-bold text-slate-900">{stats.won}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-2 text-red-500 mb-1"><XCircle className="w-4 h-4" /><span className="text-xs">Tabt</span></div><div className="text-2xl font-bold text-slate-900">{stats.lost}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-2 text-amber-500 mb-1"><Target className="w-4 h-4" /><span className="text-xs">Succesrate</span></div><div className="text-2xl font-bold text-slate-900">{stats.winRate}%</div></div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Statusfordeling</h2>
          {statusDist.length === 0 ? <p className="text-slate-400 text-sm">Ingen data</p> : (
            <div className="h-64"><ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{statusDist.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#94a3b8'} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer></div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Vundet vs. tabt pr. projekt</h2>
          {byType.length === 0 ? <p className="text-slate-400 text-sm">Ingen data</p> : (
            <div className="h-64"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Legend /><Bar dataKey="won" name="Vundet" fill="#10b981" radius={[4,4,0,0]} /><Bar dataKey="lost" name="Tabt" fill="#ef4444" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer></div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-900 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-500" /> Tabte/udløbne tilbud</div>
        {lost.length === 0 ? <p className="px-4 py-6 text-slate-400 text-sm text-center">Ingen tabte tilbud.</p> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="text-left px-4 py-2">Nr.</th><th className="text-left px-4 py-2">Kunde</th><th className="text-left px-4 py-2">Projekt</th><th className="text-left px-4 py-2">Status</th><th className="text-left px-4 py-2">Årsag/ noter</th></tr></thead>
            <tbody>
              {lost.map((q) => (
                <tr key={q.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-700">{q.quote_number}</td>
                  <td className="px-4 py-2 text-slate-600">{q.customer_name || '–'}</td>
                  <td className="px-4 py-2 text-slate-600">{q.project_name || '–'}</td>
                  <td className="px-4 py-2"><span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">{q.status}</span></td>
                  <td className="px-4 py-2 text-slate-500 max-w-xs truncate">{q.notes || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}