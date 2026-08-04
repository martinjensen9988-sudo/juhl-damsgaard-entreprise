import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react';

const STATUS = { Reserveret: 'bg-blue-100 text-blue-700', Udleveret: 'bg-amber-100 text-amber-700', Returneret: 'bg-emerald-100 text-emerald-700', Annulleret: 'bg-red-100 text-red-700' };
const empty = { equipment_id: '', equipment_name: '', project_name: '', employee_name: '', start_date: '', end_date: '', status: 'Reserveret', notes: '' };

export default function UdstyrBooking() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [conflict, setConflict] = useState(null);

  const load = useCallback(async () => {
    const [b, e, p] = await Promise.all([
      base44.entities.EquipmentBooking.list('-start_date', 200).catch(() => []),
      base44.entities.Equipment.list('-created_date', 200).catch(() => []),
      base44.entities.Project.list('-created_date', 100).catch(() => []),
    ]);
    setBookings(b || []); setEquipment(e || []); setProjects(p || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ ...empty, start_date: new Date().toISOString().slice(0, 10) }); setConflict(null); setOpen(true); };
  const openEdit = (it) => { setEditing(it); setForm({ ...empty, ...it }); setConflict(null); setOpen(true); };

  const checkConflict = (eqId, start, end) => {
    if (!eqId || !start || !end) return null;
    return bookings.find((b) => b.equipment_id === eqId && b.status !== 'Annulleret' && b.id !== editing?.id && start < b.end_date && end > b.start_date);
  };

  const save = async () => {
    if (!form.equipment_name || !form.start_date || !form.end_date) { alert('Vælg udstyr og datoer'); return; }
    if (form.end_date < form.start_date) { alert('Slutdato er før startdato'); return; }
    const c = checkConflict(form.equipment_id, form.start_date, form.end_date);
    if (c) { if (!confirm(`Dobbeltbooking! ${c.equipment_name} er reserveret ${c.start_date}–${c.end_date}. Fortsæt alligevel?`)) return; }
    if (editing) await base44.entities.EquipmentBooking.update(editing.id, form);
    else await base44.entities.EquipmentBooking.create(form);
    setOpen(false); load();
  };
  const remove = async (id) => { if (confirm('Slet booking?')) { await base44.entities.EquipmentBooking.delete(id); load(); } };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Udstyr Booking</h1>
          <p className="text-sm text-muted-foreground">Reservér maskiner og køretøjer for at undgå dobbeltbookinger.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Ny reservation</Button>
      </div>

      <div className="grid gap-3">
        {bookings.length === 0 && <p className="text-sm text-muted-foreground">Ingen reservationer.</p>}
        {bookings.map((b) => (
          <div key={b.id} className="rounded-lg border bg-card p-4 flex items-start justify-between gap-2">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Wrench className="w-5 h-5 text-slate-500" /></div>
              <div>
                <div className="font-semibold">{b.equipment_name}</div>
                <div className="text-xs text-muted-foreground">{b.start_date} → {b.end_date} {b.project_name ? `• ${b.project_name}` : ''} {b.employee_name ? `• ${b.employee_name}` : ''}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS[b.status]}`}>{b.status}</span>
              <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger reservation' : 'Ny reservation'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Udstyr</Label>
              <Select value={form.equipment_id} onValueChange={(v) => {
                const eq = equipment.find((e) => e.id === v);
                setForm((f) => ({ ...f, equipment_id: v, equipment_name: eq?.name || '' }));
                setConflict(checkConflict(v, form.start_date, form.end_date));
              }}>
                <SelectTrigger><SelectValue placeholder="Vælg udstyr" /></SelectTrigger>
                <SelectContent>{equipment.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.category})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fra dato</Label><Input type="date" value={form.start_date} onChange={(e) => { setForm((f) => ({ ...f, start_date: e.target.value })); setConflict(checkConflict(form.equipment_id, e.target.value, form.end_date)); }} /></div>
            <div><Label>Til dato</Label><Input type="date" value={form.end_date} onChange={(e) => { setForm((f) => ({ ...f, end_date: e.target.value })); setConflict(checkConflict(form.equipment_id, form.start_date, e.target.value)); }} /></div>
            <div><Label>Projekt</Label><Select value={form.project_name} onValueChange={(v) => setForm((f) => ({ ...f, project_name: v }))}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Booket af</Label><Input value={form.employee_name} onChange={(e) => setForm((f) => ({ ...f, employee_name: e.target.value }))} /></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(STATUS).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          {conflict && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 mt-2">⚠ Dobbeltbooking: {conflict.equipment_name} er reserveret {conflict.start_date}–{conflict.end_date}.</div>}
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}