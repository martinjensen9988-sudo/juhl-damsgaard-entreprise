import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Wrench, Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { formatDKK } from '@/lib/format';

const TYPES = ['Gravemaskine', 'Lastbil', 'Varebil', 'Kompressor', 'Sav', 'Andet'];
const MAINT = ['Lovpligtigt eftersyn', 'Service', 'Reparation', 'Skift af dele', 'Andet'];
const STATUS = { Planlagt: 'bg-blue-100 text-blue-700', Gennemført: 'bg-emerald-100 text-emerald-700', Forsinket: 'bg-amber-100 text-amber-700', Aflyst: 'bg-rose-100 text-rose-700' };
const empty = { equipment_name: '', equipment_type: 'Gravemaskine', maintenance_type: 'Service', last_date: '', next_date: '', cost: '', status: 'Planlagt', performed_by: '', mileage_hours: '', notes: '' };

export default function Servicehistorik() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState('Alle');

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await base44.entities.EquipmentMaintenance.list('-last_date', 300)) || []); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const equipmentNames = [...new Set(items.map((i) => i.equipment_name).filter(Boolean))].sort();
  const filtered = filter === 'Alle' ? items : items.filter((i) => i.equipment_name === filter);

  const openNew = () => { setEdit(null); setForm(empty); setOpen(true); };
  const openEdit = (s) => { setEdit(s); setForm({ ...empty, ...s, cost: s.cost ?? '', mileage_hours: s.mileage_hours ?? '' }); setOpen(true); };

  const save = async () => {
    if (!form.equipment_name || !form.maintenance_type) { alert('Udstyr og type kræves'); return; }
    const payload = { ...form, cost: form.cost ? Number(form.cost) : null, mileage_hours: form.mileage_hours ? Number(form.mileage_hours) : null };
    if (edit) await base44.entities.EquipmentMaintenance.update(edit.id, payload);
    else await base44.entities.EquipmentMaintenance.create(payload);
    setOpen(false); load();
  };

  const del = async (s) => { if (confirm('Slet post?')) { await base44.entities.EquipmentMaintenance.delete(s.id); load(); } };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><Wrench className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Servicehistorik</h1>
            <p className="text-slate-500">Al udført vedligeholdelse og service på maskiner og værktøj</p>
          </div>
        </div>
        <Button onClick={openNew} className="bg-slate-950"><Plus className="w-4 h-4" /> Registrer</Button>
      </div>

      {equipmentNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('Alle')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === 'Alle' ? 'bg-slate-950 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Alle</button>
          {equipmentNames.map((n) => (
            <button key={n} onClick={() => setFilter(n)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === n ? 'bg-slate-950 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{n}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen serviceposter.</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Udstyr</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Vedligeholdelse</th>
                <th className="text-left px-4 py-3">Dato</th>
                <th className="text-right px-4 py-3">Omkostning</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.equipment_name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.equipment_type}</td>
                  <td className="px-4 py-3 text-slate-600">{s.maintenance_type}</td>
                  <td className="px-4 py-3 text-slate-500">{s.last_date || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{s.cost ? formatDKK(s.cost) : '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS[s.status] || ''}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                      <button onClick={() => del(s)} className="p-1.5 rounded hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{edit ? 'Rediger post' : 'Registrer service'}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Maskin/udstyr *</Label><Input value={form.equipment_name} onChange={(e) => setForm({ ...form, equipment_name: e.target.value })} placeholder="F.eks. Gravemaskine 3" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Type</Label>
                <Select value={form.equipment_type} onValueChange={(v) => setForm({ ...form, equipment_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label className="text-xs">Vedligeholdelse</Label>
                <Select value={form.maintenance_type} onValueChange={(v) => setForm({ ...form, maintenance_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MAINT.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Udført dato</Label><Input type="date" value={form.last_date} onChange={(e) => setForm({ ...form, last_date: e.target.value })} /></div>
              <div><Label className="text-xs">Næste eftersyn</Label><Input type="date" value={form.next_date} onChange={(e) => setForm({ ...form, next_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Omkostning (DKK)</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
              <div><Label className="text-xs">Timer/km</Label><Input type="number" value={form.mileage_hours} onChange={(e) => setForm({ ...form, mileage_hours: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Udført af</Label><Input value={form.performed_by} onChange={(e) => setForm({ ...form, performed_by: e.target.value })} /></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(STATUS).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div><Label className="text-xs">Noter</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
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