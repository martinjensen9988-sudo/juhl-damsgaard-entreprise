import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, Building2, FolderOpen, Receipt } from 'lucide-react';

const formatDKK = (n) => (Number(n) || 0).toLocaleString('da-DK', {
  style: 'currency', currency: 'DKK', maximumFractionDigits: 0,
});
const lineTotal = (items = []) =>
  (items || []).reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);

export default function Kundearkiv() {
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [c, p, i] = await Promise.all([
          base44.entities.Customer.list('-created_date', 500),
          base44.entities.Project.list('-created_date', 500),
          base44.entities.Invoice.list('-date', 500),
        ]);
        setCustomers(c);
        setProjects(p);
        setInvoices(i);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const enriched = useMemo(() => {
    return customers.map((c) => {
      const cProjects = projects.filter((p) => p.customer_id === c.id);
      const cInvoices = invoices.filter((i) => i.customer_id === c.id);
      const totalBilled = cInvoices.reduce((s, i) => s + lineTotal(i.line_items), 0);
      const totalPaid = cInvoices.filter((i) => i.status === 'Betalt').reduce((s, i) => s + lineTotal(i.line_items), 0);
      return { ...c, projectCount: cProjects.length, invoiceCount: cInvoices.length, totalBilled, totalPaid, cProjects, cInvoices };
    });
  }, [customers, projects, invoices]);

  const filtered = enriched.filter((c) =>
    `${c.name} ${c.company || ''} ${c.email || ''} ${c.city || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kundearkiv</h1>
        <p className="text-slate-500 text-sm mt-1">Arkiv over tidligere kunder, projekter og faktureringshistorik.</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Søg kunde, virksomhed, by eller email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 max-w-md" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-slate-400">Ingen kunder fundet</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50"
              >
                <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  <div className="text-sm text-slate-500 truncate">
                    {c.company ? `${c.company} · ` : ''}{c.city ? c.city : 'Ingen by'}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-slate-400 text-xs">Projekter</div>
                    <div className="font-semibold text-slate-900">{c.projectCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-xs">Fakturaer</div>
                    <div className="font-semibold text-slate-900">{c.invoiceCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-xs">Faktureret</div>
                    <div className="font-semibold text-slate-900">{formatDKK(c.totalBilled)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 text-xs">Indbetalt</div>
                    <div className="font-semibold text-green-700">{formatDKK(c.totalPaid)}</div>
                  </div>
                </div>
              </button>

              {expanded === c.id && (
                <div className="border-t bg-slate-50 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                      <FolderOpen className="w-4 h-4" /> Projekter
                    </div>
                    {c.cProjects.length === 0 ? (
                      <p className="text-sm text-slate-400">Ingen projekter</p>
                    ) : (
                      <div className="space-y-2">
                        {c.cProjects.map((p) => (
                          <div key={p.id} className="flex justify-between text-sm">
                            <span className="text-slate-700">{p.name}</span>
                            <span className="text-slate-500">{p.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                      <Receipt className="w-4 h-4" /> Faktureringshistorik
                    </div>
                    {c.cInvoices.length === 0 ? (
                      <p className="text-sm text-slate-400">Ingen fakturaer</p>
                    ) : (
                      <div className="space-y-2">
                        {c.cInvoices.map((i) => (
                          <div key={i.id} className="flex justify-between text-sm">
                            <span className="text-slate-700">{i.invoice_number}</span>
                            <span className="text-slate-500">{i.date}</span>
                            <span className="font-medium text-slate-900">{formatDKK(lineTotal(i.line_items))}</span>
                            <span className="text-xs text-slate-500">{i.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}