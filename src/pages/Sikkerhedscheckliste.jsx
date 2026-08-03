import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Pencil, Trash2, ClipboardCheck, MapPin } from 'lucide-react';

const TYPES = ['Arbejdsmiljø-tjekliste', 'Pladsgennemgang', 'Stilladsinspektion', 'Maskinsikkerhed', 'Elektrisk sikkerhed', 'Andet'];
const STATUSES = ['Udkast', 'Udfyldt', 'Godkendt', 'Med bemærkninger'];
const STATUS_COLORS = {
  Udkast: 'bg-slate-100 text-slate-600',
  Udfyldt: 'bg-blue-100 text-blue-700',
  Godkendt: 'bg-green-100 text-green-700',
  'Med bemærkninger': 'bg-amber-100 text-amber-700',
};

const DEFAULT_ITEMS = [
  'Arbejdspladsen er afspærret',
  'Personlige værnemidler til stede',
  'Førstehjælpskasse tilgængelig',
  'Brandslukker tilgængelig',
  'Gangveje frie for hinder',
  'Stilladskontrol udført',
  'Elektriske installationer sikret',
  'Affaldssortering etableret',
];

const emptyForm = {
  title: '', project_id: '', project_name: '', location: '',
  date: new Date().toISOString().slice(0, 10), type: 'Arbejdsmiljø-tjekliste',
  filled_by: '', status: 'Udkast', notes: '',
  items: DEFAULT_ITEMS.map((d) => ({ description: d, checked: false, notes: '' })),
};

export default function Sikkerhedscheckliste() {
  const [lists, setLists] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([
        base44.entities.SafetyChecklist.list('-date', 500),
        base44.entities.Project.list('-created_date', 500),
      ]);
      setLists(l);
      setProjects(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = lists.filter((l) =>
    `${l.title} ${l.project_name || ''} ${l.location || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (l) => { setForm({ ...emptyForm, ...l, items: (l.items && l.items.length) ? l.items : emptyForm.items }); setEditId(l.id); setShowForm(true); };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };
  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', checked: false, notes: '' }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const save = async (e) => {
    e.preventDefault();
    const project = projects.find((p) => p.id === form.project_id);
    const payload = { ...form, project_name: project?.name || form.project_name };
    try {
      if (editId) {
        await base44.entities.SafetyChecklist.update(editId, payload);
        toast({ title: 'Tjekliste opdateret' });
      } else {
        await base44.entities.SafetyChecklist.create(payload);
        toast({ title: 'Tjekliste oprettet' });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    }
  };

  const remove = async (l) => {
    if (!window.confirm('Slet tjekliste?')) return;
    try {
      await base44.entities.SafetyChecklist.delete(l.id);
      toast({ title: 'Tjekliste slettet' });
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    }
  };

  const completionRate = (l) => {
    if (!l.items || l.items.length === 0) return 0;
    return Math.round((l.items.filter((i) => i.checked).length / l.items.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sikkerhedscheckliste</h1>
          <p className="text-slate-500 text-sm mt-1">Arbejdsmiljø-tjeklister — udfyldes direkte fra mobilen på pladsen.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Ny tjekliste</Button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Søg tjeklister…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 max-w-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-slate-400">Ingen tjeklister fundet</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const rate = completionRate(l);
            return (
              <div key={l.id} className="bg-white rounded-xl border p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[l.status] || 'bg-slate-100'}`}>{l.status}</span>
                      <span className="text-xs text-slate-500">{l.type}</span>
                    </div>
                    <div className="font-semibold text-slate-900 mt-1">{l.title}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-3 mt-1">
                      {l.project_name && <span>{l.project_name}</span>}
                      {l.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{l.location}</span>}
                      <span>{l.date}</span>
                      {l.filled_by && <span>· {l.filled_by}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Udfyldt</div>
                      <div className="text-lg font-bold text-slate-900">{rate}%</div>
                    </div>
                    <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${rate === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${rate}%` }} />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEdit(l)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(l)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Rediger tjekliste' : 'Ny sikkerhedscheckliste'}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Titel *</Label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="f.eks. Ugentlig pladsgennemgang" />
              </div>
              <div className="space-y-1.5">
                <Label>Projekt</Label>
                <Select value={form.project_id || 'none'} onValueChange={(v) => setForm({ ...form, project_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Intet projekt —</SelectItem>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Lokation</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Adresse / byggeplads" />
              </div>
              <div className="space-y-1.5">
                <Label>Dato *</Label>
                <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Udfyldt af</Label>
                <Input value={form.filled_by} onChange={(e) => setForm({ ...form, filled_by: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tjekpunkter</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-3.5 h-3.5" /> Tilføj punkt</Button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={(v) => updateItem(idx, 'checked', !!v)}
                      className="mt-1"
                    />
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      placeholder="Beskrivelse af tjekpunkt"
                      className="flex-1 bg-white"
                    />
                    <Input
                      value={item.notes}
                      onChange={(e) => updateItem(idx, 'notes', e.target.value)}
                      placeholder="Bemærkning"
                      className="flex-1 bg-white"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Samlede noter</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuller</Button>
              <Button type="submit"><ClipboardCheck className="w-4 h-4" /> Gem tjekliste</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}