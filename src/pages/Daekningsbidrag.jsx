import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK, calcTotal } from '@/lib/format';
import { TrendingUp, TrendingDown, PieChart, AlertTriangle } from 'lucide-react';

export default function Daekningsbidrag() {
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, inv, t, m, e] = await Promise.all([
          base44.entities.Project.list('-created_date', 200),
          base44.entities.Invoice.list('-created_date', 200),
          base44.entities.TimeEntry.list('-created_date', 200),
          base44.entities.Material.list('-created_date', 200),
          base44.entities.Employee.list('-created_date', 200),
        ]);
        setProjects(p);
        setInvoices(inv);
        setTimeEntries(t);
        setMaterials(m);
        setEmployees(e);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const empRate = (name) => {
    const e = employees.find((e) => e.name === name);
    return e?.hourly_rate || 0;
  };

  const rows = projects.map((p) => {
    const projInvoices = invoices.filter((i) => i.project_id === p.id);
    const revenue = projInvoices.reduce((s, i) => s + calcTotal(i.line_items), 0) || p.budget || 0;
    const projTime = timeEntries.filter((t) => t.project_id === p.id);
    const laborCost = projTime.reduce((s, t) => s + (t.hours || 0) * empRate(t.user_name), 0);
    const totalHours = projTime.reduce((s, t) => s + (t.hours || 0), 0);
    const projMaterials = materials.filter((m) => m.project_id === p.id);
    const materialCost = projMaterials.reduce((s, m) => s + (m.quantity || 0) * (m.unit_price || 0), 0);
    const totalCost = laborCost + materialCost;
    const dækningsbidrag = revenue - totalCost;
    const dækningsgrad = revenue > 0 ? Math.round((dækningsbidrag / revenue) * 100) : null;
    return { project: p, revenue, laborCost, materialCost, totalCost, totalHours, dækningsbidrag, dækningsgrad };
  }).filter((r) => r.revenue > 0 || r.totalCost > 0)
    .sort((a, b) => (a.dækningsgrad ?? -999) - (b.dækningsgrad ?? -999));

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCost = rows.reduce((s, r) => s + r.totalCost, 0);
  const totalBidrag = rows.reduce((s, r) => s + r.dækningsbidrag, 0);
  const avgGrad = totalRevenue > 0 ? Math.round((totalBidrag / totalRevenue) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Dækningsbidrag</h1>
        <p className="text-slate-500 mt-1">Dækningsgrad og dækningsbidrag pr. projekt – faktureret beløb vs. registrerede omkostninger</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Total omsætning</div>
          <div className="text-xl font-bold text-slate-900">{formatDKK(totalRevenue)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Total variable omkostning</div>
          <div className="text-xl font-bold text-slate-700">{formatDKK(totalCost)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Total dækningsbidrag</div>
          <div className={`text-xl font-bold ${totalBidrag >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatDKK(totalBidrag)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">Gennemsnitlig dækningsgrad</div>
          <div className={`text-xl font-bold ${avgGrad >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{avgGrad}%</div>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <PieChart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen projekter med data endnu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Projekt</th>
                  <th className="px-4 py-3 text-right">Omsætning</th>
                  <th className="px-4 py-3 text-right">Timeløn</th>
                  <th className="px-4 py-3 text-right">Materialer</th>
                  <th className="px-4 py-3 text-right">Dækningsbidrag</th>
                  <th className="px-4 py-3 text-right">Dækningsgrad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((r) => (
                  <tr key={r.project.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.project.name}</div>
                      <div className="text-xs text-slate-400">{r.project.customer_name || '—'} · {r.project.type}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatDKK(r.revenue)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatDKK(r.laborCost)}<span className="block text-xs text-slate-400">{r.totalHours}t</span></td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatDKK(r.materialCost)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${r.dækningsbidrag >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatDKK(r.dækningsbidrag)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.dækningsgrad === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {r.dækningsgrad < 0 ? (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          ) : r.dækningsgrad < 15 ? (
                            <TrendingDown className="w-4 h-4 text-amber-500" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                          )}
                          <span className={`font-bold ${r.dækningsgrad < 0 ? 'text-red-600' : r.dækningsgrad < 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {r.dækningsgrad}%
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr className="font-semibold text-slate-900">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{formatDKK(totalRevenue)}</td>
                  <td className="px-4 py-3 text-right">{formatDKK(rows.reduce((s, r) => s + r.laborCost, 0))}</td>
                  <td className="px-4 py-3 text-right">{formatDKK(rows.reduce((s, r) => s + r.materialCost, 0))}</td>
                  <td className={`px-4 py-3 text-right ${totalBidrag >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatDKK(totalBidrag)}</td>
                  <td className={`px-4 py-3 text-right ${avgGrad >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{avgGrad}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}