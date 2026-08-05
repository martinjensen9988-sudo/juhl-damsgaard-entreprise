import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Link } from 'react-router-dom';
import { formatDKK, calcLineTotal } from '@/lib/format';
import { Plus, Pencil, Trash2, Package, CheckCircle2, Circle, Warehouse, ArrowRight } from 'lucide-react';

const CATEGORIES = ['Beton', 'Asfalt', 'Kloak', 'Jord', 'Sten', 'Metal', 'Træ', 'Andet'];

const EMPTY = {
  project_id: '',
  project_name: '',
  name: '',
  category: 'Andet',
  quantity: 1,
  unit: 'stk',
  unit_price: 0,
  supplier_id: '',
  supplier_name: '',
  ordered: false,
};

export default function Materialeliste() {
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [m, p, s] = await Promise.all([
        base44.entities.Material.list('-created_date', 200),
        base44.entities.Project.list('-created_date', 200),
        base44.entities.Supplier.list('-created_date', 200),
      ]);
      setMaterials(m);
      setProjects(p);
      setSuppliers(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = materials.filter((m) => {
    if (filterProject !== 'all' && m.project_id !== filterProject) return false;
    if (filterCategory !== 'all' && m.category !== filterCategory) return false;
    return true;
  });

  const totalValue = filtered.reduce((sum, m) => sum + calcLineTotal(m), 0);

  const openNew = () => {
    setForm(EMPTY);
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (m) => {
    setForm({ ...EMPTY, ...m });
    setEditing(m);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const project = projects.find((p) => p.id === form.project_id);
      const supplier = suppliers.find((s) => s.id === form.supplier_id);
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 0,
        unit_price: Number(form.unit_price) || 0,
        project_name: project ? project.name : '',
        supplier_name: supplier ? supplier.name : '',
      };
      if (editing) {
        await base44.entities.Material.update(editing.id, payload);
      } else {
        await base44.entities.Material.create(payload);
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
    if (!confirm('Slet dette materiale?')) return;
    await base44.entities.Material.delete(id);
    load();
  };

  const toggleOrdered = async (m) => {
    await base44.entities.Material.update(m.id, { ordered: !m.ordered });
    load();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Materialeliste</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Administrer materialer per projekt</p>
        </div>
        <div className="flex gap-2">
          <Link to="/lager-overblik">
            <Button variant="outline">
              <Warehouse className="w-4 h-4 mr-1.5" /> Lagerbeholdning <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
          <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-1.5" /> Tilføj materiale
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
        <Warehouse className="w-4 h-4 text-amber-600 shrink-0" />
        <span><strong>Lagerbeholdning & min. lager:</strong> Registrer varer med beholdning, stk. pris og minimumsniveau på</span>
        <Link to="/lager-overblik" className="font-medium text-amber-900 underline hover:text-amber-700">Lageroverblik-siden →</Link>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm text-slate-600 dark:text-slate-300">Projekt:</Label>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle projekter</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Label className="text-sm text-slate-600 dark:text-slate-300">Kategori:</Label>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
          Total værdi: <span className="font-bold text-slate-900 dark:text-slate-100">{formatDKK(totalValue)}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 py-16 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Ingen materialer fundet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm mobile-cards">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3">Materiale</th>
                  <th className="px-4 py-3">Projekt</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Antal</th>
                  <th className="px-4 py-3 text-right">Stk. pris</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Leverandør</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100" data-label="Materiale">{m.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300" data-label="Projekt">{m.project_name || '—'}</td>
                    <td className="px-4 py-3" data-label="Kategori">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{m.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300" data-label="Antal">{m.quantity} {m.unit}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300" data-label="Stk. pris">{formatDKK(m.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100" data-label="Total">{formatDKK(calcLineTotal(m))}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300" data-label="Leverandør">{m.supplier_name || '—'}</td>
                    <td className="px-4 py-3" data-label="Status">
                      <button onClick={() => toggleOrdered(m)} className="flex items-center gap-1 text-xs">
                        {m.ordered ? (
                          <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-600">Bestilt</span></>
                        ) : (
                          <><Circle className="w-4 h-4 text-slate-300" /> <span className="text-slate-400 dark:text-slate-500">Ikke bestilt</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3" data-label="Handlinger">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                          <Pencil className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(m.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger materiale' : 'Tilføj materiale'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Materialenavn *</Label>
              <Input value={form.name} onChange={set('name')} placeholder="F.eks. Kloakrør Ø300" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Projekt</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
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
              <Label>Leverandør</Label>
              <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg leverandør" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Antal</Label>
              <Input type="number" value={form.quantity} onChange={set('quantity')} />
            </div>
            <div className="space-y-1.5">
              <Label>Enhed</Label>
              <Input value={form.unit} onChange={set('unit')} placeholder="stk, m, m²" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Stk. pris (DKK)</Label>
              <Input type="number" value={form.unit_price} onChange={set('unit_price')} />
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