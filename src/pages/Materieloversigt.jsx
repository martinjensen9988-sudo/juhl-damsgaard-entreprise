import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  Wrench, Search, Plus, Pencil, Trash2, Package, MapPin, CheckCircle2,
} from 'lucide-react';
import { formatDate } from '@/lib/format';

const categories = ['Maskine', 'Værktøj', 'Køretøj', 'Stillads', 'Container', 'Andet'];
const statuses = ['Ledig', 'I brug', 'Reparation', 'Ude af drift'];
const conditions = ['God', 'Slidt', 'Defekt'];

const statusColor = {
  Ledig: 'bg-emerald-100 text-emerald-700',
  'I brug': 'bg-blue-100 text-blue-700',
  Reparation: 'bg-amber-100 text-amber-700',
  'Ude af drift': 'bg-red-100 text-red-700',
};
const catIcon = { Maskine: Wrench, Værktøj: Wrench, Køretøj: Package, Stillads: Package, Container: Package, Andet: Package };

export default function Materieloversigt() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const empty = { name: '', category: 'Værktøj', serial_number: '', location: '', status: 'Ledig', assigned_to: '', assigned_project_name: '', condition: 'God', purchase_date: '', notes: '' };

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Equipment.list();
      setItems(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...empty, ...c }); setOpen(true); };

  const save = async () => {
    if (!form.name) return toast({ title: 'Angiv navn', variant: 'destructive' });
    setSaving(true);
    try {
      if (editing) await base44.entities.Equipment.update(editing.id, form);
      else await base44.entities.Equipment.create(form);
      setOpen(false); load();
      toast({ title: editing ? 'Materiel opdateret' : 'Materiel oprettet' });
    } catch (e) { console.error(e); toast({ title: 'Fejl ved gem', variant: 'destructive' }); }
    setSaving(false);
  };

  const quickStatus = async (item, status) => {
    try {
      await base44.entities.Equipment.update(item.id, { status });
      load();
    } catch (e) { toast({ title: 'Kunne ikke opdatere', variant: 'destructive' }); }
  };

  const remove = async (item) => {
    if (!confirm('Slet materiel?')) return;
    try { await base44.entities.Equipment.delete(item.id); load(); } catch (e) {}
  };

  const filtered = items.filter((it) => {
    if (filterCat !== 'all' && it.category !== filterCat) return false;
    if (filterStatus !== 'all' && it.status !== filterStatus) return false;
    if (search && !`${it.name} ${it.serial_number || ''} ${it.location || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: items.length,
    ledig: items.filter((i) => i.status === 'Ledig').length,
    iBrug: items.filter((i) => i.status === 'I brug').length,
    rep: items.filter((i) => i.status === 'Reparation').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center"><Wrench className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Materieloversigt</h1>
            <p className="text-slate-500 mt-0.5">Overblik over firmaets maskiner, værktøj og deres status og placering</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Tilføj materiel</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Total</div><div className="text-xl font-bold text-slate-900 mt-1">{stats.total}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Ledig</div><div className="text-xl font-bold text-emerald-600 mt-1">{stats.ledig}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">I brug</div><div className="text-xl font-bold text-blue-600 mt-1">{stats.iBrug}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-xs text-slate-500">Reparation</div><div className="text-xl font-bold text-amber-600 mt-1">{stats.rep}</div></div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Søg på navn, serienr. eller lokation…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Kategori" /></SelectTrigger><SelectContent><SelectItem value="all">Alle kategorier</SelectItem>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Alle statusser</SelectItem>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      </div>

      {/* List */}
      {loading ? <div className="text-center py-20 text-slate-400">Indlæser…</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Intet materiel fundet</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((it) => {
            const Icon = catIcon[it.category] || Package;
            return (
              <div key={it.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-slate-600" /></div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{it.name}</div>
                      <div className="text-xs text-slate-400">{it.category}{it.serial_number && ` · ${it.serial_number}`}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[it.status] || 'bg-slate-100'}`}>{it.status}</span>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  {it.location && <div className="flex items-center gap-1.5 text-slate-600"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {it.location}</div>}
                  {it.assigned_to && <div className="text-slate-600">Tildelt: <span className="font-medium">{it.assigned_to}</span></div>}
                  {it.assigned_project_name && <div className="text-slate-500 text-xs">Projekt: {it.assigned_project_name}</div>}
                  {it.condition && it.condition !== 'God' && <div className="text-xs text-amber-600">Stand: {it.condition}</div>}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <Select value={it.status} onValueChange={(v) => quickStatus(it, v)}><SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                  <button onClick={() => openEdit(it)} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 ml-auto"><Pencil className="w-3 h-3" /> Rediger</button>
                  <button onClick={() => remove(it)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Rediger materiel' : 'Nyt materiel'}</h2>
            <div className="space-y-3">
              <div><Label>Navn *</Label><Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Kategori</Label><Select value={form.category} onValueChange={(v) => set('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Serienr.</Label><Input value={form.serial_number || ''} onChange={(e) => set('serial_number', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Lokation</Label><Input value={form.location || ''} onChange={(e) => set('location', e.target.value)} placeholder="F.eks. depot / byggeplads" /></div>
                <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tildelt til</Label><Input value={form.assigned_to || ''} onChange={(e) => set('assigned_to', e.target.value)} /></div>
                <div><Label>Projektnavn</Label><Input value={form.assigned_project_name || ''} onChange={(e) => set('assigned_project_name', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Stand</Label><Select value={form.condition} onValueChange={(v) => set('condition', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{conditions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Købsdato</Label><Input type="date" value={form.purchase_date || ''} onChange={(e) => set('purchase_date', e.target.value)} /></div>
              </div>
              <div><Label>Noter</Label><Input value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Gemmer…' : 'Gem'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}