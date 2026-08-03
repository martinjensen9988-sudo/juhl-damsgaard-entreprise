import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ShoppingCart, Send, CheckCircle2 } from 'lucide-react';
import { formatDate, formatDKK } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

const PRIORITIES = ['Lav', 'Normal', 'Høj'];
const STATUSES = ['Mangler', 'Bestilt', 'Leveret'];
const PRIO_BADGE = { Lav: 'bg-slate-100 text-slate-600', Normal: 'bg-blue-100 text-blue-700', Høj: 'bg-red-100 text-red-700' };
const STATUS_BADGE = { Mangler: 'bg-amber-100 text-amber-700', Bestilt: 'bg-blue-100 text-blue-700', Leveret: 'bg-emerald-100 text-emerald-700' };

const EMPTY = { material_name: '', quantity: '', unit: 'stk', project_id: '', project_name: '', status: 'Mangler', priority: 'Normal', estimated_price: '', needed_by_date: '', notes: '' };

export default function Indkoebskurv() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [m, p, s] = await Promise.all([base44.entities.MaterialNeed.list('-created_date', 200), base44.entities.Project.list('-created_date', 100), base44.entities.Supplier.list('-created_date', 100)]);
      setItems(m || []); setProjects(p || []); setSuppliers(s || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const openNew = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (i) => { setForm({ ...EMPTY, ...i, quantity: i.quantity ?? '', estimated_price: i.estimated_price ?? '' }); setEditing(i); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const proj = projects.find((p) => p.id === form.project_id);
      const payload = { ...form, quantity: Number(form.quantity) || 0, estimated_price: Number(form.estimated_price) || 0, project_name: proj?.name || '' };
      if (editing) { await base44.entities.MaterialNeed.update(editing.id, payload); } else { await base44.entities.MaterialNeed.create(payload); }
      setDialogOpen(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const remove = async (id) => { if (!confirm('Fjern fra indkøbskurv?')) return; await base44.entities.MaterialNeed.delete(id); load(); };

  const updateStatus = async (id, status) => { await base44.entities.MaterialNeed.update(id, { status }); load(); };

  const cart = items.filter((i) => i.status === 'Mangler');
  const ordered = items.filter((i) => i.status === 'Bestilt');
  const delivered = items.filter((i) => i.status === 'Leveret');
  const cartTotal = cart.reduce((s, i) => s + (Number(i.estimated_price) || 0) * (Number(i.quantity) || 0), 0);

  const approveAll = async () => {
    if (!cart.length) return;
    for (const item of cart) { await base44.entities.MaterialNeed.update(item.id, { status: 'Bestilt' }); }
    toast({ title: 'Indkøbskurv godkendt', description: `${cart.length} materialer bestilt` });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-rose-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Indkøbskurv</h1><p className="text-slate-500 mt-0.5">Saml materialer til bestilling før de godkendes som udgifter</p></div>
        </div>
        <div className="flex gap-2">
          {cart.length > 0 && <Button onClick={approveAll} className="bg-emerald-600 hover:bg-emerald-700"><Send className="w-4 h-4 mr-1.5" /> Godkend kurv ({cart.length})</Button>}
          <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Tilføj materiale</Button>
        </div>
      </div>

      {cart.length > 0 && <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between"><div className="flex items-center gap-2 text-rose-700"><ShoppingCart className="w-5 h-5" /><span className="font-medium">{cart.length} materialer i kurv</span></div><div className="text-lg font-bold text-rose-900">{formatDKK(cartTotal)}</div></div>}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Indkøbskurven er tom.</p></div>
      ) : (
        <div className="space-y-4">
          {[
            { label: 'I kurv (til godkendelse)', list: cart, color: 'rose' },
            { label: 'Bestilt', list: ordered, color: 'blue' },
            { label: 'Leveret', list: delivered, color: 'emerald' },
          ].filter((g) => g.list.length > 0).map((g) => (
            <div key={g.label}>
              <h2 className="text-sm font-semibold text-slate-700 mb-2">{g.label} ({g.list.length})</h2>
              <div className="space-y-2">
                {g.list.map((i) => (
                  <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900">{i.material_name}</div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{i.quantity} {i.unit}</span>
                        {i.project_name && <span>• {i.project_name}</span>}
                        {i.estimated_price > 0 && <span>• {formatDKK(i.estimated_price * i.quantity)}</span>}
                        {i.needed_by_date && <span>• senest {formatDate(i.needed_by_date)}</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${PRIO_BADGE[i.priority]}`}>{i.priority}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[i.status]}`}>{i.status}</span>
                    {i.status === 'Mangler' && <Button variant="outline" size="sm" onClick={() => updateStatus(i.id, 'Bestilt')}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Godkend</Button>}
                    {i.status === 'Bestilt' && <Button variant="outline" size="sm" onClick={() => updateStatus(i.id, 'Leveret')}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Leveret</Button>}
                    <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4 text-slate-500" /></Button><Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger materiale' : 'Tilføj til indkøbskurv'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Material *</Label><Input value={form.material_name} onChange={set('material_name')} /></div>
            <div className="space-y-1.5"><Label>Antal *</Label><Input type="number" value={form.quantity} onChange={set('quantity')} /></div>
            <div className="space-y-1.5"><Label>Enhed</Label><Input value={form.unit} onChange={set('unit')} placeholder="stk, m, m², ton..." /></div>
            <div className="col-span-2 space-y-1.5"><Label>Projekt</Label><Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Estimeret pris (DKK)</Label><Input type="number" value={form.estimated_price} onChange={set('estimated_price')} /></div>
            <div className="space-y-1.5"><Label>Behøves senest</Label><Input type="date" value={form.needed_by_date || ''} onChange={set('needed_by_date')} /></div>
            <div className="space-y-1.5"><Label>Prioritet</Label><Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Noter</Label><Textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="F.eks. leverandør, specifikationer..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving || !form.material_name || !form.quantity}>{saving ? 'Gemmer...' : 'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}