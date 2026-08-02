import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Wrench, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { formatDate, formatDKK } from '@/lib/format';

const equipTypes = ['Gravemaskine', 'Lastbil', 'Varebil', 'Kompressor', 'Sav', 'Andet'];
const maintTypes = ['Lovpligtigt eftersyn', 'Service', 'Reparation', 'Skift af dele', 'Andet'];
const statuses = ['Planlagt', 'Gennemført', 'Forsinket', 'Aflyst'];
const statusColor = { Planlagt: 'bg-slate-100 text-slate-600', Gennemført: 'bg-emerald-100 text-emerald-700', Forsinket: 'bg-amber-100 text-amber-700', Aflyst: 'bg-red-100 text-red-700' };
const empty = { equipment_name: '', equipment_type: 'Gravemaskine', maintenance_type: 'Service', last_date: '', next_date: '', cost: '', status: 'Planlagt', performed_by: '', mileage_hours: '', notes: '' };

function daysUntil(dateStr) { if (!dateStr) return null; return Math.ceil((new Date(dateStr) - new Date()) / 86400000); }

export default function Vedligeholdelseslog() {
  const [logs, setLogs] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try { const [l, e] = await Promise.all([base44.entities.EquipmentMaintenance.list(), base44.entities.Equipment.list().catch(() => [])]); setLogs(l || []); setEquipment(e || []); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm({ ...empty, ...l }); setOpen(true); };

  const save = async () => {
    if (!form.equipment_name || !form.maintenance_type) return alert('Angiv maskin og type');
    setSaving(true);
    try { editing ? await base44.entities.EquipmentMaintenance.update(editing.id, form) : await base44.entities.EquipmentMaintenance.create(form); setOpen(false); load(); }
    catch (e) { console.error(e); alert('Fejl'); }
    setSaving(false);
  };
  const remove = async (l) => { if (!confirm('Slet post?')) return; try { await base44.entities.EquipmentMaintenance.delete(l.id); load(); } catch (e) {} };

  const filtered = useMemo(() => {
    if (filter === 'all') return logs;
    if (filter === 'mandatory') return logs.filter((l) => l.maintenance_type === 'Lovplagtigt eftersyn');
    if (filter === 'overdue') return logs.filter((l) => l.next_date && daysUntil(l.next_date) < 0 && l.status !== 'Gennemført');
    if (filter === 'soon') return logs.filter((l) => { const d = daysUntil(l.next_date); return d !== null && d >= 0 && d <= 30 && l.status !== 'Gennemført'; });
    return logs;
  }, [logs, filter]);

  const stats = useMemo(() => ({
    total: logs.length,
    done: logs.filter((l) => l.status === 'Gennemført').length,
    mandatory: logs.filter((l) => l.maintenance_type === 'Lovplagtigt eftersyn').length,
    overdue: logs.filter((l) => l.next_date && daysUntil(l.next_date) < 0 && l.status !== 'Gennemført').length,
    cost: logs.filter((l) => l.status === 'Gennemført').reduce((s, l) => s + (Number(l.cost) || 0), 0),
  }), [logs]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><ClipboardCheck className="w-5 h-5 text-amber-600" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Vedligeholdelseslog</h1>
            <p className="text-slate-500 mt-0.5">Serviceeftersyn og vedligeholdelse af maskinparken — hold styr på lovpligtige tjek</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Registrer eftersyn</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Total', stats.total, 'text-slate-900'], ['Gennemført', stats.done, 'text-emerald-600'], ['Lovpligtige', stats.mandatory, 'text-blue-600'], ['Overskredet', stats.overdue, 'text-red-600']].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">{l}</div><div className={`text-2xl font-bold ${c}`}>{v}</div></div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[['all', 'Alle'], ['mandatory', 'Lovplagtige'], ['overdue', 'Overskredet'], ['soon', 'Snart (30 d)']].map(([k, l]) => (
          <Button key={k} variant={filter === k ? 'default' : 'outline'} size="sm" onClick={() => setFilter(k)}>{l}</Button>
        ))}
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen poster</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr>
              <th className="text-left px-4 py-3 font-medium">Maskin</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Vedligeholdelse</th>
              <th className="text-left px-4 py-3 font-medium">Sidste</th>
              <th className="text-left px-4 py-3 font-medium">Næste</th>
              <th className="text-right px-4 py-3 font-medium">Omkostning</th>
              <th className="text-left px-4 py-3 font-medium">Udført af</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => {
                const d = daysUntil(l.next_date);
                const overdue = d !== null && d < 0 && l.status !== 'Gennemført';
                const soon = d !== null && d >= 0 && d <= 30 && l.status !== 'Gennemført';
                return (
                  <tr key={l.id} className={`hover:bg-slate-50 ${overdue ? 'bg-red-50' : soon ? 'bg-amber-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">{l.equipment_name}</td>
                    <td className="px-4 py-3 text-slate-500">{l.equipment_type}</td>
                    <td className="px-4 py-3">{l.maintenance_type === 'Lovplagtigt eftersyn' && <AlertTriangle className="w-3 h-3 text-amber-500 inline mr-1" />}{l.maintenance_type}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(l.last_date)}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(l.next_date)}{d !== null && l.status !== 'Gennemført' && <span className={`ml-1 ${overdue ? 'text-red-600 font-medium' : soon ? 'text-amber-600' : 'text-slate-400'}`}>({d > 0 ? `${d}d` : d === 0 ? 'i dag' : `${Math.abs(d)}d for sent`})</span>}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{l.cost > 0 ? formatDKK(l.cost) : '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{l.performed_by || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[l.status] || 'bg-slate-100'}`}>{l.status}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => openEdit(l)} className="text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button><button onClick={() => remove(l)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger eftersyn' : 'Registrer eftersyn'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Maskin/udstyr *</Label>
                <Select value={form.equipment_name} onValueChange={(v) => set('equipment_name', v)}>
                  <SelectTrigger><SelectValue placeholder="Vælg eller skriv" /></SelectTrigger>
                  <SelectContent>{equipment.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Type</Label><Select value={form.equipment_type} onValueChange={(v) => set('equipment_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{equipTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Vedligeholdelse</Label><Select value={form.maintenance_type} onValueChange={(v) => set('maintenance_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{maintTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sidste eftersyn</Label><Input type="date" value={form.last_date} onChange={(e) => set('last_date', e.target.value)} /></div>
              <div><Label>Næste eftersyn</Label><Input type="date" value={form.next_date} onChange={(e) => set('next_date', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Omkostning (DKK)</Label><Input type="number" value={form.cost} onChange={(e) => set('cost', e.target.value ? Number(e.target.value) : '')} /></div>
              <div><Label>Timer/km ved eftersyn</Label><Input type="number" value={form.mileage_hours} onChange={(e) => set('mileage_hours', e.target.value ? Number(e.target.value) : '')} /></div>
            </div>
            <div><Label>Udført af</Label><Input value={form.performed_by} onChange={(e) => set('performed_by', e.target.value)} /></div>
            <div><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}