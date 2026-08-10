import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK, calcTotal } from '@/lib/format';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, FileText, Receipt, Clock, Trophy } from 'lucide-react';

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#64748b', '#ec4899'];

export default function Ledelsesoverblik() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [p, q, i, t] = await Promise.all([
          base44.entities.Project.list('-created_date', 200),
          base44.entities.Quote.list('-created_date', 200),
          base44.entities.Invoice.list('-created_date', 200),
          base44.entities.TimeEntry.list('-created_date', 200),
        ]);
        setProjects(p);
        setQuotes(q);
        setInvoices(i);
        setTimeEntries(t);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const data = useMemo(() => {
    const projectMap = {};
    projects.forEach((p) => { projectMap[p.id] = p; });

    // Monthly revenue (last 6 months)
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('da-DK', { month: 'short' }), revenue: 0 });
    }
    invoices.forEach((inv) => {
      if (!inv.date) return;
      const d = new Date(inv.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((mo) => mo.key === key);
      if (m) m.revenue += calcTotal(inv.line_items);
    });

    // Revenue by project type
    const typeRevenue = {};
    invoices.forEach((inv) => {
      const total = calcTotal(inv.line_items);
      if (inv.project_id && projectMap[inv.project_id]) {
        const type = projectMap[inv.project_id].type || 'Andet';
        typeRevenue[type] = (typeRevenue[type] || 0) + total;
      }
    });
    const typeData = Object.entries(typeRevenue).map(([name, value]) => ({ name, value }));

    // Quote funnel
    const quoteStages = ['Kladde', 'Sendt', 'Accepteret', 'Afvist', 'Udløbet'];
    const quoteData = quoteStages.map((s) => ({ name: s, count: quotes.filter((q) => q.status === s).length }));

    // Invoice status
    const invStages = ['Kladde', 'Sendt', 'Betalt', 'Forfalden', 'Annulleret'];
    const invData = invStages.map((s) => ({
      name: s,
      count: invoices.filter((i) => i.status === s).length,
      amount: invoices.filter((i) => i.status === s).reduce((sum, i) => sum + calcTotal(i.line_items), 0),
    }));

    // KPIs
    const totalRevenue = invoices.filter((i) => i.status === 'Betalt').reduce((s, i) => s + calcTotal(i.line_items), 0);
    const outstanding = invoices.filter((i) => i.status === 'Sendt' || i.status === 'Forfalden').reduce((s, i) => s + calcTotal(i.line_items), 0);
    const totalHours = timeEntries.reduce((s, t) => s + (t.hours || 0), 0);
    const wonQuotes = quotes.filter((q) => q.status === 'Accepteret').length;
    const closedQuotes = wonQuotes + quotes.filter((q) => q.status === 'Afvist' || q.status === 'Udløbet').length;
    const winRate = closedQuotes > 0 ? Math.round((wonQuotes / closedQuotes) * 100) : 0;
    const avgQuote = quotes.length > 0 ? quotes.reduce((s, q) => s + calcTotal(q.line_items), 0) / quotes.length : 0;

    // Top customers by revenue
    const custRevenue = {};
    invoices.forEach((inv) => {
      if (inv.customer_name) {
        custRevenue[inv.customer_name] = (custRevenue[inv.customer_name] || 0) + calcTotal(inv.line_items);
      }
    });
    const topCustomers = Object.entries(custRevenue).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

    return { months, typeData, quoteData, invData, totalRevenue, outstanding, totalHours, winRate, avgQuote, topCustomers };
  }, [projects, quotes, invoices, timeEntries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  const kpis = [
    { label: 'Faktureret omsætning', value: formatDKK(data.totalRevenue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Udestående', value: formatDKK(data.outstanding), icon: Receipt, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Win rate', value: `${data.winRate}%`, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total timer', value: `${data.totalHours}t`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Ledelsesoverblik</h1>
        <p className="text-slate-500 mt-1">Indsigt i omsætning, win rate og forretningssundhed</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="text-xl font-bold text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Omsætning pr. måned</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.months}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatDKK(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by type */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Omsætning pr. projekttype</h2>
          {data.typeData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">Ingen data endnu</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                  {data.typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatDKK(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quote funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-400" /> Tilbuds pipeline</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.quoteData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" width={70} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Top kunder</h2>
          {data.topCustomers.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">Ingen data endnu</div>
          ) : (
            <div className="space-y-3">
              {data.topCustomers.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-900 truncate">{c.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 shrink-0 ml-2">{formatDKK(c.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}