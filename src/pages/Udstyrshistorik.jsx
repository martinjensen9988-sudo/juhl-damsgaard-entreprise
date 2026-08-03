import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Pencil, Trash2, Wrench, Calendar } from 'lucide-react';

const M_TYPES = ['Lovpligtigt eftersyn', 'Service', 'Reparation', 'Skift af dele', 'Andet'];
const STATUSES = ['Planlagt', 'Gennemført', 'Forsinket', 'Aflyst'];
const STATUS_COLORS = {
  Planlagt: 'bg-blue-100 text-blue-700',
  Gennemført: 'bg-green-100 text-green-700',
  Forsinket: 'bg-amber-100 text-amber-700',
  Aflyst: 'bg-slate-100 text-slate-500',
};
const formatDKK = (n) => (Number(n) || 0).toLocaleString('da-DK', {
  style: 'currency', currency: 'DKK', maximumFractionDigits: 0,
});

const emptyForm = {
  equipment_name: '', equipment_type: 'Gravemaskine', maintenance_type: 'Service',
  last_date: '', next_date: '', cost: '', status: 'Planlagt', performed_by: '',
  mileage_hours: '', notes: '',
};

export default function Udstyrshistorik() {
  const [records, setRecords] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [equipFilter, setEquipFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [r, e] = await Promise.all([
        base44.entities.EquipmentMaintenance.list('-last_date', 500),
        base44.entities.Equipment.list('-created_date', 500),
      ]);
      setRecords(r);
      setEquipment(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter((r) => {
    const ms = `${r.equipment_name} ${r.performed_by || ''} ${r.notes || ''}`.toLowerCase().includes(search.toLowerCase());
    const me = equipFilter === 'all' || r.equipment_name === equipFilter;
    return ms && me;
  });

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (r) => { setForm({ ...emptyForm, ...r, cost: r.cost ?? '', mileage_hours: r.mileage_hours ?? '' }); setEditId(r.id); setShowForm(true); };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      cost: form.cost === '' ? null : Number(form.cost),
      mileage_hours: form.mileage_hours === '' ? null : Number(form.mileage_hours),
    };
    try {
      if (editId) {
        await base44.entities.EquipmentMaintenance.update(editId, payload);
        toast({ title: 'Historik opdateret' });
      } else {
        await base44.entities.EquipmentMaintenance.create(payload);
        toast({ title: 'Historik oprettet' });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    }
  };

  const remove = async (r) => {
    if (!window.confirm('Slet post?')) return;
    try {
      await base44.entities.EquipmentMaintenance.delete(r.id);
      toast({ title: 'Post slettet' });
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    }
  };

  const totalCost = filtered.reduce((s, r) => s + (Number(r.cost) || 0), 0);
  const upcoming = records.filter((r) => r.next_date && r.status === 'Planlagt').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Udstyrshistorik</h1>
          <p className="text-slate-500 text-sm mt-1">Serviceeftersyn og reparationshistorik for maskiner og værktøj.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Ny post</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="text-xs text-slate-500">Poster i alt</div>
          <div className="text-2xl font-bold text-slate-900">{records.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-xs text-slate-500">Planlagte eftersyn</div>
          <div className="text-2xl font-bold text-blue-700">{upcoming}</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-xs text-slate-500">Samlet omkostning</div>
          <div className="text-2xl font-bold text-slate-900">{formatDKK(totalCost)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Søg udstyr eller udført af…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={equipFilter} onValueChange={setEquipFilter}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alt udstyr</SelectItem>
            {equipment.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Udstyr</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Dato</th>
                <th className="px-4 py-3 font-medium">Næste</th>
                <th className="px-4 py-3 font-medium">Udført af</th>
                <th className="px-4 py-3 font-medium text-right">Omkostning</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Indlæser…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Ingen poster fundet</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-slate-400" />{r.equipment_name}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.maintenance_type}</td>
                  <td className="px-4 py-3 text-slate-500">{r.last_date || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.next_date ? <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{r.next_date}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.performed_by || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{r.cost != null ? formatDKK(r.cost) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] || 'bg-slate-100'}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(r)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Rediger post' : 'Ny vedligeholdelsespost'}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Udstyr *</Label>
              <Input required list="equip-list" value={form.equipment_name} onChange={(e) => setForm({ ...form, equipment_name: e.target.value })} placeholder="Vælg eller indtast udstyr" />
              <datalist id="equip-list">
                {equipment.map((e) => <option key={e.id} value={e.name} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type udstyr</Label>
                <Select value={form.equipment_type} onValueChange={(v) => setForm({ ...form, equipment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Gravemaskine', 'Lastbil', 'Varebil', 'Kompressor', 'Sav', 'Andet'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Vedligeholdelse *</Label>
                <Select value={form.maintenance_type} onValueChange={(v) => setForm({ ...form, maintenance_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{M_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Dato</Label>
                <Input type="date" value={form.last_date || ''} onChange={(e) => setForm({ ...form, last_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Næste eftersyn</Label>
                <Input type="date" value={form.next_date || ''} onChange={(e) => setForm({ ...form, next_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Udført af</Label>
                <Input value={form.performed_by} onChange={(e) => setForm({ ...form, performed_by: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Omkostning (DKK)</Label>
                <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Timer/km ved eftersyn</Label>
                <Input type="number" value={form.mileage_hours} onChange={(e) => setForm({ ...form, mileage_hours: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Noter</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuller</Button>
              <Button type="submit">Gem</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}