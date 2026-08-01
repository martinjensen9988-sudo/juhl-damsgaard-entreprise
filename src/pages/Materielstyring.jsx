import { useEffect, useState } from 'react';
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
import { Plus, Pencil, Trash2, Wrench, MapPin } from 'lucide-react';

const CATEGORIES = ['Maskine', 'Værktøj', 'Køretøj', 'Stillads', 'Container', 'Andet'];
const STATUSES = ['Ledig', 'I brug', 'Reparation', 'Ude af drift'];
const CONDITIONS = ['God', 'Slidt', 'Defekt'];

const STATUS_BADGE = {
  'Ledig': 'bg-emerald-100 text-emerald-700',
  'I brug': 'bg-blue-100 text-blue-700',
  'Reparation': 'bg-amber-100 text-amber-700',
  'Ude af drift': 'bg-red-100 text-red-700',
};

const EMPTY = { name: '', category: 'Værktøj', serial_number: '', location: '', status: 'Ledig', assigned_to: '', condition: 'God', notes: '' };

export default function Materielstyring() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [i, p] = await Promise.all([
        base44.entities.Equipment.list('-created_date', 200),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setItems(i);
      setProjects(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (item) => { setForm({ ...EMPTY, ...item }); setEditing(item); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const project = projects.find((p) => p.id === form.assigned_project_id);
      const payload = { ...form, assigned_project_name: project?.name || '' };
      if (editing) await base44.entities.Equipment.update(editing.id, payload);
      else await base44.entities.Equipment.create(payload);
      setDialogOpen(false);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const remove = async (id) => { if (confirm('Slet dette materiel?')) { await base44.entities.Equipment.delete(id); load(); } };

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Materielstyring</h1>
          <p className="text-slate-500 mt-1">Overblik over værktøj, maskiner og udstyr</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Tilføj</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-slate-950 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {s === 'all' ? 'Alle' : s}
            <span className="ml-1.5 text-xs opacity-60">{s === 'all' ? items.length : items.filter((i) => i.status === s).length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Intet materiel registreret.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.category}{item.serial_number ? ` · ${item.serial_number}` : ''}</div>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[item.status] || 'bg-slate-100'}`}>{item.status}</span>
              </div>
              {item.assigned_project_name && (
                <div className="text-sm text-slate-600 mb-1">📋 {item.assigned_project_name}</div>
              )}
              {item.location && (
                <div className="flex items-center gap-1 text-sm text-slate-500 mb-1"><MapPin className="w-3.5 h-3.5" /> {item.location}</div>
              )}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-50">
                <span className="text-xs text-slate-400">Stand: {item.condition}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger materiel' : 'Nyt materiel'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Navn *</Label><Input value={form.name} onChange={set('name')} placeholder="F.eks. Gravemaskine CAT 320" /></div>
            <div className="space-y-1.5"><Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Serienr.</Label><Input value={form.serial_number} onChange={set('serial_number')} /></div>
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
            <div className="col-span-2 space-y-1.5"><Label>Lokation</Label><Input value={form.location} onChange={set('location')} placeholder="F.eks. Depot, Trailer 3" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Tildelt projekt</Label>
              <Select value={form.assigned_project_id || ''} onValueChange={(v) => setForm({ ...form, assigned_project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Ingen" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Noter</Label><Textarea value={form.notes} onChange={set('notes')} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.name}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}