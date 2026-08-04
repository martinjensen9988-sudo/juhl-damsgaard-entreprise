import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Files, Plus, Upload, Trash2, FileText, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const TYPES = ['Kontrakt', 'Tegning', 'Tilladelse', 'Sikkerhedsvejledning', 'Tilbud', 'Faktura', 'Rapport', 'Andet'];
const TYPE_COLORS = {
  Kontrakt: 'bg-amber-100 text-amber-700', Tegning: 'bg-blue-100 text-blue-700', Tilladelse: 'bg-emerald-100 text-emerald-700',
  Sikkerhedsvejledning: 'bg-rose-100 text-rose-700', Tilbud: 'bg-purple-100 text-purple-700', Faktura: 'bg-cyan-100 text-cyan-700',
  Rapport: 'bg-slate-100 text-slate-700', Andet: 'bg-slate-100 text-slate-500',
};

export default function DokumentStyring() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', project_id: '', project_name: '', type: 'Andet', file_url: '', description: '', upload_date: '' });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const [docs, projs] = await Promise.all([
        base44.entities.ProjectDocument.list('-created_date', 500),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setItems(docs); setProjects(projs);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => items.filter((d) => {
      if (filterProject !== 'all' && d.project_id !== filterProject) return false;
      if (filterType !== 'all' && d.type !== filterType) return false;
      return true;
    }),
    [items, filterProject, filterType]
  );

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((d) => { const k = d.project_name || 'Uden projekt'; (map[k] = map[k] || []).push(d); });
    return map;
  }, [filtered]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm((f) => ({ ...f, file_url })); }
    catch (err) { console.error(err); } finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title || !form.file_url) return;
    const payload = { ...form, upload_date: form.upload_date || format(new Date(), 'yyyy-MM-dd') };
    await base44.entities.ProjectDocument.create(payload);
    setOpen(false); setForm({ title: '', project_id: '', project_name: '', type: 'Andet', file_url: '', description: '', upload_date: '' }); load();
  };

  const del = async (id) => { if (confirm('Slet dokument?')) { await base44.entities.ProjectDocument.delete(id); load(); } };

  const setProject = (id) => {
    const p = projects.find((x) => x.id === id);
    setForm((f) => ({ ...f, project_id: id, project_name: p?.name || '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><Files className="w-7 h-7 text-amber-500" /> Dokumentstyring</h1>
          <p className="text-slate-500 mt-1">Tegninger, kontrakter og tilladelser organiseret pr. projekt</p>
        </div>
        <Button onClick={() => { setForm({ title: '', project_id: '', project_name: '', type: 'Andet', file_url: '', description: '', upload_date: '' }); setOpen(true); }} className="bg-amber-500 hover:bg-amber-600"><Plus className="w-4 h-4" /> Upload dokument</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="sm:w-64 bg-white"><span className="flex items-center gap-1.5"><Filter className="w-3.5 h-3.5 text-slate-400" /> {filterProject === 'all' ? 'Alle projekter' : projects.find((p) => p.id === filterProject)?.name}</span></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle projekter</SelectItem>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="sm:w-48 bg-white"><span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" /> {filterType === 'all' ? 'Alle typer' : filterType}</span></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle typer</SelectItem>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-slate-400">Ingen dokumenter fundet</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([proj, docs]) => (
            <div key={proj} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">{proj}</h2>
                <span className="text-xs text-slate-500">{docs.length} dokumenter</span>
              </div>
              <div className="divide-y divide-slate-100">
                {docs.map((d) => (
                  <div key={d.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><FileText className="w-4 h-4 text-slate-500" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{d.title}</div>
                      {d.description && <div className="text-xs text-slate-500 truncate">{d.description}</div>}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[d.type] || TYPE_COLORS.Andet}`}>{d.type}</span>
                    {d.upload_date && <span className="text-xs text-slate-400 hidden sm:block">{format(new Date(d.upload_date), 'dd. MMM yyyy', { locale: da })}</span>}
                    {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer"><Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button></a>}
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => del(d.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Upload dokument</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Titel *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Projekt</Label>
              <Select value={form.project_id} onValueChange={setProject}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Dokumenttype</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div>
              <Label>Fil *</Label>
              {form.file_url ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg"><FileText className="w-4 h-4" /> Fil uploadet <button onClick={() => setForm({ ...form, file_url: '' })} className="text-red-600 ml-auto">Fjern</button></div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg py-6 cursor-pointer hover:border-amber-400">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">{uploading ? 'Uploader…' : 'Klik for at vælge fil'}</span>
                  <input type="file" className="hidden" onChange={onFile} />
                </label>
              )}
            </div>
            <div><Label>Beskrivelse</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save} disabled={!form.title || !form.file_url} className="bg-amber-500 hover:bg-amber-600">Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}