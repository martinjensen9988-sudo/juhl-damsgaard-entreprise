import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import { Files, FileText, Receipt, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';

const lineTotal = (items = []) => items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);

export default function ProjektArkiv() {
  const [projects, setProjects] = useState([]);
  const [docs, setDocs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    try {
      const [p, d, i, q] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.ProjectDocument.list(),
        base44.entities.Invoice.list(),
        base44.entities.QualityCheck.list(),
      ]);
      setProjects(p.filter((proj) => proj.status === 'Afsluttet'));
      setDocs(d); setInvoices(i); setChecks(q);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Projektarkiv</h1>
      <p className="text-sm text-slate-500 mb-6">Afsluttede projekter med dokumentation, fakturaer og kvalitetssikring</p>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><Files className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Ingen afsluttede projekter</p></div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const pDocs = docs.filter((d) => d.project_id === p.id);
            const pInvs = invoices.filter((i) => i.project_id === p.id);
            const pChecks = checks.filter((c) => c.project_id === p.id);
            const isOpen = expanded === p.id;
            return (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : p.id)} className="w-full p-5 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    <div className="text-left"><div className="font-semibold text-slate-900">{p.name}</div><div className="text-sm text-slate-500">{p.customer_name || '—'} • {p.type}</div></div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {pDocs.length}</span>
                    <span className="flex items-center gap-1"><Receipt className="w-4 h-4" /> {pInvs.length}</span>
                    <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> {pChecks.length}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Dokumenter</div>
                      {pDocs.length === 0 ? <p className="text-sm text-slate-400">Ingen dokumenter</p> : <div className="space-y-1">{pDocs.map((d) => (
                        <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-700 hover:text-amber-600"><FileText className="w-4 h-4 text-slate-400" /> {d.title} <span className="text-slate-400">({d.type})</span></a>
                      ))}</div>}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Fakturaer</div>
                      {pInvs.length === 0 ? <p className="text-sm text-slate-400">Ingen fakturaer</p> : <div className="space-y-1">{pInvs.map((i) => (
                        <div key={i.id} className="flex items-center justify-between text-sm"><span className="text-slate-700">{i.invoice_number} <span className="text-slate-400">— {i.status}</span></span><span className="font-medium text-slate-700">{formatDKK(lineTotal(i.line_items))}</span></div>
                      ))}</div>}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Kvalitetssikring</div>
                      {pChecks.length === 0 ? <p className="text-sm text-slate-400">Ingen kvalitetssikring</p> : <div className="space-y-1">{pChecks.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 text-sm"><ShieldCheck className="w-4 h-4 text-slate-400" /><span className="text-slate-700">{c.title}</span><span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'Godkendt' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{c.status}</span></div>
                      ))}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}