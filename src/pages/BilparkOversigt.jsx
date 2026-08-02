import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Car, AlertTriangle } from 'lucide-react';
import { formatDate, formatDKK } from '@/lib/format';

const types = ['Lastbil', 'Varebil', 'Personbil', 'Specialkøretøj', 'Anhænger', 'Andet'];
const fuels = ['Diesel', 'Benzin', 'El', 'Hybrid', 'Andet'];
const statuses = ['Ledig', 'I brug', 'Reparation', 'Ude af drift'];
const statusColor = { Ledig: 'bg-emerald-100 text-emerald-700', 'I brug': 'bg-blue-100 text-blue-700', Reparation: 'bg-amber-100 text-amber-700', 'Ude af drift': 'bg-red-100 text-red-700' };
const empty = { name: '', plate_number: '', type: 'Lastbil', status: 'Ledig', location: '', mileage: '', fuel_type: 'Diesel', insurance_provider: '', insurance_policy: '', insurance_expiry: '', last_service_date: '', next_service_date: '', last_inspection_date: '', inspection_due: '', notes: '' };

function daysUntil(dateStr) { if (!dateStr) return null; const diff = new Date(dateStr) - new Date(); return Math.ceil(diff / 86400000); }
function dueBadge(dateStr, warnDays = 30) { const d = daysUntil(dateStr); if (d === null) return null; if (d < 0) return 'bg-red-100 text-red-700'; if (d <= warnDays) return 'bg-amber-100 text-amber-700'; return 'bg-slate-100 text-slate-600'; }

export default function BilparkOversigt() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { const v = await base44.entities.Vehicle.list(); setVehicles(v || []); } catch (e) { console.error(e); } setLoading(false); };
  useEffect(() => { load(); }, []);

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (v) => { setEditing(v); setForm({ ...empty, ...v }); setOpen(true); };

  const save = async () => {
    if (!form.name) return alert('Angiv navn');
    setSaving(true);
    try { editing ? await base44.entities.Vehicle.update(editing.id, form) : await base44.entities.Vehicle.create(form); setOpen(false); load(); }
    catch (e) { console.error(e); alert('Fejl'); }
    setSaving(false);
  };
  const remove = async (v) => { if (!confirm('Slet køretøj?')) return; try { await base44.entities.Vehicle.delete(v.id); load(); } catch (e) {} };

  const stats = useMemo(() => {
    const now = new Date();
    const overdue = (key) => vehicles.filter((v) => v[key] && new Date(v[key]) < now).length;
    return { total: vehicles.length, inspOverdue: overdue('inspection_due'), servOverdue: overdue('next_service_date'), insOverdue: overdue('insurance_expiry') };
  }, [vehicles]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Car className="w-5 h-5 text-slate-700" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Firma Bilpark</h1>
            <p className="text-slate-500 mt-0.5">Synsdatoer, serviceintervaller og forsikringer for hvert køretøj</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Tilføj køretøj</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Køretøjer', stats.total, 'text-slate-900'], ['Syn overskredet', stats.inspOverdue, 'text-red-600'], ['Service overskredet', stats.servOverdue, 'text-amber-600'], ['Forsikring udløbet', stats.insOverdue, 'text-red-600']].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">{l}</div><div className={`text-2xl font-bold ${c}`}>{v}</div></div>
        ))}
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : vehicles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Car className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen køretøjer endnu</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"><Car className="w-4 h-4 text-slate-600" /></div>
                  <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{v.name}</div><div className="text-xs text-slate-500">{v.plate_number || '—'} · {v.type}</div></div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[v.status] || 'bg-slate-100'}`}>{v.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                {[['Syn', v.inspection_due, dueBadge(v.inspection_due, 30)], ['Service', v.next_service_date, dueBadge(v.next_service_date, 14)], ['Forsikring', v.insurance_expiry, dueBadge(v.insurance_expiry, 30)], ['Km', v.mileage ? formatDKK(v.mileage).replace('kr.', 'km') : null, 'bg-slate-100 text-slate-600']].map(([l, val, badge]) => (
                  <div key={l} className="rounded-lg bg-slate-50 p-2">
                    <div className="text-slate-400">{l}</div>
                    {val != null ? <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium mt-0.5 ${badge || 'bg-slate-100 text-slate-600'}`}>{typeof val === 'string' && val.match(/^\d{4}/) ? formatDate(val) : val}</span> : <span className="text-slate-300">—</span>}
                  </div>
                ))}
              </div>
              {v.insurance_provider && <div className="text-xs text-slate-500 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {v.insurance_provider} {v.insurance_policy && `· ${v.insurance_policy}`}</div>}
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <button onClick={() => openEdit(v)} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Pencil className="w-3 h-3" /> Rediger</button>
                <button onClick={() => remove(v)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3" /> Slet</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger køretøj' : 'Tilføj køretøj'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Navn *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
              <div><Label>Reg.nr.</Label><Input value={form.plate_number} onChange={(e) => set('plate_number', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => set('type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Brændstof</Label><Select value={form.fuel_type} onValueChange={(v) => set('fuel_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{fuels.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Km-stand</Label><Input type="number" value={form.mileage} onChange={(e) => set('mileage', e.target.value ? Number(e.target.value) : '')} /></div>
              <div><Label>Lokation</Label><Input value={form.location} onChange={(e) => set('location', e.target.value)} /></div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Forsikring</h4>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Selskab</Label><Input value={form.insurance_provider} onChange={(e) => set('insurance_provider', e.target.value)} /></div>
                <div><Label>Policenummer</Label><Input value={form.insurance_policy} onChange={(e) => set('insurance_policy', e.target.value)} /></div>
                <div><Label>Udløber</Label><Input type="date" value={form.insurance_expiry} onChange={(e) => set('insurance_expiry', e.target.value)} /></div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Service & Syn</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Sidste service</Label><Input type="date" value={form.last_service_date} onChange={(e) => set('last_service_date', e.target.value)} /></div>
                <div><Label>Næste service</Label><Input type="date" value={form.next_service_date} onChange={(e) => set('next_service_date', e.target.value)} /></div>
                <div><Label>Sidste syn</Label><Input type="date" value={form.last_inspection_date} onChange={(e) => set('last_inspection_date', e.target.value)} /></div>
                <div><Label>Næste syn</Label><Input type="date" value={form.inspection_due} onChange={(e) => set('inspection_due', e.target.value)} /></div>
              </div>
            </div>
            <div><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}