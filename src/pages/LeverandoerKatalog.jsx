import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Store, Plus, Pencil, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';

const CATS = ['Byggematerialer', 'Maskiner', 'Transport', 'Værktøj', 'Andet'];
const empty = { name: '', contact_person: '', email: '', phone: '', address: '', postal_code: '', city: '', cvr: '', category: 'Byggematerialer', notes: '' };

export default function LeverandoerKatalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState('Alle');

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await base44.entities.Supplier.list('-created_date', 300)) || []); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEdit(null); setForm(empty); setOpen(true); };
  const openEdit = (s) => { setEdit(s); setForm({ ...empty, ...s }); setOpen(true); };
  const save = async () => {
    if (!form.name) { alert('Virksomhedsnavn kræves'); return; }
    if (edit) await base44.entities.Supplier.update(edit.id, form);
    else await base44.entities.Supplier.create(form);
    setOpen(false); load();
  };
  const del = async (s) => { if (confirm(`Slet ${s.name}?`)) { await base44.entities.Supplier.delete(s.id); load(); } };

  const filtered = filter === 'Alle' ? items : items.filter((i) => i.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><Store className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Leverandør Katalog</h1>
            <p className="text-slate-500">Faste leverandører, kontaktdata, produktkategorier og portaler</p>
          </div>
        </div>
        <Button onClick={openNew} className="bg-slate-950"><Plus className="w-4 h-4" /> Tilføj</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['Alle', ...CATS].map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === c ? 'bg-slate-950 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><Store className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen leverandører.</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div><div className="font-semibold text-slate-900">{s.name}</div><div className="text-xs text-slate-500">{s.category}</div></div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                  <button onClick={() => del(s)} className="p-1.5 rounded hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                {s.contact_person && <div><span className="text-slate-400">Kontakt: </span>{s.contact_person}</div>}
                {s.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{s.phone}</div>}
                {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 text-blue-600 truncate"><Mail className="w-3.5 h-3.5" />{s.email}</a>}
                {(s.address || s.city) && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{[s.address, s.postal_code && s.postal_code + ' ' + s.city].filter(Boolean).join(', ')}</div>}
                {s.cvr && <div className="text-xs text-slate-400">CVR {s.cvr}</div>}
              </div>
              {s.notes && <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 line-clamp-3">{s.notes}</div>}
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{edit ? 'Rediger leverandør' : 'Ny leverandør'}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Virksomhed *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">Kontaktperson</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Adresse</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Postnr.</Label><Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
              <div><Label className="text-xs">By</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">CVR</Label><Input value={form.cvr} onChange={(e) => setForm({ ...form, cvr: e.target.value })} /></div>
              <div><Label className="text-xs">Kategori</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-xs">Produkter / noter</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save} className="bg-slate-950">Gem</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}