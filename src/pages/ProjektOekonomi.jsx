import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import { Calculator, TrendingUp, TrendingDown, Wallet, Users, Package } from 'lucide-react';

export default function ProjektOekonomi() {
  const [projects, setProjects] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      const [p, t, m, e] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.TimeEntry.list(),
        base44.entities.Material.list(),
        base44.entities.Employee.list(),
      ]);
      setProjects(p); setTimeEntries(t); setMaterials(m); setEmployees(e);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  const rateMap = {};
  employees.forEach((e) => { if (e.name) rateMap[e.name] = e.hourly_rate || 0; });
  const defaultRate = employees.length > 0 ? employees.reduce((s, e) => s + (e.hourly_rate || 0), 0) / employees.length : 350;

  const calcProject = (p) => {
    const pTimes = timeEntries.filter((t) => t.project_id === p.id);
    const laborCost = pTimes.reduce((s, t) => s + (Number(t.hours) || 0) * (rateMap[t.user_name] || defaultRate), 0);
    const laborHours = pTimes.reduce((s, t) => s + (Number(t.hours) || 0), 0);
    const pMats = materials.filter((m) => m.project_id === p.id);
    const matCost = pMats.reduce((s, m) => s + (Number(m.quantity) || 0) * (Number(m.unit_price) || 0), 0);
    const budget = Number(p.budget) || 0;
    const actual = laborCost + matCost;
    const remaining = budget - actual;
    const pct = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
    return { budget, actual, remaining, pct, laborCost, laborHours, matCost, pTimes, pMats };
  };

  const activeProjects = projects.filter((p) => p.status === 'I gang' || p.status === 'Planlægning');

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Projektøkonomi</h1>
      <p className="text-sm text-slate-500 mb-6">Budget mod forbrug — lønomkostninger og materialeforbrug per projekt</p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Projekt</th>
              <th className="px-4 py-3 font-medium text-right">Budget</th>
              <th className="px-4 py-3 font-medium text-right">Løn</th>
              <th className="px-4 py-3 font-medium text-right">Materialer</th>
              <th className="px-4 py-3 font-medium text-right">Forbrug</th>
              <th className="px-4 py-3 font-medium text-right">Rest</th>
              <th className="px-4 py-3 font-medium">Fremgang</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeProjects.map((p) => {
              const c = calcProject(p);
              return (
                <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(selected === p.id ? null : p.id)}>
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}<div className="text-xs text-slate-400">{p.customer_name || '—'}</div></td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatDKK(c.budget)}</td>
                  <td className="px-4 py-3 text-right text-slate-700"><span className="text-xs text-slate-400 block">{c.laborHours}t</span>{formatDKK(c.laborCost)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatDKK(c.matCost)}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatDKK(c.actual)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${c.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatDKK(c.remaining)}</td>
                  <td className="px-4 py-3"><div className="w-24 bg-slate-100 rounded-full h-2"><div className={`h-2 rounded-full ${c.pct > 90 ? 'bg-red-500' : c.pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${c.pct}%` }} /></div><div className="text-xs text-slate-400 mt-1">{c.pct.toFixed(0)}%</div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {activeProjects.length === 0 && <div className="text-center py-12 text-slate-400"><Calculator className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>Ingen aktive projekter</p></div>}
      </div>

      {selected && (() => {
        const p = projects.find((x) => x.id === selected);
        if (!p) return null;
        const c = calcProject(p);
        return (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">{p.name} — Detaljer</h2>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Wallet className="w-3.5 h-3.5" /> Budget</div><div className="text-xl font-bold text-slate-900">{formatDKK(c.budget)}</div></div>
              <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Users className="w-3.5 h-3.5" /> Løn ({c.laborHours}t)</div><div className="text-xl font-bold text-slate-900">{formatDKK(c.laborCost)}</div></div>
              <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Package className="w-3.5 h-3.5" /> Materialer</div><div className="text-xl font-bold text-slate-900">{formatDKK(c.matCost)}</div></div>
              <div className={`rounded-lg p-4 ${c.remaining < 0 ? 'bg-red-50' : 'bg-emerald-50'}`}><div className={`flex items-center gap-2 text-xs mb-1 ${c.remaining < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{c.remaining < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />} Rest</div><div className={`text-xl font-bold ${c.remaining < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatDKK(c.remaining)}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Tidsregistreringer</div>
                {c.pTimes.length === 0 ? <p className="text-sm text-slate-400">Ingen</p> : <div className="space-y-1">{c.pTimes.map((t) => (
                  <div key={t.id} className="flex justify-between text-sm"><span className="text-slate-600">{t.user_name} — {t.task_type}</span><span className="text-slate-500">{t.hours}t = {formatDKK((t.hours || 0) * (rateMap[t.user_name] || defaultRate))}</span></div>
                ))}</div>}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Materialer</div>
                {c.pMats.length === 0 ? <p className="text-sm text-slate-400">Ingen</p> : <div className="space-y-1">{c.pMats.map((m) => (
                  <div key={m.id} className="flex justify-between text-sm"><span className="text-slate-600">{m.name} — {m.quantity} {m.unit}</span><span className="text-slate-500">{formatDKK((m.quantity || 0) * (m.unit_price || 0))}</span></div>
                ))}</div>}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}