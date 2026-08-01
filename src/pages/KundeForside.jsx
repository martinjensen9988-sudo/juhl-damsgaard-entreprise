import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate, formatDKK } from '@/lib/format';
import { HardHat, Receipt, MessageSquare, AlertCircle } from 'lucide-react';

const lineTotal = (items = []) => items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
const statusBadge = {
  'I gang': 'bg-amber-100 text-amber-700', 'Planlægning': 'bg-blue-100 text-blue-700',
  'Sendt': 'bg-blue-100 text-blue-700', 'Forfalden': 'bg-red-100 text-red-700',
  'Åben': 'bg-amber-100 text-amber-700', 'Besvaret': 'bg-emerald-100 text-emerald-700',
};

export default function KundeForside() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const [projects, invoices, tickets] = await Promise.all([
          base44.entities.Project.list(),
          base44.entities.Invoice.list(),
          base44.entities.SupportTicket.list(),
        ]);
        setData({ projects, invoices, tickets });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>;
  if (!data) return null;

  const activeProjects = data.projects.filter((p) => p.status === 'I gang' || p.status === 'Planlægning');
  const unpaid = data.invoices.filter((i) => i.status === 'Sendt' || i.status === 'Forfalden');
  const unpaidTotal = unpaid.reduce((s, i) => s + lineTotal(i.line_items), 0);
  const openTickets = data.tickets.filter((t) => t.status === 'Åben');

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Velkommen{user?.full_name ? `, ${user.full_name}` : ''}</h1>
      <p className="text-sm text-slate-500 mb-6">Her er dit overblik over igangværende projekter og uløste fakturaer.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><HardHat className="w-4 h-4" /> Aktive projekter</div>
          <div className="text-3xl font-bold text-slate-900">{activeProjects.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Receipt className="w-4 h-4" /> Ubetalte fakturaer</div>
          <div className="text-3xl font-bold text-slate-900">{unpaid.length}</div>
          <div className="text-xs text-slate-500 mt-1">{formatDKK(unpaidTotal)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><MessageSquare className="w-4 h-4" /> Åbne beskeder</div>
          <div className="text-3xl font-bold text-slate-900">{openTickets.length}</div>
        </div>
      </div>

      <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><HardHat className="w-5 h-5 text-amber-500" /> Igangværende projekter</h2>
      <div className="space-y-3 mb-8">
        {activeProjects.length === 0 ? <p className="text-sm text-slate-400 bg-white rounded-xl border border-slate-200 p-5">Ingen aktive projekter</p> : activeProjects.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
            <div><div className="font-semibold text-slate-900">{p.name}</div><div className="text-sm text-slate-500 mt-0.5">{p.type} • {p.address || '—'}</div></div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge[p.status] || 'bg-slate-100 text-slate-600'}`}>{p.status}</span>
          </div>
        ))}
      </div>

      <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Receipt className="w-5 h-5 text-amber-500" /> Ubetalte fakturaer</h2>
      <div className="space-y-3 mb-8">
        {unpaid.length === 0 ? <p className="text-sm text-slate-400 bg-white rounded-xl border border-slate-200 p-5">Ingen ubetalte fakturaer</p> : unpaid.map((inv) => {
          const overdue = inv.status === 'Forfalden' || (inv.due_date && new Date(inv.due_date) < new Date());
          return (
            <div key={inv.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
              <div><div className="font-semibold text-slate-900">{inv.invoice_number}</div><div className="text-sm text-slate-500 mt-0.5">{inv.project_name || '—'} • Forfald: {inv.due_date ? formatDate(inv.due_date) : '—'}</div></div>
              <div className="text-right"><div className="font-semibold text-slate-900">{formatDKK(lineTotal(inv.line_items))}</div>{overdue && <span className="text-xs text-red-600 flex items-center gap-1 justify-end mt-1"><AlertCircle className="w-3 h-3" /> Forfalden</span>}</div>
            </div>
          );
        })}
      </div>

      <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-amber-500" /> Seneste beskeder</h2>
      <div className="space-y-3">
        {openTickets.length === 0 ? <p className="text-sm text-slate-400 bg-white rounded-xl border border-slate-200 p-5">Ingen åbne beskeder</p> : openTickets.slice(0, 5).map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-1"><div className="font-medium text-slate-900">{t.subject}</div><span className={`text-xs px-2 py-1 rounded-full ${statusBadge[t.status] || ''}`}>{t.status}</span></div>
            <p className="text-sm text-slate-500 line-clamp-2">{t.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}