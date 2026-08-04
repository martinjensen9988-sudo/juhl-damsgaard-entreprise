import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Recycle } from 'lucide-react';

const TYPES = ['Beton', 'Træ', 'Metal', 'Blandet', 'Farligt affald', 'Jord', 'Gips', 'Andet'];
const METHOD = { Genanvendelse: 'bg-emerald-100 text-emerald-700', Forbrænding: 'bg-amber-100 text-amber-700', Deponi: 'bg-slate-100 text-slate-600', 'Farligt affald centrret': 'bg-red-100 text-red-700', Andet: 'bg-slate-100 text-slate-600' };
const empty = { title: '', project_name: '', waste_type: 'Blandet', amount: 0, unit: 'ton', disposal_method: 'Genanvendelse', disposal_facility: '', date: new Date().toISOString().slice(0, 10), certified: false, certificate_number: '', receipt_url: '', reported_by: '', notes: '' };

export default function AffaldsStyring() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    const [w, p] = await Promise.all([
      base44.entities.WasteLog.list('-date', 200).catch(() => []),
      base44.entities.Project.list('-created_date', 100).catch(() => []),
    ]);
    setItems(w || []); setProjects(p || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it) => { setEditing(it); setForm({ ...empty, ...it }); setOpen(true); };

  const save = async () => {
    if (!form.title || !form.waste_type || !form.date) { alert('Udfyld titel, type og dato'); return; }
    const payload = { ...form, amount: Number(form.amount) || 0 };
    if (editing) await base44.entities.WasteLog.update(editing.id, payload);
    else await base44.entities.WasteLog.create(payload);
    setOpen(false); load();
  };
  const remove = async (id) => { if (confirm('Slet post?')) { await base44.entities.WasteLog.delete(id); load(); } };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Affaldshåndtering</h1>
          <p className="text-sm text-muted-foreground">Dokumentation af affaldssortering og bortskaffelse fra byggepladser.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Registrer affald</Button>
      </div>

      <div className="grid gap-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Ingen affaldsposter.</p>}
        {items.map((it) => (
          <div key={it.id} className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Recycle className="w-5 h-5 text-slate-500" /></div>
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-xs text-muted-foreground">{it.project_name || '—'} • {it.date} • {it.waste_type}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${METHOD[it.disposal_method] || METHOD.Andet}`}>{it.disposal_method}</span>
                {it.certified && <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">Certificeret</span>}
                <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Mængde: {it.amount} {it.unit}</span>
              {it.disposal_facility && <span>Modtager: {it.disposal_facility}</span>}
              {it.certificate_number && <span>Certifikat: {it.certificate_number}</span>}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger post' : 'Registrer affald'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Titel</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Projekt</Label><Select value={form.project_name} onValueChange={(v) => setForm((f) => ({ ...f, project_name: v }))}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
            <div><Label>Affaldstype</Label><Select value={form.waste_type} onValueChange={(v) => setForm((f) => ({ ...f, waste_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Håndtering</Label><Select value={form.disposal_method} onValueChange={(v) => setForm((f) => ({ ...f, disposal_method: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(METHOD).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Mængde</Label><Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></div>
            <div><Label>Enhed</Label><Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Modtageranlæg</Label><Input value={form.disposal_facility} onChange={(e) => setForm((f) => ({ ...f, disposal_facility: e.target.value }))} /></div>
            <div><Label>Certifikatnr.</Label><Input value={form.certificate_number} onChange={(e) => setForm((f) => ({ ...f, certificate_number: e.target.value }))} /></div>
            <div className="flex items-center gap-2 pt-6"><input type="checkbox" id="cert" checked={form.certified} onChange={(e) => setForm((f) => ({ ...f, certified: e.target.checked }))} /><Label htmlFor="cert">Miljøgodkendt/certificeret</Label></div>
            <div><Label>Rapporteret af</Label><Input value={form.reported_by} onChange={(e) => setForm((f) => ({ ...f, reported_by: e.target.value }))} /></div>
            <div><Label>Kvitterings-URL</Label><Input value={form.receipt_url} onChange={(e) => setForm((f) => ({ ...f, receipt_url: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}