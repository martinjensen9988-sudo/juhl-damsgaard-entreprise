import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, AlertTriangle, Upload, Camera } from 'lucide-react';
import { formatDate, formatDKK } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';
import { Image as ImageComponent } from '@/components/ui/image';

const TYPES = ['Merarbejde', 'Materialefejl', 'Forsinkelse', 'Klage', 'Fejl udførelse', 'Andet'];
const SEVERITIES = ['Lav', 'Mellem', 'Høj', 'Kritisk'];
const STATUSES = ['Åben', 'Under behandling', 'Lukket'];
const SEV_BADGE = { Lav: 'bg-slate-100 text-slate-600', Mellem: 'bg-amber-100 text-amber-700', Høj: 'bg-orange-100 text-orange-700', Kritisk: 'bg-red-100 text-red-700' };
const STATUS_BADGE = { 'Åben': 'bg-blue-100 text-blue-700', 'Under behandling': 'bg-amber-100 text-amber-700', 'Lukket': 'bg-emerald-100 text-emerald-700' };

const EMPTY = { title: '', project_id: '', project_name: '', customer_name: '', type: 'Merarbejde', severity: 'Mellem', status: 'Åben', extra_cost: 0, extra_hours: 0, date: new Date().toISOString().split('T')[0], reported_by: '', description: '', resolution: '', photo_url: '' };

export default function Afvigelsesrapporter() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [d, p] = await Promise.all([base44.entities.Deviation.list('-date', 200), base44.entities.Project.list('-created_date', 100)]);
      setItems(d || []); setProjects(p || []);
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
      setForm((f) => ({ ...f, photo_url: file_url }));
      toast({ title: 'Billede uploadet' });
    } catch (err) { toast({ title: 'Upload fejlede', description: err.message, variant: 'destructive' }); } finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.project_id) { toast({ title: 'Vælg et projekt', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const proj = projects.find((p) => p.id === form.project_id);
      const payload = { ...form, extra_cost: Number(form.extra_cost) || 0, extra_hours: Number(form.extra_hours) || 0, project_name: proj?.name || '', customer_name: proj?.customer_name || '' };
      if (editing) { await base44.entities.Deviation.update(editing.id, payload); } else { await base44.entities.Deviation.create(payload); }
      setDialogOpen(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const remove = async (id) => { if (!confirm('Slet denne afvigelse?')) return; await base44.entities.Deviation.delete(id); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-orange-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Afvigelsesrapporter</h1><p className="text-slate-500 mt-0.5">Registrer fejl, forsinkelser og uforudsete problemer med billeddokumentation</p></div>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Ny afvigelse</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen afvigelser registreret.</p></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((i) => (
            <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{i.title}</div><div className="text-xs text-slate-500">{i.project_name}</div></div>
                <div className="flex gap-1 flex-shrink-0"><span className={`text-xs px-2 py-0.5 rounded font-medium ${SEV_BADGE[i.severity]}`}>{i.severity}</span><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[i.status]}`}>{i.status}</span></div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2"><span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{i.type}</span></div>
              {i.photo_url && <div className="mb-2 rounded-lg overflow-hidden h-32"><ImageComponent src={i.photo_url} alt="dokumentation" className="w-full h-full" /></div>}
              {i.description && <p className="text-sm text-slate-600 line-clamp-2 mb-2">{i.description}</p>}
              {(i.extra_cost > 0 || i.extra_hours > 0) && <div className="flex gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">{i.extra_cost > 0 && <span>Meromkostning: {formatDKK(i.extra_cost)}</span>}{i.extra_hours > 0 && <span>Mertimer: {i.extra_hours} t</span>}</div>}
              <div className="flex items-center justify-between pt-2"><span className="text-xs text-slate-400">{formatDate(i.date)} • {i.reported_by || ''}</span><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4 text-slate-500" /></Button><Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div></div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger afvigelse' : 'Ny afvigelse'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Titel *</Label><Input value={form.title} onChange={set('title')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Projekt *</Label><Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Alvorlighed</Label><Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Dato</Label><Input type="date" value={form.date} onChange={set('date')} /></div>
            <div className="space-y-1.5"><Label>Rapporteret af</Label><Input value={form.reported_by} onChange={set('reported_by')} /></div>
            <div className="space-y-1.5"><Label>Meromkostning (DKK)</Label><Input type="number" value={form.extra_cost} onChange={set('extra_cost')} /></div>
            <div className="space-y-1.5"><Label>Mertimer</Label><Input type="number" value={form.extra_hours} onChange={set('extra_hours')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={set('description')} rows={3} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Løsning</Label><Textarea value={form.resolution} onChange={set('resolution')} rows={2} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Billeddokumentation</Label>
              {form.photo_url ? <div className="relative rounded-lg overflow-hidden h-40"><ImageComponent src={form.photo_url} alt="dok" className="w-full h-full" /><button onClick={() => setForm({ ...form, photo_url: '' })} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><Trash2 className="w-4 h-4" /></button></div> : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg p-6 cursor-pointer hover:border-slate-400 transition">
                  {uploading ? <div className="w-6 h-6 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" /> : <Camera className="w-6 h-6 text-slate-400" />}
                  <span className="text-sm text-slate-500">{uploading ? 'Uploader...' : 'Upload billede'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={upload} />
                </label>
              )}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving || !form.title || !form.project_id}>{saving ? 'Gemmer...' : 'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}