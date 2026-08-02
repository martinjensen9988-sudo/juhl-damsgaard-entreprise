import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Users, HardHat, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TidsRapporter() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.TimeEntry.list('-date', 1000);
      setEntries(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => entries.filter((e) => {
    if (from && e.date && e.date < from) return false;
    if (to && e.date && e.date > to) return false;
    return true;
  }), [entries, from, to]);

  const byEmployee = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      const k = e.user_name || 'Ukendt';
      map[k] = (map[k] || 0) + (Number(e.hours) || 0);
    });
    return Object.entries(map).map(([name, hours]) => ({ name, hours: Number(hours.toFixed(1)) })).sort((a, b) => b.hours - a.hours);
  }, [filtered]);

  const byProject = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      const k = e.project_name || 'Uden projekt';
      map[k] = (map[k] || 0) + (Number(e.hours) || 0);
    });
    return Object.entries(map).map(([name, hours]) => ({ name, hours: Number(hours.toFixed(1)) })).sort((a, b) => b.hours - a.hours);
  }, [filtered]);

  const totalHours = filtered.reduce((s, e) => s + (Number(e.hours) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Tidsrapporter</h1>
        <p className="text-slate-500 mt-1">Forbrugte timer pr. medarbejder og projekt</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Fra dato</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
        </div>
        <div className="space-y-1.5">
          <Label>Til dato</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
        </div>
        <button onClick={() => { setFrom(''); setTo(''); }} className="text-sm text-slate-500 hover:text-slate-800 underline">Nulstil</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1"><Clock className="w-4 h-4" /><span className="text-xs">Total timer</span></div>
          <div className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1"><Users className="w-4 h-4" /><span className="text-xs">Medarbejdere</span></div>
          <div className="text-2xl font-bold text-slate-900">{byEmployee.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1"><HardHat className="w-4 h-4" /><span className="text-xs">Projekter</span></div>
          <div className="text-2xl font-bold text-slate-900">{byProject.length}</div>
        </div>
      </div>

      {byEmployee.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Timer pr. medarbejder</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byEmployee}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-900 text-sm">Pr. medarbejder</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr><th className="text-left px-4 py-2">Medarbejder</th><th className="text-right px-4 py-2">Timer</th></tr>
            </thead>
            <tbody>
              {byEmployee.map((r) => (
                <tr key={r.name} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-700">{r.name}</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">{r.hours.toFixed(1)}</td>
                </tr>
              ))}
              {byEmployee.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400">Ingen data</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-900 text-sm">Pr. projekt</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr><th className="text-left px-4 py-2">Projekt</th><th className="text-right px-4 py-2">Timer</th></tr>
            </thead>
            <tbody>
              {byProject.map((r) => (
                <tr key={r.name} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-700">{r.name}</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">{r.hours.toFixed(1)}</td>
                </tr>
              ))}
              {byProject.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400">Ingen data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}