import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, FileText, Upload, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

const TYPES = ['Kontrakt', 'Tegning', 'Sikkerhedsvejledning', 'Tilbud', 'Faktura', 'Rapport', 'Andet'];

const EMPTY = { title: '', type: 'Andet', project_id: '', project_name: '', description: '', file_url: '', upload_date: new Date().toISOString().split('T')[0] };

export default function Dokumentcenter() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [d, p] = await Promise.all([base44.entities.ProjectDocument.list('-upload_date', 200), base44.entities.Project.list('-created_date', 100)]);
      setItems(d || []);
      setProjects(p || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const openNew = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (i) => { setForm({ ...EMPTY, ...i }); setEditing(i); setDialogOpen(true); };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, file_url }));
      toast({ title: 'Fil uploadet' });
    } catch (err) { toast({ title: 'Upload fejlede', description: err.message, variant: 'destructive' }); } finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.file_url) { toast({ title: 'Upload en fil først', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const proj = projects.find((p) => p.id === form.project_id);
      const payload = { ...form, project_name: proj ? proj.name : '', customer_email: proj ? proj.customer_email : '' };
      if (editing) { await base44.entities.ProjectDocument.update(editing.id, payload); } else { await base44.entities.ProjectDocument.create(payload); }
      setDialogOpen(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const remove = async (id) => { if (!confirm('Slet dette dokument?')) return; await base44.entities.ProjectDocument.delete(id); load(); };

  const filtered = items.filter((i) => !typeFilter || i.type === typeFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center"><FileText className="w-6 h-6 text-blue-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Dokumentcenter</h1><p className="text-slate-500 mt-0.5">Upload, organiser og del projektrelaterede dokumenter, tegninger og kontrakter</p></div>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Upload dokument</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTypeFilter('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${!typeFilter ? 'bg-slate-950 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Alle</button>
        {TYPES.map((t) => <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${typeFilter === t ? 'bg-slate-950 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{t}</button>)}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen dokumenter endnu.</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((i) => (
            <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{i.title}</div><div className="text-xs text-slate-500">{i.project_name || 'Generelt'}</div></div>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 flex-shrink-0">{i.type}</span>
              </div>
              {i.description && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{i.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">{formatDate(i.upload_date)}</span>
                <div className="flex gap-1">
                  {i.file_url && <Button variant="ghost" size="icon" asChild><a href={i.file_url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 text-slate-500" /></a></Button>}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger dokument' : 'Upload dokument'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Titel *</Label><Input value={form.title} onChange={set('title')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Projekt</Label><Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}><SelectTrigger><SelectValue placeholder="Generelt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1.5"><Label>Fil *</Label>
              {form.file_url ? <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg p-2"><FileText className="w-4 h-4" /> Fil valgt <button onClick={() => setForm({ ...form, file_url: '' })} className="text-red-500 ml-auto">Fjern</button></div> : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg p-6 cursor-pointer hover:border-slate-400 transition">
                  {uploading ? <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" /> : <Upload className="w-6 h-6 text-slate-400" />}
                  <span className="text-sm text-slate-500">{uploading ? 'Uploader...' : 'Klik for at vælge fil'}</span>
                  <input type="file" className="hidden" onChange={upload} />
                </label>
              )}
            </div>
            <div className="space-y-1.5"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={set('description')} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving || !form.title || !form.file_url}>{saving ? 'Gemmer...' : 'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}