import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate, formatDKK } from '@/lib/format';
import { Link } from 'react-router-dom';
import { LayoutDashboard, HardHat, FileText, Receipt, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const lineTotal = (items = []) => items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
const statusBadge = {
  'I gang': 'bg-amber-100 text-amber-700', 'Planlægning': 'bg-blue-100 text-blue-700',
  'Sendt': 'bg-blue-100 text-blue-700', 'Accepteret': 'bg-emerald-100 text-emerald-700',
  'Betalt': 'bg-emerald-100 text-emerald-700', 'Forfalden': 'bg-red-100 text-red-700',
};

export default function KundeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [projects, quotes, invoices] = await Promise.all([
          base44.entities.Project.list(), base44.entities.Quote.list(), base44.entities.Invoice.list(),
        ]);
        setData({ projects, quotes, invoices });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const acceptQuote = async (q) => {
    await base44.functions.invoke('quoteAction', {
      quote_id: q.id,
      action: 'accept',
      customer_name: q.customer_name || q.customer_email || 'Kunde',
    });
    setData((d) => ({ ...d, quotes: d.quotes.map((x) => x.id === q.id ? { ...x, status: 'Accepteret' } : x) }));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>;
  if (!data) return null;

  const activeProjects = data.projects.filter((p) => p.status === 'I gang' || p.status === 'Planlægning');
  const pendingQuotes = data.quotes.filter((q) => q.status === 'Sendt');
  const activeInvoices = data.invoices.filter((i) => i.status === 'Sendt' || i.status === 'Forfalden' || i.status === 'Betalt');

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2"><LayoutDashboard className="w-6 h-6 text-amber-500" /> Dashboard</h1>
      <p className="text-sm text-slate-500 mb-6">Dine aktive projekter, tilbud der afventer godkendelse og fakturastatus</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><HardHat className="w-4 h-4" /> Aktive projekter</div><div className="text-3xl font-bold text-slate-900">{activeProjects.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><FileText className="w-4 h-4" /> Tilbud afventer</div><div className="text-3xl font-bold text-slate-900">{pendingQuotes.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Receipt className="w-4 h-4" /> Fakturaer</div><div className="text-3xl font-bold text-slate-900">{activeInvoices.length}</div></div>
      </div>

      {pendingQuotes.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-amber-500" /> Tilbud der afventer godkendelse</h2>
          <div className="space-y-3">
            {pendingQuotes.map((q) => (
              <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div><div className="font-semibold text-slate-900">{q.quote_number} — {q.project_name || '—'}</div><div className="text-sm text-slate-500 mt-0.5">Gyldig til: {q.valid_until ? formatDate(q.valid_until) : '—'}</div></div>
                  <div className="text-lg font-bold text-slate-900">{formatDKK(lineTotal(q.line_items))}</div>
                </div>
                <div className="flex gap-3">
                  <Link to={`/portal/tilbud/${q.id}`} className="text-sm text-amber-600 hover:text-amber-700 font-medium">Se tilbud</Link>
                  <button onClick={() => acceptQuote(q)} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Acceptér</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><HardHat className="w-5 h-5 text-amber-500" /> Aktive projekter</h2>
      <div className="space-y-3 mb-8">
        {activeProjects.length === 0 ? <p className="text-sm text-slate-400 bg-white rounded-xl border p-5">Ingen aktive projekter</p> : activeProjects.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2"><div className="font-semibold text-slate-900">{p.name}</div><span className={`text-xs px-2.5 py-1 rounded-full ${statusBadge[p.status] || 'bg-slate-100 text-slate-600'}`}>{p.status}</span></div>
            <div className="text-sm text-slate-500">{p.type} • {p.address || '—'}</div>
            {p.start_date && p.end_date && <div className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDate(p.start_date)} → {formatDate(p.end_date)}</div>}
          </div>
        ))}
      </div>

      <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Receipt className="w-5 h-5 text-amber-500" /> Fakturastatus</h2>
      <div className="space-y-3">
        {activeInvoices.length === 0 ? <p className="text-sm text-slate-400 bg-white rounded-xl border p-5">Ingen fakturaer</p> : activeInvoices.map((inv) => {
          const overdue = inv.status === 'Forfalden' || (inv.due_date && inv.status === 'Sendt' && new Date(inv.due_date) < new Date());
          return (
            <div key={inv.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
              <div><div className="font-medium text-slate-900">{inv.invoice_number}</div><div className="text-sm text-slate-500">{inv.project_name || '—'} • Forfald: {inv.due_date ? formatDate(inv.due_date) : '—'}</div></div>
              <div className="text-right">
                <div className="font-semibold text-slate-900">{formatDKK(lineTotal(inv.line_items))}</div>
                <div className="flex items-center gap-1.5 justify-end mt-1"><span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[inv.status] || 'bg-slate-100 text-slate-600'}`}>{inv.status}</span>{overdue && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
