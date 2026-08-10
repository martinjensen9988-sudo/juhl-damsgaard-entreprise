import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Recycle, Loader2, CheckCircle2, FileText } from 'lucide-react';

const TYPES = ['Beton', 'Træ', 'Metal', 'Blandet', 'Farligt affald', 'Jord', 'Gips', 'Andet'];
const METHODS = ['Genanvendelse', 'Forbrænding', 'Deponi', 'Farligt affald centrret', 'Andet'];

const EMPTY = {
  title: '', project_name: '', waste_type: 'Blandet', amount: '', unit: 'ton',
  disposal_method: 'Genanvendelse', disposal_facility: '', date: '', receipt_url: '', notes: '',
};

export default function AffaldsLog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.WasteLog.list('-date', 300);
      setItems(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, receipt_url: file_url }));
      toast({ title: 'Kvittering uploadet' });
    } catch (e) { toast({ title: 'Upload fejlede', description: e.message, variant: 'destructive' }); }
    finally { setUploading(false); }
  };

  const openNew = () => { setForm(EMPTY); setEditing(null); setOpen(true); };
  const openEdit = (it) => { setForm({ ...EMPTY, ...it }); setEditing(it); setOpen(true); };

  const save = async () => {
    if (!form.title || !form.date) { toast({ title: 'Udfyld titel og dato', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) || 0 };
      if (editing) await base44.entities.WasteLog.update(editing.id, payload);
      else await base44.entities.WasteLog.create(payload);
      setOpen(false); load();
    } catch (e) { toast({ title: 'Fejl', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const remove = async (id) => { if (!confirm('Slet post?')) return; await base44.entities.WasteLog.delete(id); load(); };
  const toggleCert = async (it) => { await base44.entities.WasteLog.update(it.id, { certified: !it.certified }); load(); };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const totalAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Affaldshåndtering</h1>
          <p className="text-slate-500 mt-1">Registrering af bortskaffelse med dokumentation og kvitteringer</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Ny post</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{items.length}</div><div className="text-xs text-slate-500">Poster</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{totalAmount.toFixed(1)}</div><div className="text-xs text-slate-500">Mængde i alt</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{items.filter((i) => i.certified).length}</div><div className="text-xs text-slate-500">Certificerede</div></div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><Recycle className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen affaldsposter registreret.</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 truncate">{it.title}</span>
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">{it.waste_type}</span>
                  {it.certified && <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Certificeret</span>}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {it.amount ? `${it.amount} ${it.unit || ''}` : ''} • {it.disposal_method} {it.disposal_facility ? `• ${it.disposal_facility}` : ''}
                  {it.project_name ? ` • ${it.project_name}` : ''} • {it.date || ''}
                </div>
                {it.receipt_url && <a href={it.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"><FileText className="w-3 h-3" /> Kvittering</a>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => toggleCert(it)}>{it.certified ? 'Fjern cert.' : 'Certificer'}</Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(it)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger post' : 'Ny affaldspost'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Titel *</Label><Input value={form.title} onChange={set('title')} /></div>
            <div className="space-y-1.5"><Label>Projekt</Label><Input value={form.project_name} onChange={set('project_name')} /></div>
            <div className="space-y-1.5"><Label>Dato *</Label><Input type="date" value={form.date} onChange={set('date')} /></div>
            <div className="space-y-1.5"><Label>Affaldstype</Label>
              <Select value={form.waste_type} onValueChange={(v) => setForm({ ...form, waste_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Håndtering</Label>
              <Select value={form.disposal_method} onValueChange={(v) => setForm({ ...form, disposal_method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Mængde</Label><Input type="number" value={form.amount} onChange={set('amount')} /></div>
            <div className="space-y-1.5"><Label>Enhed</Label><Input value={form.unit} onChange={set('unit')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Modtageranlæg</Label><Input value={form.disposal_facility} onChange={set('disposal_facility')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Kvittering</Label>
              <div className="flex items-center gap-2"><Input type="file" onChange={(e) => upload(e.target.files?.[0])} disabled={uploading} />{uploading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}</div>
              {form.receipt_url && <p className="text-xs text-emerald-600 truncate">Uploadet</p>}
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Noter</Label><Textarea value={form.notes} onChange={set('notes')} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving}>{saving ? 'Gemmer...' : 'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}