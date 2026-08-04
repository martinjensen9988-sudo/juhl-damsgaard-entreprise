import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Award, AlertTriangle } from 'lucide-react';

const TYPES = ['Maskinførerbevis', 'Førstehjælp', 'Arbejdsmiljø', 'Svejsebevis', 'Kranbevis', 'Truckbevis', 'Håndværk', 'Andet'];
const empty = { title: '', employee_name: '', type: 'Andet', issue_date: '', expiry_date: '', file_url: '', notes: '' };

function daysTo(d) { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000); }

export default function CertifikatKontrol() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => { setItems(await base44.entities.Certificate.list('expiry_date', 500).catch(() => [])); }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it) => { setEditing(it); setForm({ ...empty, ...it }); setOpen(true); };
  const save = async () => {
    if (!form.title || !form.employee_name) { alert('Udfyld certifikat og medarbejder'); return; }
    if (editing) await base44.entities.Certificate.update(editing.id, form);
    else await base44.entities.Certificate.create(form);
    setOpen(false); load();
  };
  const remove = async (id) => { if (confirm('Slet certifikat?')) { await base44.entities.Certificate.delete(id); load(); } };

  const expired = items.filter((i) => { const d = daysTo(i.expiry_date); return d !== null && d < 0; });
  const soon = items.filter((i) => { const d = daysTo(i.expiry_date); return d !== null && d >= 0 && d < 30; });
  const valid = items.filter((i) => { const d = daysTo(i.expiry_date); return d === null || d >= 30; });

  const Row = ({ it }) => {
    const days = daysTo(it.expiry_date);
    const color = days === null ? 'bg-slate-100 text-slate-600' : days < 0 ? 'bg-red-100 text-red-700' : days < 30 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
    const label = days === null ? 'Ingen udløb' : days < 0 ? 'Udløbet' : `${days} dage`;
    return (
      <div className="rounded-lg border bg-card p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Award className="w-4 h-4 text-slate-500" /></div>
          <div>
            <div className="font-medium text-sm">{it.employee_name}</div>
            <div className="text-xs text-muted-foreground">{it.title} • {it.type}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${color}`}>{label}</span>
          <span className="text-xs text-muted-foreground">{it.expiry_date || '—'}</span>
          <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Certifikatkontrollen</h1>
          <p className="text-sm text-muted-foreground">Overholdelse af lovkrav og sikkerhedsstandarder.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Tilføj</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-red-50 p-3"><div className="text-2xl font-bold text-red-700">{expired.length}</div><div className="text-xs text-red-600">Udløbet</div></div>
        <div className="rounded-lg border bg-amber-50 p-3"><div className="text-2xl font-bold text-amber-700">{soon.length}</div><div className="text-xs text-amber-600">Udløber snart</div></div>
        <div className="rounded-lg border bg-emerald-50 p-3"><div className="text-2xl font-bold text-emerald-700">{valid.length}</div><div className="text-xs text-emerald-600">Gyldige</div></div>
      </div>

      {expired.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-1 text-red-700"><AlertTriangle className="w-4 h-4" /> Udløbne certifikater</h3>
          {expired.map((it) => <Row key={it.id} it={it} />)}
        </div>
      )}
      {soon.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-amber-700">Udløber snart</h3>
          {soon.map((it) => <Row key={it.id} it={it} />)}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-emerald-700">Gyldige certifikater</h3>
        {valid.length === 0 && <p className="text-sm text-muted-foreground">Ingen.</p>}
        {valid.map((it) => <Row key={it.id} it={it} />)}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger certifikat' : 'Nyt certifikat'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Certifikat</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Medarbejder</Label><Input value={form.employee_name} onChange={(e) => setForm((f) => ({ ...f, employee_name: e.target.value }))} /></div>
            <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Udstedt</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))} /></div>
            <div><Label>Udløber</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Fil-URL</Label><Input value={form.file_url} onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}