import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Package, Wrench } from 'lucide-react';
import { formatDate, formatDKK } from '@/lib/format';

const STATUSES = ['Reserveret', 'Udleveret', 'Returneret', 'Annulleret'];
const STATUS_BADGE = { Reserveret: 'bg-amber-100 text-amber-700', Udleveret: 'bg-blue-100 text-blue-700', Returneret: 'bg-emerald-100 text-emerald-700', Annulleret: 'bg-red-100 text-red-700' };

const EMPTY = { equipment_id: '', equipment_name: '', project_id: '', project_name: '', employee_name: '', start_date: '', end_date: '', status: 'Reserveret', is_external_rental: false, renter_name: '', renter_company: '', renter_phone: '', daily_rate: '', total_price: '', notes: '' };

export default function Udstyrsudlejning() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [b, eq, p] = await Promise.all([base44.entities.EquipmentBooking.list('-start_date', 200), base44.entities.Equipment.list('-created_date', 200), base44.entities.Project.list('-created_date', 100)]);
      setBookings(b || []); setEquipment(eq || []); setProjects(p || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const openNew = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (i) => { setForm({ ...EMPTY, ...i, daily_rate: i.daily_rate ?? '', total_price: i.total_price ?? '' }); setEditing(i); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const eq = equipment.find((x) => x.id === form.equipment_id);
      const proj = projects.find((p) => p.id === form.project_id);
      const payload = { ...form, is_external_rental: !!form.is_external_rental, daily_rate: Number(form.daily_rate) || 0, total_price: Number(form.total_price) || 0, equipment_name: eq?.name || form.equipment_name, project_name: proj?.name || '' };
      if (editing) { await base44.entities.EquipmentBooking.update(editing.id, payload); } else { await base44.entities.EquipmentBooking.create(payload); }
      setDialogOpen(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const remove = async (id) => { if (!confirm('Slet denne booking?')) return; await base44.entities.EquipmentBooking.delete(id); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center"><Wrench className="w-6 h-6 text-amber-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Udstyrsudlejning</h1><p className="text-slate-500 mt-0.5">Udlejning af maskiner og værktøj til eksterne parter eller projekter</p></div>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Ny udlejning</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" /></div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen udlejninger endnu.</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{b.equipment_name}</div><div className="text-xs text-slate-500">{b.is_external_rental ? `Ekstern: ${b.renter_name || b.renter_company || ''}` : b.project_name || 'Intern'}</div></div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE[b.status]}`}>{b.status}</span>
              </div>
              <div className="text-xs text-slate-500 space-y-0.5 mb-2">
                <div>{formatDate(b.start_date)} → {formatDate(b.end_date)}</div>
                {b.daily_rate > 0 && <div>Dagspris: {formatDKK(b.daily_rate)}</div>}
                {b.total_price > 0 && <div className="font-semibold text-slate-700">Total: {formatDKK(b.total_price)}</div>}
              </div>
              <div className="flex justify-end gap-1 pt-2 border-t border-slate-100"><Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="w-4 h-4 text-slate-500" /></Button><Button variant="ghost" size="icon" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger udlejning' : 'Ny udlejning'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Udstyr *</Label><Select value={form.equipment_id} onValueChange={(v) => setForm({ ...form, equipment_id: v })}><SelectTrigger><SelectValue placeholder="Vælg udstyr" /></SelectTrigger><SelectContent>{equipment.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Startdato *</Label><Input type="date" value={form.start_date} onChange={set('start_date')} /></div>
            <div className="space-y-1.5"><Label>Slutdato *</Label><Input type="date" value={form.end_date} onChange={set('end_date')} /></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Booket af</Label><Input value={form.employee_name} onChange={set('employee_name')} /></div>
            <div className="col-span-2 flex items-center gap-2 py-1">
              <input type="checkbox" id="ext" checked={!!form.is_external_rental} onChange={(e) => setForm({ ...form, is_external_rental: e.target.checked })} className="w-4 h-4 rounded" />
              <label htmlFor="ext" className="text-sm text-slate-700">Ekstern udlejning (til tredjepart)</label>
            </div>
            {form.is_external_rental ? (
              <>
                <div className="space-y-1.5"><Label>Lejer navn</Label><Input value={form.renter_name} onChange={set('renter_name')} /></div>
                <div className="space-y-1.5"><Label>Virksomhed</Label><Input value={form.renter_company} onChange={set('renter_company')} /></div>
                <div className="col-span-2 space-y-1.5"><Label>Telefon</Label><Input value={form.renter_phone} onChange={set('renter_phone')} /></div>
              </>
            ) : (
              <div className="col-span-2 space-y-1.5"><Label>Projekt</Label><Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}><SelectTrigger><SelectValue placeholder="Internt projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            )}
            <div className="space-y-1.5"><Label>Dagspris (DKK)</Label><Input type="number" value={form.daily_rate} onChange={set('daily_rate')} /></div>
            <div className="space-y-1.5"><Label>Totalpris (DKK)</Label><Input type="number" value={form.total_price} onChange={set('total_price')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Noter</Label><Textarea value={form.notes} onChange={set('notes')} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving || !form.equipment_id || !form.start_date || !form.end_date}>{saving ? 'Gemmer...' : 'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}