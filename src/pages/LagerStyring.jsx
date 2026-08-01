import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDKK } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Warehouse, Plus, Pencil, Trash2, AlertTriangle, Package } from 'lucide-react';

const CATEGORIES = ['Beton', 'Asfalt', 'Kloak', 'Jord', 'Sten', 'Metal', 'Træ', 'Andet'];
const empty = { name: '', category: 'Andet', stock_quantity: 0, min_stock_level: 0, unit: 'stk', unit_price: 0, location: '', supplier_name: '', notes: '' };

export default function LagerStyring() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => { try { setItems(await base44.entities.InventoryItem.list()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (it) => { setEditing(it); setForm({ ...empty, ...it }); setDialogOpen(true); };
  const save = async () => { if (editing) await base44.entities.InventoryItem.update(editing.id, form); else await base44.entities.InventoryItem.create(form); setDialogOpen(false); load(); };
  const remove = async (id) => { if (!confirm('Slet materiale?')) return; await base44.entities.InventoryItem.delete(id); load(); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  const lowStock = items.filter((i) => (i.stock_quantity || 0) <= (i.min_stock_level || 0));
  const totalValue = items.reduce((s, i) => s + (Number(i.stock_quantity) || 0) * (Number(i.unit_price) || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Lagerstyring</h1><p className="text-sm text-slate-500 mt-1">Beholdning af byggematerialer med advarsler om lav lagerstatus</p></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Tilføj materiale</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Package className="w-4 h-4" /> Materialer</div><div className="text-2xl font-bold text-slate-900">{items.length}</div></div>
        <div className={`bg-white rounded-xl border p-5 ${lowStock.length > 0 ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><AlertTriangle className="w-4 h-4" /> Lav lagerstatus</div><div className="text-2xl font-bold text-slate-900">{lowStock.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Warehouse className="w-4 h-4" /> Lagerværdi</div><div className="text-2xl font-bold text-slate-900">{formatDKK(totalValue)}</div></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Materiale</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium text-right">Beholdning</th>
              <th className="px-4 py-3 font-medium text-right">Min.</th>
              <th className="px-4 py-3 font-medium text-right">Stk. pris</th>
              <th className="px-4 py-3 font-medium">Lokation</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((it) => {
              const low = (it.stock_quantity || 0) <= (it.min_stock_level || 0);
              return (
                <tr key={it.id} className={low ? 'bg-amber-50' : ''}>
                  <td className="px-4 py-3 font-medium text-slate-900">{it.name}{low && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline ml-2" />}</td>
                  <td className="px-4 py-3 text-slate-500">{it.category}</td>
                  <td className={`px-4 py-3 text-right font-medium ${low ? 'text-amber-700' : 'text-slate-700'}`}>{it.stock_quantity} {it.unit}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{it.min_stock_level}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatDKK(it.unit_price || 0)}</td>
                  <td className="px-4 py-3 text-slate-500">{it.location || '—'}</td>
                  <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1"><button onClick={() => openEdit(it)} className="text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button><button onClick={() => remove(it.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && <div className="text-center py-12 text-slate-400"><Package className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>Ingen materialer registreret</p></div>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger materiale' : 'Tilføj materiale'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Navn *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div><Label>Kategori</Label><Select value={form.category} onValueChange={(v) => set('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Beholdning</Label><Input type="number" value={form.stock_quantity} onChange={(e) => set('stock_quantity', Number(e.target.value))} /></div>
            <div><Label>Min. beholdning</Label><Input type="number" value={form.min_stock_level} onChange={(e) => set('min_stock_level', Number(e.target.value))} /></div>
            <div><Label>Enhed</Label><Input value={form.unit} onChange={(e) => set('unit', e.target.value)} /></div>
            <div><Label>Stk. pris (DKK)</Label><Input type="number" value={form.unit_price} onChange={(e) => set('unit_price', Number(e.target.value))} /></div>
            <div><Label>Lagerplads</Label><Input value={form.location} onChange={(e) => set('location', e.target.value)} /></div>
            <div><Label>Leverandør</Label><Input value={form.supplier_name} onChange={(e) => set('supplier_name', e.target.value)} /></div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={!form.name}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}