import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Wrench, Calendar, User, Receipt, CheckCircle2, X } from 'lucide-react';

const EMPTY = {
  equipment_id: '', equipment_name: '', start_date: '', end_date: '',
  renter_name: '', renter_company: '', renter_phone: '', daily_rate: '', notes: '',
};

function daysBetween(a, b) {
  if (!a || !b) return 0;
  const d = Math.ceil((new Date(b) - new Date(a)) / 86400000);
  return d > 0 ? d : 0;
}

export default function Materieludlejning() {
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [eq, bk] = await Promise.all([
        base44.entities.Equipment.list('-created_date', 300),
        base44.entities.EquipmentBooking.list('-start_date', 300),
      ]);
      setEquipment(eq);
      setBookings(bk.filter((b) => b.is_external_rental));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const available = equipment.filter((e) => e.status === 'Ledig');

  const openNew = () => { setForm(EMPTY); setOpen(true); };

  const days = daysBetween(form.start_date, form.end_date);
  const total = days * (Number(form.daily_rate) || 0);

  const save = async () => {
    if (!form.equipment_name || !form.start_date || !form.end_date || !form.renter_name) {
      toast({ title: 'Udfyld materiel, datoer og lejer', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.EquipmentBooking.create({
        ...form,
        daily_rate: Number(form.daily_rate) || 0,
        total_price: total,
        is_external_rental: true,
        status: 'Reserveret',
        employee_name: form.renter_name,
      });
      setOpen(false); load();
      toast({ title: 'Udlejning oprettet', description: `Total: ${total.toLocaleString('da-DK')} kr` });
    } catch (e) { toast({ title: 'Fejl', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const setStatus = async (b, status) => {
    await base44.entities.EquipmentBooking.update(b.id, { status });
    load();
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const active = bookings.filter((b) => b.status === 'Reserveret' || b.status === 'Udleveret');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Materieludlejning</h1>
          <p className="text-slate-500 mt-1">Udlejning af firmaets maskiner til eksterne partnere</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Ny udlejning</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{available.length}</div><div className="text-xs text-slate-500">Ledige maskiner</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{active.length}</div><div className="text-xs text-slate-500">Aktive udlejninger</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{bookings.reduce((s, b) => s + (Number(b.total_price) || 0), 0).toLocaleString('da-DK')}</div><div className="text-xs text-slate-500">Omsætning (kr)</div></div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Ledige maskiner</h2>
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>
        ) : available.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-10 text-center"><Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-slate-400 text-sm">Ingen ledige maskiner.</p></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {available.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="font-semibold text-slate-900 truncate">{e.name}</div>
                <div className="text-xs text-slate-400 mt-1">{e.category} {e.serial_number ? `• ${e.serial_number}` : ''}</div>
                <span className="inline-flex mt-2 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">Ledig</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Aktive udlejninger</h2>
        {active.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-10 text-center text-slate-400 text-sm">Ingen aktive udlejninger.</div>
        ) : (
          <div className="space-y-2">
            {active.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{b.equipment_name}</div>
                  <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {b.renter_name} {b.renter_company ? `(${b.renter_company})` : ''}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.start_date} → {b.end_date}</span>
                    {b.daily_rate ? <span className="flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> {b.daily_rate} kr/dag</span> : null}
                  </div>
                  {b.total_price ? <div className="text-sm font-medium text-slate-900 mt-1">Total: {b.total_price.toLocaleString('da-DK')} kr {b.invoice_number ? `• Faktura ${b.invoice_number}` : ''}</div> : null}
                </div>
                <div className="flex items-center gap-2">
                  {b.status === 'Reserveret' && <Button size="sm" onClick={() => setStatus(b, 'Udleveret')}><CheckCircle2 className="w-4 h-4 mr-1" /> Udlever</Button>}
                  {b.status === 'Udleveret' && <Button size="sm" variant="secondary" onClick={() => setStatus(b, 'Returneret')}><CheckCircle2 className="w-4 h-4 mr-1" /> Returneret</Button>}
                  <Button variant="ghost" size="icon" onClick={() => setStatus(b, 'Annulleret')}><X className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Ny udlejning</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Materiel *</Label>
              <Select value={form.equipment_id} onValueChange={(v) => {
                const eq = equipment.find((e) => e.id === v);
                setForm({ ...form, equipment_id: v, equipment_name: eq?.name || '' });
              }}><SelectTrigger><SelectValue placeholder="Vælg maskine" /></SelectTrigger><SelectContent>{available.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Fra dato *</Label><Input type="date" value={form.start_date} onChange={set('start_date')} /></div>
            <div className="space-y-1.5"><Label>Til dato *</Label><Input type="date" value={form.end_date} onChange={set('end_date')} /></div>
            <div className="space-y-1.5"><Label>Lejer *</Label><Input value={form.renter_name} onChange={set('renter_name')} /></div>
            <div className="space-y-1.5"><Label>Virksomhed</Label><Input value={form.renter_company} onChange={set('renter_company')} /></div>
            <div className="space-y-1.5"><Label>Telefon</Label><Input value={form.renter_phone} onChange={set('renter_phone')} /></div>
            <div className="space-y-1.5"><Label>Dagspris (kr)</Label><Input type="number" value={form.daily_rate} onChange={set('daily_rate')} /></div>
            <div className="col-span-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
              {days > 0 && Number(form.daily_rate) ? `${days} dage × ${form.daily_rate} kr = ${total.toLocaleString('da-DK')} kr` : 'Vælg datoer og dagspris for at se total'}
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Noter</Label><Textarea value={form.notes} onChange={set('notes')} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving}>{saving ? 'Gemmer...' : 'Opret udlejning'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}