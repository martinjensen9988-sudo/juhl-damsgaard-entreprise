import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Building2, Phone, Mail } from 'lucide-react';

const CAT_COLORS = {
  Byggematerialer: 'bg-amber-100 text-amber-700',
  Maskiner: 'bg-blue-100 text-blue-700',
  Transport: 'bg-purple-100 text-purple-700',
  Værktøj: 'bg-emerald-100 text-emerald-700',
  Andet: 'bg-slate-100 text-slate-600',
};

export default function LeverandoerStyring() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', postal_code: '', city: '', cvr: '', category: 'Byggematerialer', notes: '' });

  async function load() {
    setLoading(true);
    try {
      setSuppliers(await base44.entities.Supplier.list('-created_date', 200));
    } catch (e) { toast({ title: 'Fejl', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create() {
    try {
      await base44.entities.Supplier.create(form);
      toast({ title: 'Leverandør oprettet' });
      setDialogOpen(false);
      setForm({ name: '', contact_person: '', email: '', phone: '', address: '', postal_code: '', city: '', cvr: '', category: 'Byggematerialer', notes: '' });
      load();
    } catch (err) { toast({ title: 'Fejl', description: err.message, variant: 'destructive' }); }
  }

  async function remove(id) {
    if (!confirm('Slet leverandør?')) return;
    try { await base44.entities.Supplier.delete(id); load(); }
    catch (err) { toast({ title: 'Fejl', description: err.message, variant: 'destructive' }); }
  }

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Leverandørstyring</h1>
          <p className="text-slate-500 mt-1">Styring af leverandørkontakter — materialer og underentreprenørydelser</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Ny leverandør</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.length === 0 && <div className="col-span-full text-center py-16 text-slate-400">Ingen leverandører endnu</div>}
        {suppliers.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <div>
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    {s.cvr && <div className="text-xs text-slate-400">CVR {s.cvr}</div>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[s.category] || CAT_COLORS['Andet']}`}>{s.category}</span>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                {s.contact_person && <div>{s.contact_person}</div>}
                {s.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</div>}
                {s.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</div>}
                {(s.postal_code || s.city) && <div className="text-xs text-slate-400">{s.postal_code} {s.city}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Ny leverandør</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Virksomhedsnavn *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kontaktperson</Label><Input value={form.contact_person} onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))} /></div>
              <div><Label>CVR</Label><Input value={form.cvr} onChange={(e) => setForm((f) => ({ ...f, cvr: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div><Label>Adresse</Label><Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Postnr.</Label><Input value={form.postal_code} onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))} /></div>
              <div><Label>By</Label><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Byggematerialer">Byggematerialer</SelectItem>
                  <SelectItem value="Maskiner">Maskiner</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Værktøj">Værktøj</SelectItem>
                  <SelectItem value="Andet">Andet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Noter</Label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={create} disabled={!form.name}>Opret</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}