import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Users, ShoppingBag } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const PIE_COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

function monthKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function DashboardCharts() {
  const [loading, setLoading] = useState(true);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [projectResources, setProjectResources] = useState([]);
  const [supplierByCategory, setSupplierByCategory] = useState([]);
  const [supplierTotal, setSupplierTotal] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [invoices, times, supplierInvoices, projects] = await Promise.all([
          base44.entities.Invoice.list('-created_date', 200).catch(() => []),
          base44.entities.TimeEntry.list('-created_date', 300).catch(() => []),
          base44.entities.SupplierInvoice.list('-created_date', 200).catch(() => []),
          base44.entities.Project.list('-created_date', 100).catch(() => []),
        ]);

        // 1. Månedlig omsætning (betalte + sendte fakturaer, seneste 12 mdr)
        // Anker til nyeste fakturadato så hele demo-perioden vises uanset browserens ur.
        const invoiceTimes = (invoices || [])
          .map((inv) => (inv.date ? new Date(inv.date).getTime() : NaN))
          .filter((t) => !isNaN(t));
        const anchor = invoiceTimes.length ? new Date(Math.max(...invoiceTimes, Date.now())) : new Date();
        const buckets = {};
        for (let i = 11; i >= 0; i--) {
          const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
          buckets[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
        }
        (invoices || []).forEach((inv) => {
          if (inv.status !== 'Betalt' && inv.status !== 'Sendt') return;
          const key = monthKey(inv.date);
          if (key && buckets[key] !== undefined) {
            const total = (inv.line_items || []).reduce((s, li) => s + (Number(li.quantity) || 0) * (Number(li.unit_price) || 0), 0);
            buckets[key] += total;
          }
        });
        setMonthlyRevenue(
          Object.entries(buckets).map(([key, val]) => {
            const [, m] = key.split('-');
            return { month: MONTHS[parseInt(m, 10) - 1], omsaetning: Math.round(val) };
          })
        );

        // 2. Ressourceforbrug pr. projekt (timer) — top 6
        const projectMap = {};
        (projects || []).forEach((p) => { projectMap[p.id] = p.name || 'Uden navn'; });
        const hoursByProject = {};
        (times || []).forEach((t) => {
          const pid = t.project_id || 'none';
          const name = projectMap[pid] || t.project_name || 'Uden projekt';
          hoursByProject[name] = (hoursByProject[name] || 0) + (Number(t.hours) || 0);
        });
        const resourceRows = Object.entries(hoursByProject)
          .map(([name, hours]) => ({ name, timer: Math.round(hours * 10) / 10 }))
          .filter((r) => r.timer > 0)
          .sort((a, b) => b.timer - a.timer)
          .slice(0, 6);
        setProjectResources(resourceRows);

        // 3. Indkøbsfakturaer pr. kategori
        const catMap = {};
        let total = 0;
        (supplierInvoices || []).forEach((inv) => {
          const cat = inv.category || 'Andet';
          const amt = (Number(inv.amount) || 0) + (Number(inv.vat_amount) || 0);
          catMap[cat] = (catMap[cat] || 0) + amt;
          total += amt;
        });
        setSupplierByCategory(
          Object.entries(catMap)
            .map(([name, beloeb]) => ({ name, beloeb: Math.round(beloeb) }))
            .sort((a, b) => b.beloeb - a.beloeb)
        );
        setSupplierTotal(total);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasRevenue = monthlyRevenue.some((m) => m.omsaetning > 0);
  const hasResources = projectResources.length > 0;
  const hasSupplier = supplierByCategory.length > 0;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Månedlig omsætning */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-900">Månedlig omsætning</h2>
          <span className="ml-auto text-xs text-slate-400">Seneste 12 måneder (betalte + sendte fakturaer)</span>
        </div>
        {hasRevenue ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
              <Tooltip formatter={(v) => [formatDKK(v), 'Omsætning']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Bar dataKey="omsaetning" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">Ingen fakturaomsætning endnu</div>
        )}
      </div>

      {/* Ressourceforbrug pr. projekt */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">Ressourceforbrug pr. projekt</h2>
          <span className="ml-auto text-xs text-slate-400">Timer</span>
        </div>
        {hasResources ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={projectResources} dataKey="timer" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2}>
                {projectResources.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} timer`, 'Timer']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => value.length > 22 ? value.slice(0, 20) + '…' : value} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">Ingen tidsregistreringer endnu</div>
        )}
      </div>

      {/* Indkøbsfakturaer pr. kategori */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-slate-900">Indkøbsfakturaer pr. kategori</h2>
          <span className="ml-auto text-xs text-slate-400">I alt {formatDKK(supplierTotal)}</span>
        </div>
        {hasSupplier ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={supplierByCategory} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} width={90} />
              <Tooltip formatter={(v) => [formatDKK(v), 'Beløb']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Bar dataKey="beloeb" fill="#f59e0b" radius={[0, 6, 6, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">Ingen indkøbsfakturaer endnu</div>
        )}
      </div>
    </div>
  );
}