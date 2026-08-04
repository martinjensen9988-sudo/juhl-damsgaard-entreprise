import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { CalendarCheck, Plus, Trash2, Calendar, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { formatDate } from '@/lib/format';

const STATUS = { Reserveret: 'bg-blue-100 text-blue-700', Udleveret: 'bg-amber-100 text-amber-700', Returneret: 'bg-emerald-100 text-emerald-700', Annulleret: 'bg-rose-100 text-rose-700' };
const empty = { equipment_id: '', equipment_name: '', project_id: '', project_name: '', employee_name: '', start_date: '', end_date: '', status: 'Reserveret', notes: '' };

export default function Udstyrsbooking() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, eq, p] = await Promise.all([base44.entities.EquipmentBooking.list('-start_date', 300), base44.entities.Equipment.list().catch(() => []), base44.entities.Project.list().catch(() => [])]);
      setBookings(b || []); setEquipment(eq || []); setProjects(p || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const conflicts = (b) => bookings.filter((o) => o.id !== b.id && o.equipment_name === b.equipment_name && o.status !== 'Annulleret' && o.start_date <= b.end_date && o.end_date >= b.start_date);

  const save = async () => {
    if (!form.equipment_name || !form.start_date || !form.end_date) { alert('Udstyr og datoer kræves'); return; }
    const proj = projects.find((p) => p.id === form.project_id);
    const payload = { ...form, project_name: proj?.name || '' };
    const conflict = bookings.filter((o) => o.id !== form.id && o.equipment_name === form.equipment_name && o.status !== 'Annulleret' && o.start_date <= form.end_date && o.end_date >= form.start_date);
    if (conflict.length > 0 && !confirm('Dette udstyr er allerede reserveret i perioden. Fortsæt alligevel?')) return;
    if (form.id) await base44.entities.EquipmentBooking.update(form.id, payload);
    else await base44.entities.EquipmentBooking.create(payload);
    setOpen(false); setForm(empty); load();
  };

  const del = async (b) => { if (confirm('Slet reservation?')) { await base44.entities.EquipmentBooking.delete(b.id); load(); } };

  const setEq = (id) => { const eq = equipment.find((e) => e.id === id); setForm({ ...form, equipment_id: id, equipment_name: eq?.name || '' }); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><CalendarCheck className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Udstyrsreservationer</h1>
            <p className="text-slate-500">Reservér maskiner til specifikke projektdatoer og undgå dobbeltbooking</p>
          </div>
        </div>
        <Button onClick={() => { setForm(empty); setOpen(true); }} className="bg-slate-950"><Plus className="w-4 h-4" /> Ny reservation</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen reservationer.</p></div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => {
            const cl = conflicts(b);
            return (
              <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{b.equipment_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS[b.status]}`}>{b.status}</span>
                    {cl.length > 0 && <span className="flex items-center gap-1 text-[11px] text-rose-600"><AlertTriangle className="w-3 h-3" /> Konflikt</span>}
                  </div>
                  <div className="text-sm text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(b.start_date)} – {formatDate(b.end_date)}</span>
                    {b.project_name && <span>· {b.project_name}</span>}
                    {b.employee_name && <span className="flex items-center gap-1">· <User className="w-3.5 h-3.5" />{b.employee_name}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setForm({ ...b }); setOpen(true); }} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">Rediger</button>
                  <button onClick={() => del(b)} className="p-2 rounded-lg hover:bg-rose-50"><Trash2 className="w-4 h-4 text-rose-500" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="max-w-md">
          <SheetHeader><SheetTitle>{form.id ? 'Rediger reservation' : 'Ny reservation'}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Udstyr *</Label>
              <Select value={form.equipment_id} onValueChange={setEq}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Vælg udstyr..." /></SelectTrigger>
                <SelectContent>{equipment.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Projekt</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v, project_name: projects.find((p) => p.id === v)?.name || '' })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Vælg projekt..." /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Fra dato *</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label className="text-xs">Til dato *</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Booket af</Label><Input value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} /></div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(STATUS).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
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