import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatDKK, calcSubtotal, calcVAT, calcTotal, formatDate } from '@/lib/format';
import { HardHat, FileText, Receipt, TrendingUp, ArrowRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import ProjectTimeline from '@/components/ProjectTimeline';
import ProjektOekonomiOverview from '@/components/ProjektOekonomiOverview';
import DashboardCharts from '@/components/DashboardCharts';

const STATUS_COLORS = {
  'I gang': 'bg-blue-100 text-blue-700',
  Planlægning: 'bg-amber-100 text-amber-700',
  Afsluttet: 'bg-emerald-100 text-emerald-700',
  'På hold': 'bg-slate-200 text-slate-600',
  Kladde: 'bg-slate-100 text-slate-500',
  Sendt: 'bg-blue-100 text-blue-700',
  Accepteret: 'bg-emerald-100 text-emerald-700',
  Afvist: 'bg-red-100 text-red-700',
  Betalt: 'bg-emerald-100 text-emerald-700',
  Forfalden: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [p, q, i] = await Promise.all([
          base44.entities.Project.list('-created_date', 50),
          base44.entities.Quote.list('-created_date', 50),
          base44.entities.Invoice.list('-created_date', 50),
        ]);
        setProjects(p);
        setQuotes(q);
        setInvoices(i);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeProjects = projects.filter((p) => p.status === 'I gang');
  const pendingQuotes = quotes.filter((q) => q.status === 'Sendt' || q.status === 'Kladde');
  const acceptedQuotes = quotes.filter((q) => q.status === 'Accepteret');
  const recentlyAccepted = acceptedQuotes
    .filter((q) => q.accepted_at)
    .sort((a, b) => new Date(b.accepted_at) - new Date(a.accepted_at))
    .slice(0, 3);
  const unpaidInvoices = invoices.filter(
    (i) => i.status === 'Sendt' || i.status === 'Forfalden'
  );
  const totalRevenue = invoices
    .filter((i) => i.status === 'Betalt')
    .reduce((sum, inv) => sum + calcTotal(inv.line_items), 0);
  const outstanding = unpaidInvoices.reduce((sum, inv) => sum + calcTotal(inv.line_items), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = [
    { label: 'Aktive projekter', value: activeProjects.length, icon: HardHat, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Åbne tilbud', value: pendingQuotes.length, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Ubetalte fakturaer', value: unpaidInvoices.length, icon: Receipt, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Faktureret omsætning', value: formatDKK(totalRevenue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overblik over dine projekter, tilbud og fakturaer</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {outstanding > 0 && (
        <div className="bg-slate-900 rounded-xl p-5 flex items-center gap-3 text-white">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <div className="flex-1">
            <div className="text-sm text-slate-300">Udestående til inkasso</div>
            <div className="text-xl font-bold">{formatDKK(outstanding)}</div>
          </div>
          <Link to="/faktura" className="text-amber-400 text-sm font-medium hover:underline flex items-center gap-1">
            Se fakturaer <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {recentlyAccepted.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-900">Nyligt accepterede tilbud</h2>
            <span className="ml-auto text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{acceptedQuotes.length} i alt</span>
          </div>
          <div className="divide-y divide-emerald-100">
            {recentlyAccepted.map((q) => (
              <div key={q.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">{q.quote_number} — {q.customer_name || '—'}</div>
                  <div className="text-xs text-slate-600">
                    {q.accepted_by && `Godkendt af ${q.accepted_by}`}
                    {q.accepted_at && ` • ${formatDate(q.accepted_at)}`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-slate-900">{formatDKK(calcTotal(q.line_items))}</div>
                  <Link to="/tilbud" className="text-xs text-emerald-700 hover:underline">Åbn tilbud</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DashboardCharts />

      <ProjektOekonomiOverview />

      <ProjectTimeline projects={projects} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent projects */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Seneste projekter</h2>
            <Link to="/projekter" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              Alle <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {projects.slice(0, 5).map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.customer_name || '—'}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
            {projects.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Ingen projekter endnu</div>
            )}
          </div>
        </div>

        {/* Recent quotes */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Seneste tilbud</h2>
            <Link to="/tilbud" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              Alle <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {quotes.slice(0, 5).map((q) => (
              <div key={q.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">{q.quote_number}</div>
                  <div className="text-xs text-slate-500">{formatDKK(calcTotal(q.line_items))}</div>
                </div>
                <StatusBadge status={q.status} />
              </div>
            ))}
            {quotes.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Ingen tilbud endnu</div>
            )}
          </div>
        </div>

        {/* Recent invoices */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Seneste fakturaer</h2>
            <Link to="/faktura" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              Alle <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {invoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">{inv.invoice_number}</div>
                  <div className="text-xs text-slate-500">{formatDKK(calcTotal(inv.line_items))}</div>
                </div>
                <StatusBadge status={inv.status} />
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Ingen fakturaer endnu</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}