import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const TYPES = ['Merarbejde', 'Materialefejl', 'Forsinkelse', 'Klage', 'Fejl udførelse', 'Andet'];
const SEVERITY = { Lav: 'bg-slate-100 text-slate-600', Mellem: 'bg-amber-100 text-amber-700', Høj: 'bg-orange-100 text-orange-700', Kritisk: 'bg-red-100 text-red-700' };
const STATUS = { 'Åben': 'bg-blue-100 text-blue-700', 'Under behandling': 'bg-amber-100 text-amber-700', 'Lukket': 'bg-emerald-100 text-emerald-700' };

const empty = { title: '', project_id: '', project_name: '', type: 'Merarbejde', severity: 'Mellem', status: 'Åben', extra_cost: 0, extra_hours: 0, date: new Date().toISOString().slice(0, 10), reported_by: '', description: '', resolution: '' };

export default function Afvigelsesstyring() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    const [d, p] = await Promise.all([
      base44.entities.Deviation.list('-date', 200).catch(() => []),
      base44.entities.Project.list('-created_date', 100).catch(() => []),
    ]);
    setItems(d || []);
    setProjects(p || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it) => { setEditing(it); setForm({ ...empty, ...it }); setOpen(true); };

  const save = async () => {
    if (!form.title || !form.project_id || !form.date) { alert('Udfyld titel, projekt og dato'); return; }
    const proj = projects.find((p) => p.id === form.project_id);
    const payload = { ...form, project_name: proj?.name || form.project_name, extra_cost: Number(form.extra_cost) || 0, extra_hours: Number(form.extra_hours) || 0 };
    if (editing) await base44.entities.Deviation.update(editing.id, payload);
    else await base44.entities.Deviation.create(payload);
    setOpen(false); load();
  };

  const remove = async (id) => { if (confirm('Slet afvigelse?')) { await base44.entities.Deviation.delete(id); load(); } };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Afvigelsesstyring</h1>
          <p className="text-sm text-muted-foreground">Registrer og følg op på merarbejde og ændringer i projektplanen.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Ny afvigelse</Button>
      </div>

      <div className="grid gap-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Ingen afvigelser registreret.</p>}
        {items.map((it) => (
          <div key={it.id} className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{it.title}</div>
                <div className="text-xs text-muted-foreground">{it.project_name} • {it.date}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${SEVERITY[it.severity]}`}>{it.severity}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS[it.status]}`}>{it.status}</span>
              </div>
            </div>
            {it.description && <p className="text-sm text-muted-foreground">{it.description}</p>}
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Type: {it.type}</span>
                {(it.extra_cost > 0 || it.extra_hours > 0) && <span>Meromkostning: {it.extra_cost} DKK • {it.extra_hours} t</span>}
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger afvigelse' : 'Ny afvigelse'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Titel</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Projekt</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm((f) => ({ ...f, project_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
            <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Alvorlighed</Label><Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(SEVERITY).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(STATUS).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Meromkostning (DKK)</Label><Input type="number" value={form.extra_cost} onChange={(e) => setForm((f) => ({ ...f, extra_cost: e.target.value }))} /></div>
            <div><Label>Mertimer</Label><Input type="number" value={form.extra_hours} onChange={(e) => setForm((f) => ({ ...f, extra_hours: e.target.value }))} /></div>
            <div><Label>Rapporteret af</Label><Input value={form.reported_by} onChange={(e) => setForm((f) => ({ ...f, reported_by: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="col-span-2"><Label>Løsning</Label><Textarea value={form.resolution} onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save}>Gem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}