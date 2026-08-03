import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Archive, FolderOpen, FileText, Receipt, Image as ImageIcon, Calendar, MapPin, User } from 'lucide-react';
import { formatDate, formatDKK } from '@/lib/format';
import { Image as ImageComponent } from '@/components/ui/image';

export default function Sagsarkiv() {
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, d, inv, img] = await Promise.all([
        base44.entities.Project.list('-created_date', 200),
        base44.entities.ProjectDocument.list('-created_date', 200),
        base44.entities.Invoice.list('-created_date', 200),
        base44.entities.ProjectImage.list('-created_date', 200),
      ]);
      setProjects((p || []).filter((x) => x.status === 'Afsluttet' || x.status === 'Færdig'));
      setDocuments(d || []);
      setInvoices(inv || []);
      setImages(img || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCase = (proj) => {
    setSelected({
      project: proj,
      docs: documents.filter((d) => d.project_id === proj.id),
      invoices: invoices.filter((i) => i.project_id === proj.id),
      images: images.filter((im) => im.project_id === proj.id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-200 flex items-center justify-center"><Archive className="w-6 h-6 text-slate-700" /></div>
        <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Sagsarkiv</h1><p className="text-slate-500 mt-0.5">Historisk arkiv over afsluttede projekter — tilgå dokumenter, fakturaer og billeder</p></div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" /></div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><Archive className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen afsluttede sager endnu.</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const docs = documents.filter((d) => d.project_id === p.id);
            const invs = invoices.filter((i) => i.project_id === p.id);
            const imgs = images.filter((im) => im.project_id === p.id);
            return (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition" onClick={() => openCase(p)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{p.name}</div><div className="text-xs text-slate-500">{p.customer_name || '—'}</div></div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex-shrink-0">{p.status}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-2">
                  {p.end_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(p.end_date)}</span>}
                  {p.address && <span className="flex items-center gap-1 truncate"><MapPin className="w-3.5 h-3.5" />{p.address}</span>}
                </div>
                <div className="flex gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{docs.length} dok.</span>
                  <span className="flex items-center gap-1"><Receipt className="w-3.5 h-3.5" />{invs.length} fak.</span>
                  <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" />{imgs.length} img.</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><FolderOpen className="w-5 h-5 text-slate-600" /> {selected.project.name}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-600"><User className="w-4 h-4" />{selected.project.customer_name || '—'}</div>
                  {selected.project.address && <div className="flex items-center gap-1.5 text-slate-600"><MapPin className="w-4 h-4" />{selected.project.address}</div>}
                  <div className="flex items-center gap-1.5 text-slate-600"><Calendar className="w-4 h-4" />{formatDate(selected.project.start_date)} → {formatDate(selected.project.end_date)}</div>
                  {selected.project.budget != null && <div className="text-slate-600">Budget: {formatDKK(selected.project.budget)}</div>}
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-700 mb-2">Dokumenter ({selected.docs.length})</div>
                  {selected.docs.length === 0 ? <p className="text-xs text-slate-400">Ingen dokumenter</p> : <div className="space-y-1">{selected.docs.map((d) => <a key={d.id} href={d.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:underline py-1"><FileText className="w-4 h-4" />{d.title} <span className="text-xs text-slate-400">({d.type})</span></a>)}</div>}
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-700 mb-2">Fakturaer ({selected.invoices.length})</div>
                  {selected.invoices.length === 0 ? <p className="text-xs text-slate-400">Ingen fakturaer</p> : <div className="space-y-1">{selected.invoices.map((i) => <div key={i.id} className="flex items-center justify-between text-sm py-1 border-b border-slate-100"><span className="flex items-center gap-2"><Receipt className="w-4 h-4 text-slate-400" />{i.invoice_number}</span><span className="text-slate-500">{i.status}</span></div>)}</div>}
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-700 mb-2">Billeder ({selected.images.length})</div>
                  {selected.images.length === 0 ? <p className="text-xs text-slate-400">Ingen billeder</p> : <div className="grid grid-cols-3 gap-2">{selected.images.map((im) => <div key={im.id} className="rounded-lg overflow-hidden h-24">{im.image_url && <ImageComponent src={im.image_url} alt={im.title || ''} className="w-full h-full" />}</div>)}</div>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}