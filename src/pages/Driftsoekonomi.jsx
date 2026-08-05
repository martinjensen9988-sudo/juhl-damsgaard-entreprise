import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import { Loader2, TrendingUp, TrendingDown, Scale } from 'lucide-react';

export default function Driftsoekonomi() {
  const [projects, setProjects] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [times, setTimes] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [p, q, e, t] = await Promise.all([
          base44.entities.Project.list('-updated_date', 200),
          base44.entities.Quote.list('-updated_date', 500),
          base44.entities.Expense.list('-updated_date', 500),
          base44.entities.TimeEntry.list('-updated_date', 500),
        ]);
        setProjects(p);
        setQuotes(q);
        setExpenses(e);
        setTimes(t);
      } catch (err) { console.error(err); }
    })();
  }, []);

  if (!projects) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  const quoteTotal = (pid) => {
    const q = quotes.find((x) => x.project_id === pid && (x.status === 'Accepteret' || x.status === 'Sendt'));
    if (!q || !q.line_items) return 0;
    const net = q.line_items.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);
    return net;
  };

  const actualExpenses = (pid) =>
    expenses
      .filter((e) => e.project_id === pid && e.approval_status !== 'Afvist')
      .reduce((s, e) => s + Number(e.amount || 0), 0);

  const actualTimeCost = (pid) => {
    const entries = times.filter((t) => t.project_id === pid);
    // estimeret timepris pr. time: 350 kr inkl. moms → 280 netto
    return entries.reduce((s, t) => s + (Number(t.hours) || 0) * 280, 0);
  };

  const rows = projects.map((p) => {
    const quote = quoteTotal(p.id);
    const mat = actualExpenses(p.id);
    const labor = actualTimeCost(p.id);
    const actual = mat + labor;
    const margin = quote - actual;
    const pct = quote > 0 ? Math.round((margin / quote) * 100) : 0;
    return { p, quote, mat, labor, actual, margin, pct };
  }).filter((r) => r.quote > 0 || r.actual > 0);

  const totals = rows.reduce((acc, r) => ({
    quote: acc.quote + r.quote,
    mat: acc.mat + r.mat,
    labor: acc.labor + r.labor,
    actual: acc.actual + r.actual,
    margin: acc.margin + r.margin,
  }), { quote: 0, mat: 0, labor: 0, actual: 0, margin: 0 });

  const totalMarginPct = totals.quote > 0 ? Math.round((totals.margin / totals.quote) * 100) : 0;

  const kpis = [
    { label: 'Samlet tilbudsgrundlag', value: formatDKK(totals.quote), icon: Scale, color: 'text-blue-600 bg-blue-50' },
    { label: 'Faktiske omkostninger', value: formatDKK(totals.actual), icon: TrendingDown, color: 'text-rose-600 bg-rose-50' },
    { label: 'Dækningsbidrag', value: formatDKK(totals.margin), icon: TrendingUp, color: totalMarginPct >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50' },
    { label: 'Dækningsgrad', value: `${totalMarginPct}%`, icon: TrendingUp, color: totalMarginPct >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Driftsøkonomi</h1>
        <p className="text-slate-500 mt-1">Dækningsbidrag og faktiske omkostninger sammenlignet med oprindeligt tilbud</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${k.color}`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-slate-900">{k.value}</div>
            <div className="text-sm text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Projekt</th>
                <th className="text-right px-4 py-3 font-medium">Tilbud (netto)</th>
                <th className="text-right px-4 py-3 font-medium">Materialer</th>
                <th className="text-right px-4 py-3 font-medium">Løn (timer)</th>
                <th className="text-right px-4 py-3 font-medium">Faktisk total</th>
                <th className="text-right px-4 py-3 font-medium">Dækningsbidrag</th>
                <th className="text-right px-4 py-3 font-medium">Grad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Ingen projekter med tilbud eller omkostninger endnu.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{r.p.name}</div>
                    <div className="text-xs text-slate-500">{r.p.customer_name}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatDKK(r.quote)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatDKK(r.mat)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatDKK(r.labor)}</td>
                  <td className="px-4 py-3 text-right text-slate-900 font-medium">{formatDKK(r.actual)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${r.margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatDKK(r.margin)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.pct >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {r.pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr className="font-semibold text-slate-900">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{formatDKK(totals.quote)}</td>
                  <td className="px-4 py-3 text-right">{formatDKK(totals.mat)}</td>
                  <td className="px-4 py-3 text-right">{formatDKK(totals.labor)}</td>
                  <td className="px-4 py-3 text-right">{formatDKK(totals.actual)}</td>
                  <td className={`px-4 py-3 text-right ${totals.margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatDKK(totals.margin)}</td>
                  <td className="px-4 py-3 text-right">{totalMarginPct}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}