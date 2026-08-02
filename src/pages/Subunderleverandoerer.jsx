import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Users, Star, Mail, Phone, HardHat } from 'lucide-react';

const trades = ['Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Transport', 'Andet'];
const statusColor = { Aktiv: 'bg-emerald-100 text-emerald-700', Inaktiv: 'bg-slate-100 text-slate-500' };
const empty = { name: '', contact_person: '', email: '', phone: '', address: '', postal_code: '', city: '', cvr: '', trade: 'Gravearbejde', status: 'Aktiv', rating: '', notes: '' };

export default function Subunderleverandoerer() {
  const [subs, setSubs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const [s, p] = await Promise.all([base44.entities.Subcontractor.list(), base44.entities.Project.list().catch(() => [])]); setSubs(s || []); setProjects(p || []); } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...empty, ...c }); setOpen(true); };

  const save = async () => {
    if (!form.name) return alert('Angiv virksomhed');
    setSaving(true);
    try { editing ? await base44.entities.Subcontractor.update(editing.id, form) : await base44.entities.Subcontractor.create(form); setOpen(false); load(); }
    catch (e) { console.error(e); alert('Fejl'); }
    setSaving(false);
  };
  const remove = async (c) => { if (!confirm('Slet underleverandør?')) return; try { await base44.entities.Subcontractor.delete(c.id); load(); } catch (e) {} };

  // projects associated via subcontractor_id (Project has subcontractor_name field)
  const projectsFor = (sub) => projects.filter((p) => p.subcontractor_id === sub.id || p.subcontractor_name === sub.name);

  const stats = useMemo(() => ({
    total: subs.length,
    active: subs.filter((s) => s.status === 'Aktiv').length,
    byTrade: trades.reduce((acc, t) => { acc[t] = subs.filter((s) => s.trade === t).length; return acc; }, {}),
  }), [subs]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center"><HardHat className="w-5 h-5 text-teal-600" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Underleverandør oversigt</h1>
            <p className="text-slate-500 mt-0.5">Kontakt, fagområder og tilknyttede projekter for eksterne håndværkere</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Tilføj underleverandør</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Total</div><div className="text-2xl font-bold text-slate-900">{stats.total}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Aktive</div><div className="text-2xl font-bold text-emerald-600">{stats.active}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 col-span-2"><div className="text-sm text-slate-500 mb-2">Fagområder</div><div className="flex flex-wrap gap-1.5">{trades.map((t) => stats.byTrade[t] > 0 && <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}: {stats.byTrade[t]}</span>)}</div></div>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : subs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Users className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen underleverandører endnu</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subs.map((s) => {
            const projs = projectsFor(s);
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{s.name}</div>{s.contact_person && <div className="text-xs text-slate-500 truncate">{s.contact_person}</div>}</div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[s.status] || 'bg-slate-100'}`}>{s.status}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{s.trade}</span>
                  {s.cvr && <span className="text-xs text-slate-400">CVR: {s.cvr}</span>}
                </div>
                <div className="space-y-1 mt-3 text-xs text-slate-600">
                  {s.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {s.email}</div>}
                  {s.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {s.phone}</div>}
                  {s.city && <div className="text-slate-400">{s.address}{s.postal_code ? `, ${s.postal_code}` : ''} {s.city}</div>}
                </div>
                {s.rating > 0 && <div className="flex items-center gap-0.5 mt-2">{[1,2,3,4,5].map((n) => <Star key={n} className={`w-3 h-3 ${n <= s.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />)}</div>}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-400 mb-1">Tilknyttede projekter ({projs.length})</div>
                  {projs.length === 0 ? <span className="text-xs text-slate-300">Ingen</span> : <div className="flex flex-wrap gap-1">{projs.slice(0, 3).map((p) => <span key={p.id} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{p.name}</span>)}{projs.length > 3 && <span className="text-xs text-slate-400">+{projs.length - 3}</span>}</div>}
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => openEdit(s)} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Pencil className="w-3 h-3" /> Rediger</button>
                  <button onClick={() => remove(s)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3" /> Slet</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger underleverandør' : 'Tilføj underleverandør'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Virksomhed *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
              <div><Label>Kontaktperson</Label><Input value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
              <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            </div>
            <div><Label>Adresse</Label><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Postnr.</Label><Input value={form.postal_code} onChange={(e) => set('postal_code', e.target.value)} /></div>
              <div><Label>By</Label><Input value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
              <div><Label>CVR</Label><Input value={form.cvr} onChange={(e) => set('cvr', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fag</Label><Select value={form.trade} onValueChange={(v) => set('trade', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{trades.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(statusColor).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Vurdering (1-5)</Label><Input type="number" min="1" max="5" value={form.rating} onChange={(e) => set('rating', e.target.value ? Number(e.target.value) : '')} /></div>
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