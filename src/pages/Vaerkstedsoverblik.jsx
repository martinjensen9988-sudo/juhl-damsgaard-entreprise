import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Wrench, Loader2, Plus, Pencil, Trash2, Package, AlertTriangle, CheckCircle2, XCircle, Settings } from 'lucide-react';
import { formatDate } from '@/lib/format';

const CATEGORIES = ['Maskine', 'Værktøj', 'Køretøj', 'Stillads', 'Container', 'Andet'];
const STATUSES = ['Ledig', 'I brug', 'Reparation', 'Ude af drift'];
const CONDITIONS = ['God', 'Slidt', 'Defekt'];

const STATUS_BADGE = {
  Ledig: 'bg-emerald-100 text-emerald-700',
  'I brug': 'bg-blue-100 text-blue-700',
  Reparation: 'bg-red-100 text-red-700',
  'Ude af drift': 'bg-slate-200 text-slate-500',
};
const STATUS_ICON = {
  Ledig: CheckCircle2,
  'I brug': Package,
  Reparation: AlertTriangle,
  'Ude af drift': XCircle,
};
const CONDITION_BADGE = { God: 'bg-emerald-50 text-emerald-600', Slidt: 'bg-amber-50 text-amber-600', Defekt: 'bg-red-50 text-red-600' };

const EMPTY = { name: '', category: 'Værktøj', serial_number: '', location: '', status: 'Ledig', condition: 'God', purchase_date: '', notes: '' };

export default function Vaerkstedsoverblik() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setEquipment(await base44.entities.Equipment.list('-created_date', 500));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const openNew = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (eq) => { setEditing(eq); setForm({ ...EMPTY, ...eq }); setDialog(true); };

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editing) await base44.entities.Equipment.update(editing.id, form);
      else await base44.entities.Equipment.create(form);
      setDialog(false); load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const remove = async (id) => { if (confirm('Slet materiel?')) { await base44.entities.Equipment.delete(id); load(); } };

  const setStatus = async (eq, status) => { await base44.entities.Equipment.update(eq.id, { status }); load(); };

  const filtered = equipment
    .filter((e) => filter === 'all' || e.status === filter)
    .filter((e) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (e.name || '').toLowerCase().includes(q) || (e.serial_number || '').toLowerCase().includes(q) || (e.location || '').toLowerCase().includes(q);
    });

  const counts = {
    Ledig: equipment.filter((e) => e.status === 'Ledig').length,
    'I brug': equipment.filter((e) => e.status === 'I brug').length,
    Reparation: equipment.filter((e) => e.status === 'Reparation').length,
    'Ude af drift': equipment.filter((e) => e.status === 'Ude af drift').length,
  };
  const needsAttention = equipment.filter((e) => e.status === 'Reparation' || e.status === 'Ude af drift' || e.condition === 'Defekt');

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Wrench className="w-6 h-6 text-amber-500" /> Værkstedsoverblik</h1>
          <p className="text-sm text-slate-500 mt-1">Status på alt materiel — reparationer, stand og tilgængelighed</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Tilføj materiel</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map((s) => {
          const Icon = STATUS_ICON[s];
          return (
            <Card key={s} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter(filter === s ? 'all' : s)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Icon className="w-3 h-3" /> {s}</div>
                  <div className="text-2xl font-bold text-slate-900">{counts[s]}</div>
                </div>
                <span className={`w-3 h-3 rounded-full ${STATUS_BADGE[s].split(' ')[0].replace('bg-', 'bg-').replace('100', '500')}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-slate-900">Til umiddelbar opmærksomhed</h2>
            <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">{needsAttention.length}</span>
          </div>
          <div className="space-y-2">
            {needsAttention.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between bg-white rounded-lg border border-amber-200 p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${eq.status === 'Reparation' ? 'bg-red-100' : eq.status === 'Ude af drift' ? 'bg-slate-100' : 'bg-amber-100'}`}>
                    <Wrench className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{eq.name}</div>
                    <div className="text-xs text-slate-400">
                      {eq.serial_number && `SN: ${eq.serial_number}`}
                      {eq.location && ` • ${eq.location}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[eq.status] || ''}`}>{eq.status}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CONDITION_BADGE[eq.condition] || ''}`}>{eq.condition}</span>
                  <Button variant="outline" size="sm" onClick={() => openEdit(eq)}><Settings className="w-3.5 h-3.5" /></Button>
                  {eq.status === 'Reparation' && <Button variant="outline" size="sm" onClick={() => setStatus(eq, 'Ledig')}>Klar</Button>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Søg materiel..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statusser</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s} ({counts[s]})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Equipment grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((eq) => {
          const SIcon = STATUS_ICON[eq.status] || Package;
          return (
            <Card key={eq.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${eq.status === 'Reparation' ? 'bg-red-100' : eq.status === 'Ude af drift' ? 'bg-slate-100' : eq.status === 'Ledig' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                    <SIcon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{eq.name}</div>
                    <div className="text-xs text-slate-400">{eq.category}</div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => openEdit(eq)} className="text-slate-400 hover:text-slate-700 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(eq.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[eq.status] || ''}`}>{eq.status}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${CONDITION_BADGE[eq.condition] || ''}`}>Stand: {eq.condition}</span>
              </div>
              <div className="space-y-1 text-xs text-slate-400 border-t border-slate-100 pt-3">
                {eq.serial_number && <div className="flex items-center justify-between"><span>Serienr.</span><span className="text-slate-600 font-mono">{eq.serial_number}</span></div>}
                {eq.location && <div className="flex items-center justify-between"><span>Lokation</span><span className="text-slate-600">{eq.location}</span></div>}
                {eq.assigned_to && <div className="flex items-center justify-between"><span>Tildelt</span><span className="text-slate-600">{eq.assigned_to}</span></div>}
                {eq.assigned_project_name && <div className="flex items-center justify-between"><span>Projekt</span><span className="text-slate-600">{eq.assigned_project_name}</span></div>}
                {eq.purchase_date && <div className="flex items-center justify-between"><span>Købt</span><span className="text-slate-600">{formatDate(eq.purchase_date)}</span></div>}
              </div>
              {eq.notes && <div className="text-xs text-slate-500 mt-2 italic">{eq.notes}</div>}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400"><Wrench className="w-12 h-12 mx-auto mb-2 text-slate-300" />Intet materiel fundet</div>
        )}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger materiel' : 'Nyt materiel'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Navn *</Label><Input value={form.name} onChange={set('name')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Serienr.</Label><Input value={form.serial_number || ''} onChange={set('serial_number')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Stand</Label>
                <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Lokation</Label><Input value={form.location || ''} onChange={set('location')} /></div>
              <div className="space-y-1.5"><Label>Købsdato</Label><Input type="date" value={form.purchase_date || ''} onChange={set('purchase_date')} /></div>
            </div>
            <div className="space-y-1.5"><Label>Noter</Label><Textarea value={form.notes || ''} onChange={set('notes')} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.name}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Gem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}