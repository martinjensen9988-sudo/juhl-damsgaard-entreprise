import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Package, Truck, CheckCircle } from 'lucide-react';
import { formatDKK, formatDate } from '@/lib/format';

const STATUS_COLORS = {
  Kladde: 'bg-slate-100 text-slate-600',
  Bestilt: 'bg-blue-100 text-blue-700',
  Modtaget: 'bg-emerald-100 text-emerald-700',
  Annulleret: 'bg-red-100 text-red-700',
};

export default function Indkoebsordre() {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ supplier_id: '', project_id: '', expected_date: '', notes: '', items: [{ name: '', quantity: 1, unit: 'stk', unit_price: 0 }] });

  async function load() {
    setLoading(true);
    try {
      const [o, s, p] = await Promise.all([
        base44.entities.PurchaseOrder.list('-created_date', 100),
        base44.entities.Supplier.list('-created_date', 100),
        base44.entities.Project.list('-created_date', 100),
      ]);
      setOrders(o); setSuppliers(s); setProjects(p);
    } catch (e) { toast({ title: 'Fejl', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function updateItem(i, patch) {
    setForm((f) => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, ...patch } : it) }));
  }
  function addItem() { setForm((f) => ({ ...f, items: [...f.items, { name: '', quantity: 1, unit: 'stk', unit_price: 0 }] })); }
  function removeItem(i) { setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) })); }

  async function createOrder() {
    try {
      const supplier = suppliers.find((s) => s.id === form.supplier_id);
      const project = projects.find((p) => p.id === form.project_id);
      const year = new Date().getFullYear();
      const seq = (orders.length || 0) + 1;
      const orderNumber = `PO-${year}-${String(seq).padStart(4, '0')}`;
      await base44.entities.PurchaseOrder.create({
        order_number: orderNumber,
        supplier_id: form.supplier_id,
        supplier_name: supplier?.name || '',
        project_id: form.project_id,
        project_name: project?.name || '',
        status: 'Bestilt',
        order_date: new Date().toISOString().slice(0, 10),
        expected_date: form.expected_date,
        items: form.items,
        notes: form.notes,
      });
      toast({ title: 'Indkøbsordre oprettet', description: orderNumber });
      setDialogOpen(false);
      setForm({ supplier_id: '', project_id: '', expected_date: '', notes: '', items: [{ name: '', quantity: 1, unit: 'stk', unit_price: 0 }] });
      load();
    } catch (err) { toast({ title: 'Fejl', description: err.message, variant: 'destructive' }); }
  }

  async function setStatus(order, status) {
    try {
      await base44.entities.PurchaseOrder.update(order.id, { status });
      load();
    } catch (err) { toast({ title: 'Fejl', description: err.message, variant: 'destructive' }); }
  }

  function lineTotal(items) {
    return (items || []).reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
  }

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Indkøbsordrer</h1>
          <p className="text-slate-500 mt-1">Opret og administrer bestilte materialer og leveringsstatus</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Ny indkøbsordre</Button>
      </div>

      <div className="grid gap-4">
        {orders.length === 0 && <div className="text-center py-16 text-slate-400">Ingen indkøbsordrer endnu</div>}
        {orders.map((o) => (
          <Card key={o.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-slate-900">{o.order_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || ''}`}>{o.status}</span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {o.supplier_name || '—'} {o.project_name && `· ${o.project_name}`}
                  </div>
                  {o.expected_date && <div className="text-xs text-slate-400 mt-0.5"><Truck className="w-3 h-3 inline mr-1" />Forventet levering {formatDate(o.expected_date)}</div>}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{formatDKK(lineTotal(o.items))}</div>
                  <div className="text-xs text-slate-400">{(o.items || []).length} linjer</div>
                </div>
              </div>
              {(o.items || []).length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3 space-y-1">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-700">{it.name} <span className="text-slate-400">× {it.quantity} {it.unit}</span></span>
                      <span className="text-slate-600">{formatDKK((Number(it.quantity) || 0) * (Number(it.unit_price) || 0))}</span>
                    </div>
                  ))}
                </div>
              )}
              {o.status === 'Bestilt' && (
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => setStatus(o, 'Modtaget')}><CheckCircle className="w-4 h-4 mr-1 text-emerald-600" /> Markér modtaget</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Ny indkøbsordre</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Leverandør</Label>
                <Select value={form.supplier_id} onValueChange={(v) => setForm((f) => ({ ...f, supplier_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Vælg leverandør" /></SelectTrigger>
                  <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Projekt (valgfri)</Label>
                <Select value={form.project_id} onValueChange={(v) => setForm((f) => ({ ...f, project_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="— ingen —" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Forventet levering</Label>
              <Input type="date" value={form.expected_date} onChange={(e) => setForm((f) => ({ ...f, expected_date: e.target.value }))} />
            </div>
            <div>
              <Label>Materialer</Label>
              <div className="space-y-2">
                {form.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5"><Input placeholder="Beskrivelse" value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })} /></div>
                    <div className="col-span-2"><Input type="number" placeholder="Antal" value={it.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} /></div>
                    <div className="col-span-2"><Input placeholder="Enhed" value={it.unit} onChange={(e) => updateItem(i, { unit: e.target.value })} /></div>
                    <div className="col-span-2"><Input type="number" placeholder="Pris" value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: e.target.value })} /></div>
                    <div className="col-span-1"><Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-1" /> Tilføj linje</Button>
              </div>
            </div>
            <div><Label>Noter</Label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={createOrder}>Opret ordre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}