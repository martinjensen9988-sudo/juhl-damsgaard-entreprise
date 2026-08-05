import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Car, Plus, Pencil, Trash2, MapPin, Shield, Wrench, AlertCircle } from 'lucide-react';

const VEHICLE_TYPES = ['Lastbil', 'Varebil', 'Personbil', 'Specialkøretøj', 'Anhænger', 'Andet'];
const FUEL_TYPES = ['Diesel', 'Benzin', 'El', 'Hybrid', 'Andet'];
const STATUSES = ['Ledig', 'I brug', 'Reparation', 'Ude af drift'];

const statusBadge = {
  'Ledig': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200',
  'I brug': 'bg-emerald-100 text-emerald-700',
  'Reparation': 'bg-amber-100 text-amber-700',
  'Ude af drift': 'bg-red-100 text-red-700',
};

const emptyVehicle = {
  name: '', plate_number: '', type: 'Lastbil', status: 'Ledig', location: '',
  assigned_project_name: '', mileage: 0, fuel_type: 'Diesel',
  insurance_provider: '', insurance_policy: '', insurance_expiry: '',
  last_service_date: '', last_service_mileage: 0, next_service_date: '', next_service_mileage: 0,
  notes: '',
};

export default function Bilpark() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyVehicle);

  const load = async () => {
    try {
      setVehicles(await base44.entities.Vehicle.list());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyVehicle); setDialogOpen(true); };
  const openEdit = (v) => { setEditing(v); setForm({ ...emptyVehicle, ...v }); setDialogOpen(true); };

  const save = async () => {
    if (editing) await base44.entities.Vehicle.update(editing.id, form);
    else await base44.entities.Vehicle.create(form);
    setDialogOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Slet dette køretøj?')) return;
    await base44.entities.Vehicle.delete(id);
    load();
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const daysUntil = (d) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Bilpark</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Styring af firmaets køretøjer — service, forsikring og lokation</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Tilføj køretøj</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((v) => {
          const insDays = daysUntil(v.insurance_expiry);
          const svcDays = daysUntil(v.next_service_date);
          return (
            <div key={v.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Car className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{v.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{v.plate_number || '—'} • {v.type}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge[v.status] || statusBadge['Ledig']}`}>{v.status}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>{v.assigned_project_name || v.location || 'Ikke tildelt'}</span>
                  </div>
                  {v.mileage > 0 && <div className="text-slate-500 dark:text-slate-400 text-xs">Km-stand: {v.mileage.toLocaleString('da-DK')}</div>}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-1.5 ${insDays !== null && insDays < 30 ? 'text-amber-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    <Shield className="w-3.5 h-3.5" />
                    <span>{v.insurance_expiry ? formatDate(v.insurance_expiry) : '—'}</span>
                    {insDays !== null && insDays < 30 && <AlertCircle className="w-3 h-3" />}
                  </div>
                  <div className={`flex items-center gap-1.5 ${svcDays !== null && svcDays < 14 ? 'text-amber-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{v.next_service_date ? formatDate(v.next_service_date) : '—'}</span>
                  </div>
                </div>
              </div>
              <div className="flex border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => openEdit(v)} className="flex-1 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Rediger</button>
                <button onClick={() => remove(v.id)} className="flex-1 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5 border-l border-slate-100 dark:border-slate-800"><Trash2 className="w-3.5 h-3.5" /> Slet</button>
              </div>
            </div>
          );
        })}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Ingen køretøjer registreret endnu</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger køretøj' : 'Tilføj køretøj'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Navn *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Volvo FH16" />
            </div>
            <div>
              <Label>Reg.nr.</Label>
              <Input value={form.plate_number} onChange={(e) => set('plate_number', e.target.value)} placeholder="AB 12 345" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Brændstof</Label>
              <Select value={form.fuel_type} onValueChange={(v) => set('fuel_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FUEL_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Km-stand</Label>
              <Input type="number" value={form.mileage} onChange={(e) => set('mileage', Number(e.target.value))} />
            </div>
            <div className="col-span-2">
              <Label>Aktuel lokation</Label>
              <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Hovedkvarter / byggeplads" />
            </div>
            <div className="col-span-2">
              <Label>Tildelt projekt</Label>
              <Input value={form.assigned_project_name} onChange={(e) => set('assigned_project_name', e.target.value)} placeholder="Projektnavn" />
            </div>
          </div>

          <div className="border-t pt-4 mt-2">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" /> Forsikring</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Selskab</Label>
                <Input value={form.insurance_provider} onChange={(e) => set('insurance_provider', e.target.value)} />
              </div>
              <div>
                <Label>Policenummer</Label>
                <Input value={form.insurance_policy} onChange={(e) => set('insurance_policy', e.target.value)} />
              </div>
              <div>
                <Label>Udløber</Label>
                <Input type="date" value={form.insurance_expiry} onChange={(e) => set('insurance_expiry', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-2">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-500" /> Service</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sidste service</Label>
                <Input type="date" value={form.last_service_date} onChange={(e) => set('last_service_date', e.target.value)} />
              </div>
              <div>
                <Label>Km ved sidste service</Label>
                <Input type="number" value={form.last_service_mileage} onChange={(e) => set('last_service_mileage', Number(e.target.value))} />
              </div>
              <div>
                <Label>Næste service</Label>
                <Input type="date" value={form.next_service_date} onChange={(e) => set('next_service_date', e.target.value)} />
              </div>
              <div>
                <Label>Service ved km</Label>
                <Input type="number" value={form.next_service_mileage} onChange={(e) => set('next_service_mileage', Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div>
            <Label>Noter</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={!form.name}>Gem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}