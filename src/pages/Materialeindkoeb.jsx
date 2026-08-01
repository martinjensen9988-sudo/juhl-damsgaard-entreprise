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
import { formatDKK, formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, ShoppingCart, Package } from 'lucide-react';

const STATUSES = ['Kladde', 'Bestilt', 'Modtaget', 'Annulleret'];
const STATUS_BADGE = {
  'Kladde': 'bg-slate-100 text-slate-600', 'Bestilt': 'bg-blue-100 text-blue-700',
  'Modtaget': 'bg-emerald-100 text-emerald-700', 'Annulleret': 'bg-red-100 text-red-700',
};

const genOrderNumber = (existing) => {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;
  const nums = existing.filter((o) => o.order_number?.startsWith(prefix)).map((o) => parseInt(o.order_number.replace(prefix, ''), 10)).filter((n) => !isNaN(n));
  return `${prefix}${String((nums.length > 0 ? Math.max(...nums) : 0) + 1).padStart(4, '0')}`;
};

const EMPTY = { supplier_id: '', project_id: '', status: 'Kladde', items: [{ name: '', quantity: 1, unit: 'stk', unit_price: 0 }], order_date: new Date().toISOString().slice(0, 10), expected_date: '', notes: '' };

export default function Materialeindkoeb() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [o, s, p] = await Promise.all([
        base44.entities.PurchaseOrder.list('-created_date', 200),
        base44.entities.Supplier.list('-created_date', 200),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setOrders(o); setSuppliers(s); setProjects(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ ...EMPTY, order_number: genOrderNumber(orders) }); setEditing(null); setDialogOpen(true); };
  const openEdit = (o) => { setForm({ ...EMPTY, ...o, items: o.items?.length ? o.items : [{ name: '', quantity: 1, unit: 'stk', unit_price: 0 }] }); setEditing(o); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const supplier = suppliers.find((s) => s.id === form.supplier_id);
      const project = projects.find((p) => p.id === form.project_id);
      const payload = { ...form, supplier_name: supplier?.name || '', project_name: project?.name || '' };
      if (editing) await base44.entities.PurchaseOrder.update(editing.id, payload);
      else await base44.entities.PurchaseOrder.create(payload);
      setDialogOpen(false); load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const remove = async (id) => { if (confirm('Slet denne ordre?')) { await base44.entities.PurchaseOrder.delete(id); load(); } };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: field === 'quantity' || field === 'unit_price' ? Number(value) : value };
    setForm({ ...form, items });
  };
  const addItem = () => setForm({ ...form, items: [...form.items, { name: '', quantity: 1, unit: 'stk', unit_price: 0 }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Materialeindkøb</h1>
          <p className="text-slate-500 mt-1">Indkøbsordrer til leverandører</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Ny ordre</Button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen indkøbsordrer endnu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const total = (o.items || []).reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0);
            return (
              <div key={o.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{o.order_number}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[o.status] || 'bg-slate-100'}`}>{o.status}</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">
                      {o.supplier_name || '—'} {o.project_name ? `· ${o.project_name}` : ''}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {(o.items || []).length} linjer</span>
                      {o.order_date && <span>Ordredato: {formatDate(o.order_date)}</span>}
                      {o.expected_date && <span>Levering: {formatDate(o.expected_date)}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900">{formatDKK(total)}</div>
                    <div className="flex gap-1 mt-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(o.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger ordre' : 'Ny indkøbsordre'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5"><Label>Ordrenr.</Label><Input value={form.order_number} onChange={set('order_number')} /></div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Leverandør</Label>
              <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg leverandør" /></SelectTrigger><SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Projekt</Label>
              <Select value={form.project_id || ''} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Ingen" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Ordredato</Label><Input type="date" value={form.order_date || ''} onChange={set('order_date')} /></div>
            <div className="space-y-1.5"><Label>Forventet levering</Label><Input type="date" value={form.expected_date || ''} onChange={set('expected_date')} /></div>

            <div className="col-span-2">
              <Label>Linjer</Label>
              <div className="space-y-2 mt-2">
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_70px_60px_90px_32px] gap-2 items-center">
                    <Input placeholder="Materiale" value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} />
                    <Input type="number" placeholder="Antal" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                    <Input placeholder="Enhed" value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} />
                    <Input type="number" placeholder="Pris" value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} />
                    <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Tilføj linje</Button>
              </div>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Noter</Label><Textarea value={form.notes} onChange={set('notes')} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.order_number}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}