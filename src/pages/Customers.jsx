import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Users, Mail, Phone, MapPin, Clock } from 'lucide-react';

const EMPTY = {
  name: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  postal_code: '',
  city: '',
  cvr: '',
  payment_terms: '15 dage netto',
  notes: '',
};

const PAYMENT_TERMS = ['8 dage netto', '15 dage netto', '30 dage netto', '45 dage netto', '60 dage netto', 'Kontant', 'Forudbetaling'];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Customer.list('-created_date', 100);
      setCustomers(data);
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

  const openEdit = (c) => {
    setForm({ ...EMPTY, ...c });
    setEditing(c);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Customer.update(editing.id, form);
      } else {
        await base44.entities.Customer.create(form);
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
    if (!confirm('Slet denne kunde?')) return;
    await base44.entities.Customer.delete(id);
    load();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Kunder</h1>
          <p className="text-slate-500 mt-1">Styr dine kundeoplysninger</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Ny kunde
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen kunder endnu. Opret din første kunde.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{c.company || c.name}</div>
                  {c.company && <div className="text-sm text-slate-500">{c.name}</div>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-slate-600">
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone}
                  </div>
                )}
                {(c.address || c.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">
                      {[c.address, [c.postal_code, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                {c.cvr && <div className="text-xs text-slate-400">CVR: {c.cvr}</div>}
                {c.payment_terms && (
                  <div className="flex items-center gap-2 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">{c.payment_terms}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger kunde' : 'Ny kunde'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label>Kontaktperson *</Label>
              <Input value={form.name} onChange={set('name')} placeholder="Navn" />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label>Virksomhed</Label>
              <Input value={form.company} onChange={set('company')} placeholder="Virksomhedsnavn" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={set('email')} placeholder="email@eksempel.dk" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={set('phone')} placeholder="12 34 56 78" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Adresse</Label>
              <Input value={form.address} onChange={set('address')} placeholder="Vejnavn 1" />
            </div>
            <div className="space-y-1.5">
              <Label>Postnummer</Label>
              <Input value={form.postal_code} onChange={set('postal_code')} placeholder="2100" />
            </div>
            <div className="space-y-1.5">
              <Label>By</Label>
              <Input value={form.city} onChange={set('city')} placeholder="København" />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label>CVR-nr.</Label>
              <Input value={form.cvr} onChange={set('cvr')} placeholder="12345678" />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <Label>Betalingsbetingelser</Label>
              <Select value={form.payment_terms} onValueChange={(v) => setForm({ ...form, payment_terms: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Noter</Label>
              <Textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Evt. noter om kunden" />
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