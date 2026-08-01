import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { formatDKK } from '@/lib/format';

const CATEGORIES = ['Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Transport', 'Rådgivning', 'Andet'];
const UNITS = ['stk', 'm', 'm²', 'm³', 'timer', 'dag', 'ton', 'sæt', 'løbende meter'];

const EMPTY = {
  name: '',
  category: 'Andet',
  description: '',
  unit: 'stk',
  unit_price: 0,
  min_price: 0,
  active: true,
};

export default function Servicekatalog() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Service.list('-created_date', 200);
      setServices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(EMPTY);
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setForm({ ...EMPTY, ...s });
    setEditing(s);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        unit_price: Number(form.unit_price) || 0,
        min_price: Number(form.min_price) || 0,
      };
      if (editing) {
        await base44.entities.Service.update(editing.id, payload);
      } else {
        await base44.entities.Service.create(payload);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Slet denne ydelse?')) return;
    await base44.entities.Service.delete(id);
    load();
  };

  const set = (field) => (e) => {
    const val = typeof e === 'boolean' ? e : e.target.value;
    setForm({ ...form, [field]: val });
  };

  const filtered = services.filter((s) => filterCat === 'all' || s.category === filterCat);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Servicekatalog</h1>
          <p className="text-slate-500 mt-1">Standard ydelser og prislister til brug i tilbudsgivning</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Ny ydelse
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-slate-500">{filtered.length} ydelser</div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen ydelser endnu. Opret din første ydelse.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ydelse</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Kategori</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Enhed</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pris</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{s.name}</div>
                    {s.description && <div className="text-xs text-slate-500 truncate max-w-xs">{s.description}</div>}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{s.category}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{s.unit}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="font-semibold text-slate-900">{formatDKK(s.unit_price)}</div>
                    {s.min_price > 0 && <div className="text-xs text-slate-400">min. {formatDKK(s.min_price)}</div>}
                  </td>
                  <td className="px-5 py-3 text-center hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {s.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                        <Pencil className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger ydelse' : 'Ny ydelse'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Ydelsesnavn *</Label>
              <Input value={form.name} onChange={set('name')} placeholder="F.eks. Gravearbejde pr. time" />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Enhed</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stk. pris (DKK)</Label>
              <Input type="number" value={form.unit_price} onChange={set('unit_price')} />
            </div>
            <div className="space-y-1.5">
              <Label>Min. pris (DKK)</Label>
              <Input type="number" value={form.min_price} onChange={set('min_price')} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Beskrivelse</Label>
              <Textarea value={form.description} onChange={set('description')} rows={2} placeholder="Beskrivelse af ydelsen" />
            </div>
            <div className="col-span-2 flex items-center justify-between pt-2">
              <Label>Aktiv ydelse</Label>
              <Switch checked={form.active} onCheckedChange={set('active')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.name}>
              {saving ? 'Gemmer...' : 'Gem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}