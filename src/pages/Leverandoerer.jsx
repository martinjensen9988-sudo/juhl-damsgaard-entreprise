import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Truck, Mail, Phone, MapPin } from 'lucide-react';

const CATEGORIES = ['Byggematerialer', 'Maskiner', 'Transport', 'Værktøj', 'Andet'];

const EMPTY = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  postal_code: '',
  city: '',
  cvr: '',
  category: 'Byggematerialer',
  notes: '',
};

export default function Leverandoerer() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Supplier.list('-created_date', 200);
      setSuppliers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = filterCat === 'all'
    ? suppliers
    : suppliers.filter((s) => s.category === filterCat);

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
      if (editing) {
        await base44.entities.Supplier.update(editing.id, form);
      } else {
        await base44.entities.Supplier.create(form);
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
    if (!confirm('Slet denne leverandør?')) return;
    await base44.entities.Supplier.delete(id);
    load();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Leverandører</h1>
          <p className="text-slate-500 mt-1">Register over alle virksomhedens leverandører</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Ny leverandør
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm text-slate-600">Filtrer kategori:</Label>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen leverandører fundet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{s.name}</div>
                  {s.contact_person && <div className="text-sm text-slate-500">{s.contact_person}</div>}
                </div>
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 whitespace-nowrap">
                  {s.category}
                </span>
              </div>
              <div className="space-y-1.5 text-sm text-slate-600">
                {s.email && (
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {s.email}</div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone}</div>
                )}
                {(s.address || s.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{[s.address, [s.postal_code, s.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {s.cvr && <div className="text-xs text-slate-400 pt-1">CVR: {s.cvr}</div>}
              </div>
              <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-slate-100">
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                  <Pencil className="w-4 h-4 text-slate-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger leverandør' : 'Ny leverandør'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Virksomhed *</Label>
              <Input value={form.name} onChange={set('name')} placeholder="Leverandørnavn" />
            </div>
            <div className="space-y-1.5">
              <Label>Kontaktperson</Label>
              <Input value={form.contact_person} onChange={set('contact_person')} />
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
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={set('phone')} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Adresse</Label>
              <Input value={form.address} onChange={set('address')} />
            </div>
            <div className="space-y-1.5">
              <Label>Postnummer</Label>
              <Input value={form.postal_code} onChange={set('postal_code')} />
            </div>
            <div className="space-y-1.5">
              <Label>By</Label>
              <Input value={form.city} onChange={set('city')} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>CVR-nr.</Label>
              <Input value={form.cvr} onChange={set('cvr')} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Noter</Label>
              <Textarea value={form.notes || ''} onChange={set('notes')} rows={2} />
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