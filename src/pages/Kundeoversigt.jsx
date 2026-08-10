import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';


import { Users, Mail, Phone, MapPin, HardHat, FileText, Receipt, Loader2, Search, ArrowLeft } from 'lucide-react';
import { formatDate, formatDKK } from '@/lib/format';

const PROJECT_STATUS_BADGE = {
  Planlægning: 'bg-blue-100 text-blue-700',
  'I gang': 'bg-amber-100 text-amber-700',
  Afsluttet: 'bg-emerald-100 text-emerald-700',
  'På hold': 'bg-slate-100 text-slate-600',
};

const QUOTE_STATUS_BADGE = {
  Kladde: 'bg-slate-100 text-slate-600',
  Sendt: 'bg-blue-100 text-blue-700',
  Accepteret: 'bg-emerald-100 text-emerald-700',
  Afvist: 'bg-red-100 text-red-700',
  Udløbet: 'bg-amber-100 text-amber-700',
};

const INVOICE_STATUS_BADGE = {
  Kladde: 'bg-slate-100 text-slate-600',
  Sendt: 'bg-blue-100 text-blue-700',
  Betalt: 'bg-emerald-100 text-emerald-700',
  Forfalden: 'bg-red-100 text-red-700',
  Annulleret: 'bg-slate-100 text-slate-400',
};

function calcTotal(lineItems = []) {
  return lineItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
}

export default function Kundeoversigt() {
  const [customers, setCustomers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Customer.list('-created_date', 200);
        setCustomers(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = customers.find((c) => c.id === selectedId);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingDetail(true);
    (async () => {
      try {
        const [p, q, i] = await Promise.all([
          base44.entities.Project.filter({ customer_id: selectedId }, '-created_date', 100),
          base44.entities.Quote.filter({ customer_id: selectedId }, '-created_date', 100),
          base44.entities.Invoice.filter({ customer_id: selectedId }, '-created_date', 100),
        ]);
        setProjects(p);
        setQuotes(q);
        setInvoices(i);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [selectedId]);

  const filteredCustomers = customers.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(s) || (c.company || '').toLowerCase().includes(s) || (c.email || '').toLowerCase().includes(s);
  });

  const totalRevenue = invoices.filter((i) => i.status === 'Betalt').reduce((sum, i) => sum + calcTotal(i.line_items), 0);
  const outstanding = invoices.filter((i) => i.status === 'Sendt' || i.status === 'Forfalden').reduce((sum, i) => sum + calcTotal(i.line_items), 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Kundeoversigt</h1>
        <p className="text-slate-500 mt-1">Samlet kundehistorik – projekter, fakturaer og tilbud</p>
      </div>

      {!selected ? (
        <>
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søg efter kunde..."
              className="pl-9"
            />
          </div>
          {filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Ingen kunder fundet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="text-left bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-amber-300 transition-all"
                >
                  <div className="font-semibold text-slate-900 mb-1">{c.company || c.name}</div>
                  {c.company && <div className="text-sm text-slate-500 mb-2">{c.name}</div>}
                  <div className="space-y-1 text-sm text-slate-600">
                    {c.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}</div>}
                    {c.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone}</div>}
                    {c.city && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.city}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => setSelectedId(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{selected.company || selected.name}</h2>
              {selected.company && <p className="text-sm text-slate-500">{selected.name}</p>}
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 flex-wrap">
                {selected.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {selected.email}</span>}
                {selected.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selected.phone}</span>}
                {selected.address && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {[selected.address, selected.postal_code, selected.city].filter(Boolean).join(', ')}</span>}
              </div>
            </div>
          </div>

          {loadingDetail ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-2xl font-bold text-slate-900">{projects.length}</div>
                  <div className="text-sm text-slate-500">Projekter</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-2xl font-bold text-slate-900">{quotes.length}</div>
                  <div className="text-sm text-slate-500">Tilbud</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-2xl font-bold text-emerald-600">{formatDKK(totalRevenue)}</div>
                  <div className="text-sm text-slate-500">Betalt i alt</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-2xl font-bold text-amber-600">{formatDKK(outstanding)}</div>
                  <div className="text-sm text-slate-500">Udestående</div>
                </div>
              </div>

              {/* Projects */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-slate-900">Projekter ({projects.length})</h3>
                </div>
                {projects.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-slate-400 text-center">Ingen projekter</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {projects.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.type} • {formatDate(p.start_date)}</div>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${PROJECT_STATUS_BADGE[p.status] || 'bg-slate-100 text-slate-500'}`}>
                          {p.status}
                        </span>
                        {p.budget > 0 && <div className="text-sm font-medium text-slate-700 hidden sm:block">{formatDKK(p.budget)}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quotes */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-slate-900">Tilbud ({quotes.length})</h3>
                </div>
                {quotes.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-slate-400 text-center">Ingen tilbud</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {quotes.map((q) => (
                      <div key={q.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{q.quote_number}</div>
                          <div className="text-xs text-slate-500">{q.project_name || '—'} • {formatDate(q.date)}</div>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${QUOTE_STATUS_BADGE[q.status] || 'bg-slate-100 text-slate-500'}`}>
                          {q.status}
                        </span>
                        <div className="text-sm font-medium text-slate-700">{formatDKK(calcTotal(q.line_items))}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoices */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-semibold text-slate-900">Fakturaer ({invoices.length})</h3>
                </div>
                {invoices.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-slate-400 text-center">Ingen fakturaer</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{inv.invoice_number}</div>
                          <div className="text-xs text-slate-500">{inv.project_name || '—'} • Forfald: {formatDate(inv.due_date)}</div>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${INVOICE_STATUS_BADGE[inv.status] || 'bg-slate-100 text-slate-500'}`}>
                          {inv.status}
                        </span>
                        <div className="text-sm font-medium text-slate-700">{formatDKK(calcTotal(inv.line_items))}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}