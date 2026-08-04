import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Briefcase, Plus, Mail, Phone, MapPin, Star, FileText, Pencil, Trash2, HardHat } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const TRADES = ['Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Transport', 'Andet'];
const empty = { name: '', contact_person: '', email: '', phone: '', address: '', postal_code: '', city: '', cvr: '', trade: 'Gravearbejde', status: 'Aktiv', rating: '', notes: '' };

export default function UnderleverandoerPortal() {
  const [subs, setSubs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const load = async () => {
    try {
      const [s, p, i] = await Promise.all([
        base44.entities.Subcontractor.list('-created_date', 500),
        base44.entities.Project.list('-created_date', 300),
        base44.entities.SupplierInvoice.list('-created_date', 500),
      ]);
      setSubs(s); setProjects(p); setInvoices(i);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = subs.filter((s) => {
    const q = search.toLowerCase();
    return !q || [s.name, s.contact_person, s.trade, s.city].some((v) => (v || '').toLowerCase().includes(q));
  });

  const active = subs.find((s) => s.id === activeId);
  const activeProjects = useMemo(() => projects.filter((p) => p.subcontractor_name === (active?.name)), [projects, active]);
  const activeInvoices = useMemo(() => invoices.filter((i) => i.supplier_name === (active?.name)), [invoices, active]);
  const invoiceTotal = activeInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const save = async () => {
    if (!form.name) return;
    const payload = { ...form, rating: form.rating ? Number(form.rating) : null };
    if (editId) await base44.entities.Subcontractor.update(editId, payload);
    else await base44.entities.Subcontractor.create(payload);
    setOpen(false); setForm(empty); setEditId(null); load();
  };
  const del = async (id) => { if (confirm('Slet underleverandør?')) { await base44.entities.Subcontractor.delete(id); if (activeId === id) setActiveId(null); load(); } };
  const edit = (s) => { setForm({ ...empty, ...s, rating: s.rating ?? '' }); setEditId(s.id); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><Briefcase className="w-7 h-7 text-amber-500" /> Underleverandør-portal</h1>
          <p className="text-slate-500 mt-1">Styring af kontaktoplysninger, tilknyttede opgaver og modtagne fakturaer</p>
        </div>
        <Button onClick={() => { setForm(empty); setEditId(null); setOpen(true); }} className="bg-amber-500 hover:bg-amber-600"><Plus className="w-4 h-4" /> Tilføj underleverandør</Button>
      </div>

      <Input placeholder="Søg på navn, fag, by…" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white max-w-md" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
          ) : filtered.map((s) => (
            <button key={s.id} onClick={() => setActiveId(s.id)} className={`w-full text-left bg-white rounded-xl border p-4 hover:border-amber-300 transition-colors ${activeId === s.id ? 'border-amber-400 ring-1 ring-amber-200' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">{s.name}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'Aktiv' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{s.trade}{s.city ? ` · ${s.city}` : ''}</div>
              {s.rating ? (
                <div className="flex gap-0.5 mt-1">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3 h-3 ${n <= s.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}</div>
              ) : null}
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!active ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Vælg en underleverandør for at se detaljer</div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{active.name}</h2>
                    {active.contact_person && <div className="text-sm text-slate-600 mt-1">Att: {active.contact_person}</div>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => edit(active)}><Pencil className="w-3.5 h-3.5" /> Rediger</Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => del(active.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  {active.email && <div className="flex items-center gap-2 text-slate-600"><Mail className="w-4 h-4 text-slate-400" /> {active.email}</div>}
                  {active.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-4 h-4 text-slate-400" /> {active.phone}</div>}
                  {active.address && <div className="flex items-center gap-2 text-slate-600 col-span-2"><MapPin className="w-4 h-4 text-slate-400" /> {[active.address, active.postal_code, active.city].filter(Boolean).join(', ')}</div>}
                  {active.cvr && <div className="text-slate-600">CVR: {active.cvr}</div>}
                </div>
                {active.notes && <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-600">{active.notes}</div>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><HardHat className="w-4 h-4 text-amber-500" /> Tilknyttede opgaver</h3>
                  {activeProjects.length === 0 ? <div className="text-sm text-slate-400">Ingen opgaver</div> : (
                    <div className="space-y-2">{activeProjects.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{p.name}</span>
                        <span className="text-xs text-slate-400">{p.status}</span>
                      </div>
                    ))}</div>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-500" /> Fakturaer</h3>
                  {activeInvoices.length === 0 ? <div className="text-sm text-slate-400">Ingen fakturaer</div> : (
                    <div className="space-y-2">{activeInvoices.map((i) => (
                      <div key={i.id} className="flex items-center justify-between text-sm">
                        <div><div className="text-slate-700">{i.invoice_number}</div><div className="text-xs text-slate-400">{i.date && format(new Date(i.date), 'dd. MMM yyyy', { locale: da })}</div></div>
                        <span className="font-medium text-slate-900">{i.amount} kr</span>
                      </div>
                    ))}</div>
                  )}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-sm font-semibold"><span className="text-slate-500">Total</span><span className="text-slate-900">{invoiceTotal} kr</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Rediger underleverandør' : 'Tilføj underleverandør'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Virksomhed *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Kontaktperson</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
            <div><Label>CVR-nr.</Label><Input value={form.cvr} onChange={(e) => setForm({ ...form, cvr: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="col-span-2"><Label>Adresse</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>Postnummer</Label><Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
            <div><Label>By</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>Fag</Label>
              <Select value={form.trade} onValueChange={(v) => setForm({ ...form, trade: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Aktiv', 'Inaktiv'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Vurdering (1-5)</Label><Input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save} className="bg-amber-500 hover:bg-amber-600">Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}