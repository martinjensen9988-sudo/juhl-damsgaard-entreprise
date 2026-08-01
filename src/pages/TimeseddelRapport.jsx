import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/format';
import { Timer, Users, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'];

export default function TimeseddelRapport() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [offset, setOffset] = useState(0);

  const load = async () => { try { setEntries(await base44.entities.TimeEntry.list()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const now = new Date();
  let start, end, label;
  if (period === 'week') {
    const day = now.getDay() || 7;
    start = new Date(now); start.setDate(now.getDate() - day + 1 - offset * 7);
    end = new Date(start); end.setDate(start.getDate() + 6);
    label = `${formatDate(start.toISOString().slice(0, 10))} → ${formatDate(end.toISOString().slice(0, 10))}`;
  } else {
    start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
    label = `${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
  }

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  const periodEntries = entries.filter((e) => e.date >= startStr && e.date <= endStr);

  const byEmployee = {};
  periodEntries.forEach((e) => {
    const name = e.user_name || 'Ukendt';
    if (!byEmployee[name]) byEmployee[name] = { total: 0, projects: {}, types: {} };
    byEmployee[name].total += Number(e.hours) || 0;
    const proj = e.project_name || '—';
    byEmployee[name].projects[proj] = (byEmployee[name].projects[proj] || 0) + (Number(e.hours) || 0);
    const type = e.task_type || 'Andet';
    byEmployee[name].types[type] = (byEmployee[name].types[type] || 0) + (Number(e.hours) || 0);
  });

  const employees = Object.entries(byEmployee).sort((a, b) => b[1].total - a[1].total);
  const grandTotal = periodEntries.reduce((s, e) => s + (Number(e.hours) || 0), 0);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Timeseddel Rapport</h1>
      <p className="text-sm text-slate-500 mb-6">Samlet overblik over medarbejdernes tidsregistrering til lønkørsel</p>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => setPeriod('week')} className={`px-4 py-2 rounded-lg text-sm font-medium ${period === 'week' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Uge</button>
          <button onClick={() => setPeriod('month')} className={`px-4 py-2 rounded-lg text-sm font-medium ${period === 'month' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Måned</button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setOffset(offset + 1)} className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium text-slate-700 min-w-[220px] text-center">{label}</span>
          <button onClick={() => setOffset(Math.max(0, offset - 1))} className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Users className="w-4 h-4" /> Medarbejdere</div><div className="text-2xl font-bold text-slate-900">{employees.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Clock className="w-4 h-4" /> Total timer</div><div className="text-2xl font-bold text-slate-900">{grandTotal}t</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Timer className="w-4 h-4" /> Registreringer</div><div className="text-2xl font-bold text-slate-900">{periodEntries.length}</div></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Medarbejder</th>
              <th className="px-4 py-3 font-medium text-right">Timer</th>
              <th className="px-4 py-3 font-medium">Projekter</th>
              <th className="px-4 py-3 font-medium">Arbejdstyper</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map(([name, data]) => (
              <tr key={name} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{name}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-700">{data.total}t</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{Object.entries(data.projects).map(([p, h]) => <span key={p} className="text-xs bg-slate-100 px-2 py-0.5 rounded">{p}: {h}t</span>)}</div></td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{Object.entries(data.types).map(([t, h]) => <span key={t} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{t}: {h}t</span>)}</div></td>
              </tr>
            ))}
          </tbody>
          {grandTotal > 0 && <tfoot className="bg-slate-50 border-t-2 border-slate-200"><tr><td className="px-4 py-3 font-bold text-slate-900">Total</td><td className="px-4 py-3 text-right font-bold text-slate-900">{grandTotal}t</td><td colSpan={2}></td></tr></tfoot>}
        </table>
        {employees.length === 0 && <div className="text-center py-12 text-slate-400"><Timer className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>Ingen tidsregistreringer i denne periode</p></div>}
      </div>
    </div>
  );
}