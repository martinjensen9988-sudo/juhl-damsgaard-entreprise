import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, GraduationCap, AlertCircle, CheckCircle2, Upload, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

const TYPES = ['Maskinførerbevis', 'Førstehjælp', 'Arbejdsmiljø', 'Svejsebevis', 'Kranbevis', 'Truckbevis', 'Håndværk', 'Andet'];

const EMPTY = { employee_name: '', title: '', type: 'Andet', issue_date: '', expiry_date: '', file_url: '', notes: '' };

function daysUntil(date) { if (!date) return null; const d = new Date(date); const now = new Date(); now.setHours(0, 0, 0, 0); return Math.ceil((d - now) / 86400000); }

export default function Kursusstyring() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try { setItems((await base44.entities.Certificate.list('-created_date', 200)) || []); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const openNew = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (i) => { setForm({ ...EMPTY, ...i }); setEditing(i); setDialogOpen(true); };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm((f) => ({ ...f, file_url })); toast({ title: 'Fil uploadet' }); } catch (err) { toast({ title: 'Upload fejlede', description: err.message, variant: 'destructive' }); } finally { setUploading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) { await base44.entities.Certificate.update(editing.id, form); } else { await base44.entities.Certificate.create(form); }
      setDialogOpen(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const remove = async (id) => { if (!confirm('Slet dette certifikat?')) return; await base44.entities.Certificate.delete(id); load(); };

  const sorted = [...items].sort((a, b) => { const da = daysUntil(a.expiry_date) ?? Infinity; const db = daysUntil(b.expiry_date) ?? Infinity; return da - db; });
  const expiringSoon = sorted.filter((i) => { const d = daysUntil(i.expiry_date); return d !== null && d <= 60; });
  const expired = sorted.filter((i) => { const d = daysUntil(i.expiry_date); return d !== null && d < 0; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-violet-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Kursusstyring</h1><p className="text-slate-500 mt-0.5">Hold styr på udløbsdatoer for kurser og sikkerhedscertifikater</p></div>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Tilføj kursus</Button>
      </div>

      {(expired.length > 0 || expiringSoon.length > 0) && (
        <div className="grid md:grid-cols-2 gap-3">
          {expired.length > 0 && <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"><AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" /><div><div className="font-semibold text-red-900">{expired.length} udløbet</div><div className="text-sm text-red-700">{expired.map((i) => i.employee_name).join(', ')}</div></div></div>}
          {expiringSoon.length > 0 && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3"><AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" /><div><div className="font-semibold text-amber-900">{expiringSoon.length} udløber snart</div><div className="text-sm text-amber-700">Inden for 60 dage</div></div></div>}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-violet-500 rounded-full animate-spin" /></div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen kurser registreret.</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((i) => {
            const d = daysUntil(i.expiry_date);
            const status = d === null ? null : d < 0 ? 'expired' : d <= 60 ? 'soon' : 'ok';
            return (
              <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{i.title}</div><div className="text-xs text-slate-500">{i.employee_name}</div></div>
                  {status === 'expired' ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium flex-shrink-0">Udløbet</span> : status === 'soon' ? <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex-shrink-0">{d} dage</span> : status === 'ok' ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium flex-shrink-0"><CheckCircle2 className="w-3 h-3 inline" /> OK</span> : null}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2"><span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{i.type}</span></div>
                <div className="text-xs text-slate-500 space-y-0.5 mb-2">{i.issue_date && <div>Udstedt: {formatDate(i.issue_date)}</div>}{i.expiry_date && <div>Udløb: {formatDate(i.expiry_date)}</div>}</div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  {i.file_url ? <a href={i.file_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> Fil</a> : <span />}
                  <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4 text-slate-500" /></Button><Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger kursus' : 'Nyt kursus/certifikat'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Medarbejder *</Label><Input value={form.employee_name} onChange={set('employee_name')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Kursus/certifikat *</Label><Input value={form.title} onChange={set('title')} /></div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5" />
            <div className="space-y-1.5"><Label>Udstedt</Label><Input type="date" value={form.issue_date || ''} onChange={set('issue_date')} /></div>
            <div className="space-y-1.5"><Label>Udløb</Label><Input type="date" value={form.expiry_date || ''} onChange={set('expiry_date')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Fil</Label>
              {form.file_url ? <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg p-2"><CheckCircle2 className="w-4 h-4" /> Fil valgt <button onClick={() => setForm({ ...form, file_url: '' })} className="text-red-500 ml-auto">Fjern</button></div> : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg p-4 cursor-pointer hover:border-slate-400 transition">
                  {uploading ? <div className="w-6 h-6 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" /> : <Upload className="w-5 h-5 text-slate-400" />}
                  <span className="text-sm text-slate-500">{uploading ? 'Uploader...' : 'Upload bevis'}</span>
                  <input type="file" className="hidden" onChange={upload} />
                </label>
              )}
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Noter</Label><Textarea value={form.notes} onChange={set('notes')} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving || !form.title || !form.employee_name}>{saving ? 'Gemmer...' : 'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}