import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

const STATUS = { Kladde: 'bg-slate-100 text-slate-600', Bestilt: 'bg-blue-100 text-blue-700', Modtaget: 'bg-emerald-100 text-emerald-700', Annulleret: 'bg-red-100 text-red-700' };

const empty = { order_number: '', supplier_name: '', project_id: '', project_name: '', status: 'Kladde', order_date: new Date().toISOString().slice(0, 10), expected_date: '', items: [], notes: '' };

export default function IndkoebsStyring() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    const [o, p, s] = await Promise.all([
      base44.entities.PurchaseOrder.list('-order_date', 200).catch(() => []),
      base44.entities.Project.list('-created_date', 100).catch(() => []),
      base44.entities.Supplier.list('-created_date', 100).catch(() => []),
    ]);
    setItems(o || []); setProjects(p || []); setSuppliers(s || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    const num = `PO-${new Date().getFullYear()}-${String(items.length + 1).padStart(4, '0')}`;
    setForm({ ...empty, order_number: num });
    setOpen(true);
  };
  const openEdit = (it) => { setEditing(it); setForm({ ...empty, ...it, items: it.items || [] }); setOpen(true); };

  const setItem = (idx, key, val) => setForm((f) => {
    const items = [...(f.items || [])];
    items[idx] = { ...items[idx], [key]: val };
    return { ...f, items };
  });
  const addItem = () => setForm((f) => ({ ...f, items: [...(f.items || []), { name: '', quantity: 1, unit: 'stk', unit_price: 0 }] }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: (f.items || []).filter((_, i) => i !== idx) }));

  const save = async () => {
    if (!form.order_number) { alert('Indtast ordrenr.'); return; }
    const payload = { ...form, items: (form.items || []).map((i) => ({ ...i, quantity: Number(i.quantity) || 0, unit_price: Number(i.unit_price) || 0 })) };
    if (editing) await base44.entities.PurchaseOrder.update(editing.id, payload);
    else await base44.entities.PurchaseOrder.create(payload);
    setOpen(false); load();
  };
  const remove = async (id) => { if (confirm('Slet ordre?')) { await base44.entities.PurchaseOrder.delete(id); load(); } };

  const total = (it) => (it.items || []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Materiale Indkøb</h1>
          <p className="text-sm text-muted-foreground">Opret og spor indkøbsordrer – godkend før de faktureres.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Ny ordre</Button>
      </div>

      <div className="grid gap-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Ingen indkøbsordrer.</p>}
        {items.map((it) => (
          <div key={it.id} className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Package className="w-5 h-5 text-slate-500" /></div>
                <div>
                  <div className="font-semibold">{it.order_number} • {it.supplier_name || '—'}</div>
                  <div className="text-xs text-muted-foreground">{it.project_name || '—'} • Bestilt: {it.order_date}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS[it.status]}`}>{it.status}</span>
                <span className="text-sm font-medium">{total(it).toLocaleString('da-DK')} DKK</span>
                <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
            {(it.items && it.items.length > 0) && (
              <div className="text-xs text-muted-foreground">{it.items.map((i) => `${i.quantity} ${i.unit} ${i.name}`).join(' • ')}</div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Rediger ordre' : 'Ny indkøbsordre'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Ordrenr.</Label><Input value={form.order_number} onChange={(e) => setForm((f) => ({ ...f, order_number: e.target.value }))} /></div>
            <div><Label>Leverandør</Label><Select value={form.supplier_name} onValueChange={(v) => setForm((f) => ({ ...f, supplier_name: v }))}><SelectTrigger><SelectValue placeholder="Vælg leverandør" /></SelectTrigger><SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Projekt</Label><Select value={form.project_name} onValueChange={(v) => setForm((f) => ({ ...f, project_name: v }))}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(STATUS).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Ordredato</Label><Input type="date" value={form.order_date} onChange={(e) => setForm((f) => ({ ...f, order_date: e.target.value }))} /></div>
            <div><Label>Forventet levering</Label><Input type="date" value={form.expected_date} onChange={(e) => setForm((f) => ({ ...f, expected_date: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Linjer</Label>
                <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-4 h-4" /> Tilføj linje</Button>
              </div>
              <div className="space-y-2">
                {(form.items || []).map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-5" placeholder="Beskrivelse" value={it.name || ''} onChange={(e) => setItem(idx, 'name', e.target.value)} />
                    <Input className="col-span-2" type="number" placeholder="Antal" value={it.quantity || ''} onChange={(e) => setItem(idx, 'quantity', e.target.value)} />
                    <Input className="col-span-2" placeholder="Enhed" value={it.unit || ''} onChange={(e) => setItem(idx, 'unit', e.target.value)} />
                    <Input className="col-span-2" type="number" placeholder="Stk. pris" value={it.unit_price || ''} onChange={(e) => setItem(idx, 'unit_price', e.target.value)} />
                    <Button size="icon" variant="ghost" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                {(form.items || []).length === 0 && <p className="text-xs text-muted-foreground">Ingen linjer endnu.</p>}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}