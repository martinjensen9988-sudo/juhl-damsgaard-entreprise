import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { ClipboardX, Plus, Pencil, Trash2, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Image } from '@/components/ui/image';
import { formatDate } from '@/lib/format';

const TYPES = ['Merarbejde', 'Materialefejl', 'Forsinkelse', 'Klage', 'Fejl udførelse', 'Andet'];
const SEVERITY = { Lav: 'bg-slate-100 text-slate-600', Mellem: 'bg-amber-100 text-amber-700', Høj: 'bg-orange-100 text-orange-700', Kritisk: 'bg-rose-100 text-rose-700' };
const STATUS = { Åben: 'bg-blue-100 text-blue-700', 'Under behandling': 'bg-amber-100 text-amber-700', Lukket: 'bg-emerald-100 text-emerald-700' };
const empty = { title: '', project_id: '', project_name: '', customer_name: '', type: 'Merarbejde', severity: 'Mellem', status: 'Åben', extra_cost: 0, extra_hours: 0, date: new Date().toISOString().slice(0, 10), reported_by: '', description: '', resolution: '', photo_url: '' };

export default function Afvigelsesregistrering() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [l, p] = await Promise.all([base44.entities.Deviation.list('-date', 200), base44.entities.Project.list().catch(() => [])]); setItems(l || []); setProjects(p || []); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEdit(null); setForm(empty); setOpen(true); };
  const openEdit = (s) => { setEdit(s); setForm({ ...empty, ...s, extra_cost: s.extra_cost || 0, extra_hours: s.extra_hours || 0 }); setOpen(true); };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm((f) => ({ ...f, photo_url: file_url })); }
    catch { alert('Upload fejlede'); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title || !form.project_id) { alert('Titel og projekt kræves'); return; }
    const proj = projects.find((p) => p.id === form.project_id);
    const payload = { ...form, project_name: proj?.name || '', customer_name: proj?.customer_name || '', extra_cost: Number(form.extra_cost) || 0, extra_hours: Number(form.extra_hours) || 0 };
    if (edit) await base44.entities.Deviation.update(edit.id, payload);
    else await base44.entities.Deviation.create(payload);
    setOpen(false); load();
  };

  const del = async (s) => { if (confirm('Slet afvigelse?')) { await base44.entities.Deviation.delete(s.id); load(); } };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><ClipboardX className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Afvigelsesregistrering</h1>
            <p className="text-slate-500">Log fejl, mangler og uforudsete udfordringer — også fra mobil</p>
          </div>
        </div>
        <Button onClick={openNew} className="bg-slate-950"><Plus className="w-4 h-4" /> Registrer afvigelse</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><ClipboardX className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen afvigelser registreret.</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{s.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${SEVERITY[s.severity]}`}>{s.severity}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${STATUS[s.status]}`}>{s.status}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                  <button onClick={() => del(s)} className="p-1.5 rounded hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-1">{s.type} · {formatDate(s.date)} · {s.project_name || ''} {s.reported_by ? `· ${s.reported_by}` : ''}</div>
              {s.description && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{s.description}</p>}
              {s.photo_url && <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden bg-slate-100"><Image src={s.photo_url} alt="" className="w-full h-full" fittingType="fill" /></div>}
              {(s.extra_cost > 0 || s.extra_hours > 0) && <div className="text-xs text-amber-700 mt-2">Meromkostning: {s.extra_cost} DKK · Mertimer: {s.extra_hours}</div>}
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader><SheetTitle>{edit ? 'Rediger afvigelse' : 'Registrer afvigelse'}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Titel *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Kort beskrivelse" /></div>
            <div><Label className="text-xs">Projekt *</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Vælg projekt..." /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Alvorlighed</Label><Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(SEVERITY).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Dato</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label className="text-xs">Mer DKK</Label><Input type="number" value={form.extra_cost} onChange={(e) => setForm({ ...form, extra_cost: e.target.value })} /></div>
              <div><Label className="text-xs">Mer timer</Label><Input type="number" value={form.extra_hours} onChange={(e) => setForm({ ...form, extra_hours: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Rapporteret af</Label><Input value={form.reported_by} onChange={(e) => setForm({ ...form, reported_by: e.target.value })} /></div>
            <div><Label className="text-xs">Beskrivelse</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
            <div><Label className="text-xs">Løsning</Label><Textarea value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} rows={2} /></div>
            <div>
              <Label className="text-xs">Billeddokumentation</Label>
              {form.photo_url ? (
                <div className="mt-1 w-24 h-24 rounded-lg overflow-hidden bg-slate-100 relative">
                  <Image src={form.photo_url} alt="" className="w-full h-full" fittingType="fill" />
                  <button onClick={() => setForm({ ...form, photo_url: '' })} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><Trash2 className="w-3 h-3" /></button>
                </div>
              ) : (
                <label className="mt-1 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg p-4 cursor-pointer text-slate-500 text-sm">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {uploading ? 'Uploader...' : 'Tilføj billede'}
                  <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                </label>
              )}
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save} className="bg-slate-950">Gem</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}