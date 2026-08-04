import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Wrench, Plus, AlertTriangle, CheckCircle2, Clock, CalendarClock, Pencil, Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';

const TYPES = ['Lovpligtigt eftersyn', 'Service', 'Reparation', 'Skift af dele', 'Andet'];
const EQUIPMENT_TYPES = ['Gravemaskine', 'Lastbil', 'Varebil', 'Kompressor', 'Sav', 'Andet'];
const STATUS_BADGE = {
  Planlagt: 'bg-blue-100 text-blue-700', Gennemført: 'bg-emerald-100 text-emerald-700',
  Forsinket: 'bg-red-100 text-red-700', Aflyst: 'bg-slate-100 text-slate-500',
};
const empty = { equipment_name: '', equipment_type: 'Gravemaskine', maintenance_type: 'Lovpligtigt eftersyn', last_date: '', next_date: '', cost: '', status: 'Planlagt', performed_by: '', mileage_hours: '', notes: '' };

export default function VaerktoejService() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const load = async () => {
    try { setItems(await base44.entities.EquipmentMaintenance.list('-created_date', 500)); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const today = new Date();
  const annotated = useMemo(() => items.map((m) => {
    const days = m.next_date ? differenceInDays(new Date(m.next_date), today) : null;
    const overdue = days !== null && days < 0 && m.status !== 'Gennemført';
    const soon = days !== null && days >= 0 && days <= 14 && m.status !== 'Gennemført';
    return { ...m, days, overdue, soon };
  }), [items, today]);

  const sorted = useMemo(() => [...annotated].sort((a, b) => {
    if (a.overdue && !b.overdue) return -1; if (!a.overdue && b.overdue) return 1;
    return (a.days ?? 999) - (b.days ?? 999);
  }), [annotated]);

  const counts = useMemo(() => ({
    overdue: annotated.filter((m) => m.overdue).length,
    soon: annotated.filter((m) => m.soon).length,
    done: annotated.filter((m) => m.status === 'Gennemført').length,
    total: items.length,
  }), [annotated, items]);

  const save = async () => {
    if (!form.equipment_name) return;
    const payload = { ...form, cost: form.cost ? Number(form.cost) : null, mileage_hours: form.mileage_hours ? Number(form.mileage_hours) : null };
    if (editId) await base44.entities.EquipmentMaintenance.update(editId, payload);
    else await base44.entities.EquipmentMaintenance.create(payload);
    setOpen(false); setForm(empty); setEditId(null); load();
  };
  const del = async (id) => { if (confirm('Slet post?')) { await base44.entities.EquipmentMaintenance.delete(id); load(); } };
  const edit = (m) => { setForm({ ...empty, ...m, cost: m.cost ?? '', mileage_hours: m.mileage_hours ?? '' }); setEditId(m.id); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><Wrench className="w-7 h-7 text-amber-500" /> Værktøjsvedligeholdelse</h1>
          <p className="text-slate-500 mt-1">Serviceintervaller og lovpligtige eftersyn på maskiner og værktøj</p>
        </div>
        <Button onClick={() => { setForm(empty); setEditId(null); setOpen(true); }} className="bg-amber-500 hover:bg-amber-600"><Plus className="w-4 h-4" /> Registrer eftersyn</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={AlertTriangle} color="text-red-600 bg-red-50" label="Forsinket" value={counts.overdue} />
        <Stat icon={CalendarClock} color="text-amber-600 bg-amber-50" label="Inden 14 dage" value={counts.soon} />
        <Stat icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" label="Gennemført" value={counts.done} />
        <Stat icon={Clock} color="text-slate-600 bg-slate-50" label="Total" value={counts.total} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-3">Udstyr</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Sidste</th>
                <th className="px-4 py-3">Næste</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Omkostning</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((m) => (
                <tr key={m.id} className={m.overdue ? 'bg-red-50/50' : ''}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{m.equipment_name}</div>
                    <div className="text-xs text-slate-500">{m.equipment_type}{m.mileage_hours ? ` · ${m.mileage_hours} t/km` : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{m.maintenance_type}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{m.last_date ? format(new Date(m.last_date), 'dd. MMM yyyy', { locale: da }) : '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {m.next_date ? (
                      <div>
                        <div className="text-slate-900">{format(new Date(m.next_date), 'dd. MMM yyyy', { locale: da })}</div>
                        {m.days !== null && m.status !== 'Gennemført' && (
                          <div className={`text-xs font-medium ${m.overdue ? 'text-red-600' : m.soon ? 'text-amber-600' : 'text-slate-400'}`}>
                            {m.overdue ? `${Math.abs(m.days)} dage forsinket` : `om ${m.days} dage`}
                          </div>
                        )}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[m.status] || STATUS_BADGE.Planlagt}`}>{m.status}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{m.cost ? `${m.cost} kr` : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => edit(m)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => del(m.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Rediger eftersyn' : 'Registrer eftersyn'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Maskin/udstyr *</Label><Input value={form.equipment_name} onChange={(e) => setForm({ ...form, equipment_name: e.target.value })} /></div>
            <div><Label>Udstyrstype</Label>
              <Select value={form.equipment_type} onValueChange={(v) => setForm({ ...form, equipment_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EQUIPMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Vedligeholdelse</Label>
              <Select value={form.maintenance_type} onValueChange={(v) => setForm({ ...form, maintenance_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Sidste eftersyn</Label><Input type="date" value={form.last_date} onChange={(e) => setForm({ ...form, last_date: e.target.value })} /></div>
            <div><Label>Næste eftersyn</Label><Input type="date" value={form.next_date} onChange={(e) => setForm({ ...form, next_date: e.target.value })} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Planlagt', 'Gennemført', 'Forsinket', 'Aflyst'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Omkostning (DKK)</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
            <div><Label>Udført af</Label><Input value={form.performed_by} onChange={(e) => setForm({ ...form, performed_by: e.target.value })} /></div>
            <div><Label>Timer/km ved eftersyn</Label><Input type="number" value={form.mileage_hours} onChange={(e) => setForm({ ...form, mileage_hours: e.target.value })} /></div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save} className="bg-amber-500 hover:bg-amber-600">Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon: Icon, color, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
      <div><div className="text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div>
    </div>
  );
}