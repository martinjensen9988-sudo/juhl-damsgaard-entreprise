import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDKK, formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Search, Wrench, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const typeColors = { Gravemaskine: 'bg-amber-100 text-amber-700', Lastbil: 'bg-blue-100 text-blue-700', Varebil: 'bg-slate-100 text-slate-700', Kompressor: 'bg-purple-100 text-purple-700', Sav: 'bg-emerald-100 text-emerald-700', Andet: 'bg-gray-100 text-gray-600' };
const statusColors = { Planlagt: 'bg-blue-100 text-blue-700', Gennemført: 'bg-emerald-100 text-emerald-700', Forsinket: 'bg-red-100 text-red-700', Aflyst: 'bg-slate-100 text-slate-600' };
const empty = { equipment_name: '', equipment_type: 'Gravemaskine', maintenance_type: 'Service', last_date: '', next_date: '', cost: '', status: 'Planlagt', performed_by: '', mileage_hours: '', notes: '' };

export default function MaterielVedligehold() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { setItems(await base44.entities.EquipmentMaintenance.list() || []); } catch(e){console.error(e);} setLoading(false); };
  useEffect(() => { load(); }, []);

  const today = new Date();
  const filtered = items.filter(i => (!search || i.equipment_name?.toLowerCase().includes(search.toLowerCase())) && (statusFilter === 'all' || i.status === statusFilter));

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({...empty, ...i}); setDialogOpen(true); };
  const field = (k, v) => setForm(f => ({...f, [k]: v}));

  const save = async () => {
    if (!form.equipment_name) { alert('Angiv maskin/udstyr'); return; }
    setSaving(true);
    try { const payload = {...form, cost: Number(form.cost)||0, mileage_hours: Number(form.mileage_hours)||0}; if (editing) await base44.entities.EquipmentMaintenance.update(editing.id, payload); else await base44.entities.EquipmentMaintenance.create(payload); setDialogOpen(false); load(); }
    catch(e){ alert('Fejl'); } setSaving(false);
  };

  const remove = async (i) => { if (confirm(`Slet "${i.equipment_name}"?`)) { try { await base44.entities.EquipmentMaintenance.delete(i.id); load(); } catch(e){} } };

  const stats = { total: items.length, planned: items.filter(i=>i.status==='Planlagt').length, overdue: items.filter(i=>i.next_date && new Date(i.next_date) < today && i.status==='Planlagt').length, completed: items.filter(i=>i.status==='Gennemført').length };
  const totalCost = items.reduce((s,i)=>s+(i.cost||0),0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Wrench className="w-5 h-5 text-amber-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Materiel Vedligehold</h1><p className="text-slate-500 mt-0.5">Forebyggende vedligeholdelse og lovpligtige eftersyn</p></div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Registrer eftersyn</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Total</div><div className="text-2xl font-bold text-slate-900">{stats.total}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Planlagt</div><div className="text-2xl font-bold text-blue-600">{stats.planned}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Forsinket</div><div className="text-2xl font-bold text-red-600 flex items-center gap-1">{stats.overdue}{stats.overdue>0 && <AlertTriangle className="w-4 h-4" />}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Samlet omkostning</div><div className="text-2xl font-bold text-slate-900">{formatDKK(totalCost)}</div></div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Søg på udstyr..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle statusser</SelectItem><SelectItem value="Planlagt">Planlagt</SelectItem><SelectItem value="Gennemført">Gennemført</SelectItem><SelectItem value="Forsinket">Forsinket</SelectItem><SelectItem value="Aflyst">Aflyst</SelectItem></SelectContent></Select>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen vedligeholdelse registreret</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map(i => {
              const overdue = i.next_date && new Date(i.next_date) < today && i.status === 'Planlagt';
              return (
                <div key={i.id} className="p-5 flex items-center gap-4 hover:bg-slate-50 transition">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0"><Wrench className="w-5 h-5 text-slate-600" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><h3 className="font-semibold text-slate-900">{i.equipment_name}</h3><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[i.equipment_type]||typeColors.Andet}`}>{i.equipment_type}</span></div>
                    <div className="text-sm text-slate-500">{i.maintenance_type}{i.performed_by && ` · ${i.performed_by}`}{i.mileage_hours>0 && ` · ${i.mileage_hours} t/km`}</div>
                  </div>
                  <div className="hidden md:block text-right">
                    {i.next_date && <div className={`text-sm flex items-center gap-1 ${overdue?'text-red-600 font-medium':'text-slate-600'}`}><Calendar className="w-3.5 h-3.5" />{formatDate(i.next_date)}{overdue && <AlertTriangle className="w-3.5 h-3.5" />}</div>}
                    {i.cost>0 && <div className="text-xs text-slate-400 mt-0.5">{formatDKK(i.cost)}</div>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[i.status]||statusColors.Planlagt}`}>{i.status}</span>
                  <div className="flex gap-1"><button onClick={()=>openEdit(i)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"><Pencil className="w-3.5 h-3.5" /></button><button onClick={()=>remove(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wrench className="w-5 h-5 text-amber-600" />{editing ? 'Rediger eftersyn' : 'Nyt eftersyn'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Maskin/udstyr *</Label><Input value={form.equipment_name} onChange={e=>field('equipment_name',e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={form.equipment_type} onValueChange={v=>field('equipment_type',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(typeColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Vedligeholdelse</Label><Select value={form.maintenance_type} onValueChange={v=>field('maintenance_type',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Lovpligtigt eftersyn">Lovpligtigt eftersyn</SelectItem><SelectItem value="Service">Service</SelectItem><SelectItem value="Reparation">Reparation</SelectItem><SelectItem value="Skift af dele">Skift af dele</SelectItem><SelectItem value="Andet">Andet</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Sidste eftersyn</Label><Input type="date" value={form.last_date} onChange={e=>field('last_date',e.target.value)} /></div>
              <div><Label>Næste eftersyn</Label><Input type="date" value={form.next_date} onChange={e=>field('next_date',e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Omkostning (DKK)</Label><Input type="number" value={form.cost} onChange={e=>field('cost',e.target.value)} /></div>
              <div><Label>Timer/km</Label><Input type="number" value={form.mileage_hours} onChange={e=>field('mileage_hours',e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label><Select value={form.status} onValueChange={v=>field('status',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(statusColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Udført af</Label><Input value={form.performed_by} onChange={e=>field('performed_by',e.target.value)} /></div>
            </div>
            <div><Label>Noter</Label><Textarea value={form.notes} onChange={e=>field('notes',e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving}>{saving?'Gemmer...':'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}