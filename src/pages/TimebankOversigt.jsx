import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, Calendar } from 'lucide-react';

const WEEKLY_HOURS = 37;
const HOLIDAY_RATE = 0.125; // 12.5% feriepenge/ferie

export default function TimebankOversigt() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [emps, entries] = await Promise.all([
      base44.entities.Employee.list('-created_date', 200).catch(() => []),
      base44.entities.TimeEntry.list('-date', 1000).catch(() => []),
    ]);
    const year = new Date().getFullYear();
    const byName = {};
    (entries || []).forEach((e) => {
      if (!e.user_name) return;
      const y = e.date ? new Date(e.date).getFullYear() : null;
      if (y !== year) return;
      byName[e.user_name] = (byName[e.user_name] || 0) + (Number(e.hours) || 0);
    });
    const now = new Date();
    const weekNo = Math.ceil((((now - new Date(year, 0, 1)) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7);
    const weeks = Math.max(1, Math.min(52, weekNo));
    const result = (emps || []).map((emp) => {
      const total = byName[emp.name] || 0;
      const expected = weeks * WEEKLY_HOURS;
      const flex = total - expected;
      const holiday = total * HOLIDAY_RATE;
      return { ...emp, total, expected, flex, holiday };
    });
    setRows(result);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Timebank Oversigt</h1>
        <p className="text-sm text-muted-foreground">Optjente afspadseringstimer og ferie baseret på årets tidsregistreringer.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3"><div className="text-xs text-muted-foreground">Ugebasis</div><div className="text-xl font-bold">{WEEKLY_HOURS} t</div></div>
        <div className="rounded-lg border bg-card p-3"><div className="text-xs text-muted-foreground">Ferierate</div><div className="text-xl font-bold">{HOLIDAY_RATE * 100}%</div></div>
        <div className="rounded-lg border bg-card p-3"><div className="text-xs text-muted-foreground">Medarbejdere</div><div className="text-xl font-bold">{rows.length}</div></div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Medarbejder</th>
              <th className="text-right p-3 font-medium">Timer (i år)</th>
              <th className="text-right p-3 font-medium">Forventet</th>
              <th className="text-right p-3 font-medium">Fleksaldo</th>
              <th className="text-right p-3 font-medium">Optjent ferie</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Indlæser…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Ingen medarbejdere.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.trade || ''}</div>
                </td>
                <td className="p-3 text-right">{r.total.toFixed(1)}</td>
                <td className="p-3 text-right text-muted-foreground">{r.expected.toFixed(1)}</td>
                <td className={`p-3 text-right font-medium ${r.flex >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {r.flex >= 0 ? '+' : ''}{r.flex.toFixed(1)}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <span className="inline-flex items-center gap-1 text-muted-foreground"><Calendar className="w-3.5 h-3.5" /> {r.holiday.toFixed(1)} t</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Fleksaldo = årets timer − (uger forløbet × {WEEKLY_HOURS}t). Optjent ferie = timer × {HOLIDAY_RATE * 100}%.</p>
    </div>
  );
}