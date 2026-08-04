import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Hammer, Plus, Pencil, Trash2, Phone, Mail, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';

const TRADES = ['Gravearbejde', 'Kloak', 'Asfalt', 'Beton', 'Nedrivning', 'Anlæg', 'Transport', 'Andet'];
const empty = { name: '', contact_person: '', email: '', phone: '', address: '', postal_code: '', city: '', cvr: '', trade: 'Gravearbejde', status: 'Aktiv', rating: '', notes: '' };

export default function UnderleverandoerListe() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, projs] = await Promise.all([base44.entities.Subcontractor.list('-created_date', 200), base44.entities.Project.list().catch(() => [])]);
      setItems(subs || []); setProjects(projs || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEdit(null); setForm(empty); setOpen(true); };
  const openEdit = (s) => { setEdit(s); setForm({ ...empty, ...s }); setOpen(true); };

  const save = async () => {
    if (!form.name) { alert('Virksomhedsnavn kræves'); return; }
    const payload = { ...form, rating: form.rating ? Number(form.rating) : null };
    if (edit) await base44.entities.Subcontractor.update(edit.id, payload);
    else await base44.entities.Subcontractor.create(payload);
    setOpen(false); load();
  };

  const del = async (s) => { if (confirm(`Slet ${s.name}?`)) { await base44.entities.Subcontractor.delete(s.id); load(); } };

  const linkedCount = (id) => projects.filter((p) => p.subcontractor_id === id).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><Hammer className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Underleverandører</h1>
            <p className="text-slate-500">Kontakt, aftalevilkår og tilknytning til projektopgaver</p>
          </div>
        </div>
        <Button onClick={openNew} className="bg-slate-950"><Plus className="w-4 h-4" /> Tilføj</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><Hammer className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen underleverandører endnu.</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.trade} · {s.status}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                  <button onClick={() => del(s)} className="p-1.5 rounded hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                {s.contact_person && <div className="flex items-center gap-1.5"><span className="text-slate-400">Kontakt:</span>{s.contact_person}</div>}
                {s.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{s.phone}</div>}
                {s.email && <div className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 text-slate-400" />{s.email}</div>}
                {(s.city || s.address) && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{[s.address, s.postal_code && s.postal_code + ' ' + s.city].filter(Boolean).join(', ')}</div>}
              </div>
              {s.rating ? (
                <div className="flex items-center gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3.5 h-3.5 ${n <= s.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                </div>
              ) : null}
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">Tilknyttet <span className="font-semibold text-slate-700">{linkedCount(s.id)}</span> projekter</div>
              {s.notes && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{s.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{edit ? 'Rediger underleverandør' : 'Ny underleverandør'}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-2">
            <Field label="Virksomhed"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Kontaktperson"><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefon"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            </div>
            <Field label="Adresse"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Postnr."><Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></Field>
              <Field label="By"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            </div>
            <Field label="CVR"><Input value={form.cvr} onChange={(e) => setForm({ ...form, cvr: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fag">
                <Select value={form.trade} onValueChange={(v) => setForm({ ...form, trade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Vurdering (1-5)"><Input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></Field>
            </div>
            <Field label="Aftalevilkår / noter"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></Field>
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

function Field({ label, children }) { return <div><Label className="text-xs">{label}</Label>{children}</div>; }