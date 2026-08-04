import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Package, Plus, Search, AlertTriangle, TrendingDown, Wallet, Edit, Trash2 } from 'lucide-react';

const CATEGORIES = ['Beton', 'Asfalt', 'Kloak', 'Jord', 'Sten', 'Metal', 'Træ', 'Andet'];

const fmt = (n) => (Number(n) || 0).toLocaleString('da-DK');

export default function Materialelager() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());

  function emptyForm() {
    return { name: '', category: 'Andet', stock_quantity: 0, min_stock_level: 0, unit: 'stk', unit_price: 0, location: '', supplier_name: '', notes: '' };
  }

  const load = async () => {
    setLoading(true);
    try {
      const [inv, mat] = await Promise.all([
        base44.entities.InventoryItem.list('-created_date', 500),
        base44.entities.Material.list('-created_date', 500),
      ]);
      setInventory(inv);
      setMaterials(mat);
    } catch (e) {
      console.error(e);
      toast({ title: 'Fejl', description: 'Kunne ikke hente lagerdata', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter((i) => {
      if (catFilter !== 'all' && i.category !== catFilter) return false;
      if (search && !i.name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [inventory, search, catFilter]);

  const stockStatus = (item) => {
    const stock = Number(item.stock_quantity) || 0;
    const min = Number(item.min_stock_level) || 0;
    if (min <= 0) return { label: 'OK', color: 'bg-emerald-100 text-emerald-700' };
    if (stock <= 0) return { label: 'Tomt', color: 'bg-red-100 text-red-700' };
    if (stock <= min) return { label: 'Lav', color: 'bg-amber-100 text-amber-700' };
    if (stock <= min * 1.5) return { label: 'Lav', color: 'bg-amber-100 text-amber-700' };
    return { label: 'OK', color: 'bg-emerald-100 text-emerald-700' };
  };

  const inventoryValue = inventory.reduce((s, i) => s + (Number(i.stock_quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const lowStockCount = inventory.filter((i) => stockStatus(i).label !== 'OK').length;

  // Usage grouped by project
  const usageByProject = useMemo(() => {
    const map = {};
    materials.forEach((m) => {
      const key = m.project_id || m.project_name || 'Uden projekt';
      if (!map[key]) map[key] = { name: m.project_name || 'Uden projekt', items: [], total: 0 };
      map[key].items.push(m);
      map[key].total += (Number(m.quantity) || 0) * (Number(m.unit_price) || 0);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [materials]);

  // Usage grouped by material name
  const usageByMaterial = useMemo(() => {
    const map = {};
    materials.forEach((m) => {
      const key = m.name || 'Ukendt';
      if (!map[key]) map[key] = { name: key, category: m.category, quantity: 0, projects: new Set(), total: 0 };
      map[key].quantity += Number(m.quantity) || 0;
      map[key].projects.add(m.project_id || m.project_name);
      map[key].total += (Number(m.quantity) || 0) * (Number(m.unit_price) || 0);
    });
    return Object.values(map).map((m) => ({ ...m, projectCount: m.projects.size })).sort((a, b) => b.quantity - a.quantity);
  }, [materials]);

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...emptyForm(), ...item }); setDialogOpen(true); };

  const save = async () => {
    try {
      if (editing) {
        await base44.entities.InventoryItem.update(editing.id, form);
        toast({ title: 'Opdateret', description: form.name });
      } else {
        await base44.entities.InventoryItem.create(form);
        toast({ title: 'Tilføjet', description: form.name });
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      toast({ title: 'Fejl ved lagring', variant: 'destructive' });
    }
  };

  const remove = async (item) => {
    if (!confirm(`Slet "${item.name}" fra lager?`)) return;
    try {
      await base44.entities.InventoryItem.delete(item.id);
      toast({ title: 'Slettet' });
      load();
    } catch (e) {
      toast({ title: 'Fejl ved sletning', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-amber-500" /> Materialelager
          </h1>
          <p className="text-slate-500 mt-1">Overblik over lagerstatus og materialeforbrug på tværs af projekter</p>
        </div>
        <Button onClick={openAdd} className="bg-amber-500 hover:bg-amber-600 text-white"><Plus className="w-4 h-4" /> Tilføj materiale</Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Package} label="Materialer på lager" value={inventory.length} color="text-slate-700" />
        <Kpi icon={Wallet} label="Lagerværdi (DKK)" value={fmt(Math.round(inventoryValue))} color="text-emerald-600" />
        <Kpi icon={AlertTriangle} label="Lav/tom beholdning" value={lowStockCount} color="text-amber-600" />
        <Kpi icon={TrendingDown} label="Projekter med forbrug" value={usageByProject.length} color="text-blue-600" />
      </div>

      <Tabs defaultValue="lager">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="lager">Lagerstatus</TabsTrigger>
          <TabsTrigger value="forbrug">Forbrugshistorik</TabsTrigger>
        </TabsList>

        {/* LAGERSTATUS */}
        <TabsContent value="lager" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Søg materiale..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white" />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="sm:w-56 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kategorier</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
          ) : filteredInventory.length === 0 ? (
            <Empty text="Ingen materialer fundet" />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Materiale</th>
                      <th className="text-left px-4 py-3 font-semibold">Kategori</th>
                      <th className="text-right px-4 py-3 font-semibold">Beholdning</th>
                      <th className="text-right px-4 py-3 font-semibold">Min.</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 font-semibold">Lagerplads</th>
                      <th className="text-right px-4 py-3 font-semibold">Værdi (DKK)</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.map((item) => {
                      const st = stockStatus(item);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                          <td className="px-4 py-3 text-slate-500">{item.category}</td>
                          <td className="px-4 py-3 text-right font-semibold">{fmt(item.stock_quantity)} {item.unit}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{fmt(item.min_stock_level)}</td>
                          <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>{st.label}</span></td>
                          <td className="px-4 py-3 text-slate-500">{item.location || '—'}</td>
                          <td className="px-4 py-3 text-right">{fmt(Math.round((Number(item.stock_quantity) || 0) * (Number(item.unit_price) || 0)))}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => remove(item)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* FORBRUGSHISTORIK */}
        <TabsContent value="forbrug" className="space-y-6">
          {/* By project */}
          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Forbrug pr. projekt</h2>
            {loading ? <Spinner /> : usageByProject.length === 0 ? <Empty text="Ingen materialeforbrug registreret" /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {usageByProject.map((p) => (
                  <div key={p.name + Math.random()} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 truncate">{p.name}</h3>
                      <span className="text-sm font-bold text-amber-600">{fmt(Math.round(p.total))} DKK</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {p.items.map((m, i) => (
                        <div key={i} className="flex items-center justify-between text-sm border-b border-slate-50 pb-1">
                          <span className="text-slate-700 truncate">{m.name} <span className="text-slate-400">({m.category})</span></span>
                          <span className="text-slate-500 whitespace-nowrap">{fmt(m.quantity)} {m.unit}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">{p.items.length} materialelinjer</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By material */}
          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Mest forbrugte materialer</h2>
            {loading ? <Spinner /> : usageByMaterial.length === 0 ? <Empty text="Intet forbrug registreret" /> : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Materiale</th>
                      <th className="text-left px-4 py-3 font-semibold">Kategori</th>
                      <th className="text-right px-4 py-3 font-semibold">Samlet forbrug</th>
                      <th className="text-right px-4 py-3 font-semibold">Projekter</th>
                      <th className="text-right px-4 py-3 font-semibold">Værdi (DKK)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usageByMaterial.slice(0, 20).map((m) => (
                      <tr key={m.name} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                        <td className="px-4 py-3 text-slate-500">{m.category || '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold">{fmt(m.quantity)}</td>
                        <td className="px-4 py-3 text-right">{m.projectCount}</td>
                        <td className="px-4 py-3 text-right">{fmt(Math.round(m.total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Rediger materiale' : 'Tilføj materiale'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Materialnavn *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Enhed</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div>
              <Label>Beholdning</Label>
              <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Min. beholdning</Label>
              <Input type="number" value={form.min_stock_level} onChange={(e) => setForm({ ...form, min_stock_level: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Stk. pris (DKK)</Label>
              <Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Lagerplads</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Leverandør</Label>
              <Input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Noter</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={!form.name} className="bg-amber-500 hover:bg-amber-600 text-white">Gem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase"><Icon className="w-4 h-4" /> {label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">{text}</div>;
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>;
}