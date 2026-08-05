import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import { format, parseISO } from 'date-fns';
import { Loader2, FolderCheck, FileText, Paperclip, Download, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const TABS = [
  { id: 'projekter', label: 'Afsluttede projekter', icon: FolderCheck },
  { id: 'fakturaer', label: 'Fakturaer', icon: FileText },
  { id: 'bilag', label: 'Bilag & dokumenter', icon: Paperclip },
];

const FINISHED = ['Afsluttet', 'Færdig'];

export default function ArkivOversigt() {
  const [tab, setTab] = useState('projekter');
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, i, d] = await Promise.all([
          base44.entities.Project.list('-updated_date', 500),
          base44.entities.Invoice.list('-updated_date', 500),
          base44.entities.ProjectDocument.list('-updated_date', 500),
        ]);
        setProjects(p);
        setInvoices(i);
        setDocs(d);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const finishedProjects = projects.filter((p) => FINISHED.includes(p.status));
  const filteredProjects = finishedProjects.filter((p) =>
    !query || (p.name + p.customer_name + (p.address || '')).toLowerCase().includes(query.toLowerCase()));

  const filteredInvoices = invoices.filter((i) =>
    !query || (i.invoice_number + i.customer_name + (i.project_name || '')).toLowerCase().includes(query.toLowerCase()));

  const filteredDocs = docs.filter((d) =>
    !query || (d.title + (d.project_name || '')).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Arkiv & Rapporter</h1>
        <p className="text-slate-500 mt-1">Adgang til afsluttede projekter, fakturaer og bilag til reference og revision</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="inline-flex bg-white rounded-xl border border-slate-200 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Søg..." className="pl-9 sm:w-64" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
      ) : tab === 'projekter' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Projekt</th>
                <th className="text-left px-4 py-3 font-medium">Kunde</th>
                <th className="text-left px-4 py-3 font-medium">Periode</th>
                <th className="text-right px-4 py-3 font-medium">Budget</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Ingen afsluttede projekter.</td></tr>
              ) : filteredProjects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">{p.customer_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {p.start_date ? format(parseISO(p.start_date), 'dd.MM.yyyy') : '—'} → {p.end_date ? format(parseISO(p.end_date), 'dd.MM.yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{p.budget ? formatDKK(p.budget) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-600 font-medium">{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'fakturaer' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Fakturanr.</th>
                <th className="text-left px-4 py-3 font-medium">Kunde</th>
                <th className="text-left px-4 py-3 font-medium">Projekt</th>
                <th className="text-left px-4 py-3 font-medium">Dato</th>
                <th className="text-right px-4 py-3 font-medium">Beløb</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Ingen fakturaer.</td></tr>
              ) : filteredInvoices.map((i) => {
                const total = (i.line_items || []).reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0) * 1.25;
                return (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{i.invoice_number}</td>
                    <td className="px-4 py-3 text-slate-600">{i.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{i.project_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{i.date ? format(parseISO(i.date), 'dd.MM.yyyy') : '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{total > 0 ? formatDKK(total) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        i.status === 'Betalt' ? 'bg-emerald-100 text-emerald-700' :
                        i.status === 'Forfalden' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{i.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocs.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Ingen bilag eller dokumenter.
            </div>
          ) : filteredDocs.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Paperclip className="w-5 h-5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">{d.title}</div>
                  <div className="text-xs text-slate-500">{d.type} · {d.project_name || '—'}</div>
                </div>
              </div>
              {d.description && <div className="text-xs text-slate-500 line-clamp-2">{d.description}</div>}
              {d.file_url && (
                <a href={d.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium">
                  <Download className="w-4 h-4" /> Åbn bilag
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}