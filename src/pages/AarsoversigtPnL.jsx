import { useEffect, useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { loadAccounts, loadPostedEntries, accountMap, computeMonthlyResultat } from '@/lib/accounting';
import { TrendingUp } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MAANEDER = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const fmt = (n) => (n || 0).toLocaleString('da-DK', { maximumFractionDigits: 0 });

export default function AarsoversigtPnL() {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const load = useCallback(async () => {
    const [e, a] = await Promise.all([loadPostedEntries(), loadAccounts()]);
    setEntries(e); setAccounts(a);
  }, []);
  useEffect(() => { load(); }, [load]);

  const aMap = accountMap(accounts);
  const months = computeMonthlyResultat(entries, year, aMap);
  const chartData = months.map((m) => ({ navn: MAANEDER[m.maaned - 1], Indtægter: Math.round(m.indtaegt), Udgifter: Math.round(m.omkostning), Dækningsbidrag: Math.round(m.dækningsbidrag), Akkumuleret: Math.round(m.cumulative) }));

  const sumIndtaegt = months.reduce((s, m) => s + m.indtaegt, 0);
  const sumOmkostning = months.reduce((s, m) => s + m.omkostning, 0);
  const sumDB = sumIndtaegt - sumOmkostning;

  const yearOptions = [];
  const now = new Date().getFullYear();
  for (let y = now + 1; y >= now - 3; y--) yearOptions.push(String(y));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="w-6 h-6" /> Årsoversigt P&L</h1>
          <p className="text-sm text-muted-foreground">Månedlig fordeling af indtægter, udgifter og dækningsbidrag.</p>
        </div>
        <div><Label>Regnskabsår</Label><Select value={year} onValueChange={setYear}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{yearOptions.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">Årets indtægter</div><div className="text-2xl font-bold text-emerald-700">{fmt(sumIndtaegt)} DKK</div></div>
        <div className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">Årets udgifter</div><div className="text-2xl font-bold text-red-700">{fmt(sumOmkostning)} DKK</div></div>
        <div className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">Dækningsbidrag i alt</div><div className={`text-2xl font-bold ${sumDB >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(sumDB)} DKK</div></div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Indtægter vs. udgifter pr. måned</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="navn" />
            <YAxis tickFormatter={(v) => fmt(v)} />
            <Tooltip formatter={(v) => fmt(v) + ' DKK'} />
            <Legend />
            <Bar dataKey="Indtægter" fill="#10b981" name="Indtægter" />
            <Bar dataKey="Udgifter" fill="#ef4444" name="Udgifter" />
            <Line dataKey="Dækningsbidrag" stroke="#3b82f6" strokeWidth={2} name="Dækningsbidrag" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Akkumuleret dækningsbidrag</h3>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="navn" />
            <YAxis tickFormatter={(v) => fmt(v)} />
            <Tooltip formatter={(v) => fmt(v) + ' DKK'} />
            <Line dataKey="Akkumuleret" stroke="#6366f1" strokeWidth={3} name="Akkumuleret dækningsbidrag" dot />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-muted-foreground">
            <tr>
              <th className="text-left p-3">Måned</th>
              <th className="text-right p-3">Indtægter</th>
              <th className="text-right p-3">Udgifter</th>
              <th className="text-right p-3">Dækningsbidrag</th>
              <th className="text-right p-3">Akkumuleret</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.period} className="border-t">
                <td className="p-3 font-medium">{MAANEDER[m.maaned - 1]}</td>
                <td className="p-3 text-right text-emerald-700">{fmt(m.indtaegt)}</td>
                <td className="p-3 text-right text-red-700">{fmt(m.omkostning)}</td>
                <td className={`p-3 text-right font-medium ${m.dækningsbidrag >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(m.dækningsbidrag)}</td>
                <td className={`p-3 text-right ${m.cumulative >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{fmt(m.cumulative)}</td>
              </tr>
            ))}
            <tr className="border-t bg-slate-50 font-bold">
              <td className="p-3">Året i alt</td>
              <td className="p-3 text-right text-emerald-700">{fmt(sumIndtaegt)}</td>
              <td className="p-3 text-right text-red-700">{fmt(sumOmkostning)}</td>
              <td className={`p-3 text-right ${sumDB >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(sumDB)}</td>
              <td className="p-3 text-right">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}