import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, Mail, Phone, Award, Briefcase, Calendar, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const TRADES = ['Gravemaskinefører', 'Anlægsgartner', 'Kloakmester', 'Betonarbejder', 'Lastbilchauffør', 'Håndværker', 'Lærling', 'Andet'];
const STATUS_COLORS = { Aktiv: 'bg-emerald-100 text-emerald-700', Orlov: 'bg-amber-100 text-amber-700', Inaktiv: 'bg-slate-100 text-slate-500' };

const empty = { name: '', email: '', phone: '', address: '', trade: 'Håndværker', position: '', hire_date: '', hourly_rate: '', certificates: '', competencies: '', responsibilities: '', status: 'Aktiv', notes: '' };

export default function Medarbejderarkiv() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const load = async () => {
    try { setItems(await base44.entities.Employee.list('-created_date', 500)); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((e) => {
    const q = search.toLowerCase();
    return !q || [e.name, e.email, e.phone, e.position, e.trade, e.certificates].some((v) => (v || '').toLowerCase().includes(q));
  });

  const save = async () => {
    if (!form.name) return;
    const payload = { ...form, hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null };
    if (editId) await base44.entities.Employee.update(editId, payload);
    else await base44.entities.Employee.create(payload);
    setOpen(false); setForm(empty); setEditId(null); load();
  };

  const del = async (id) => { if (confirm('Slet medarbejder?')) { await base44.entities.Employee.delete(id); load(); } };
  const edit = (e) => { setForm({ ...empty, ...e, hourly_rate: e.hourly_rate ?? '' }); setEditId(e.id); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><Users className="w-7 h-7 text-amber-500" /> Medarbejderarkiv</h1>
          <p className="text-slate-500 mt-1">Alle ansatte med kontaktoplysninger, ansættelsesdato og kompetencer</p>
        </div>
        <Button onClick={() => { setForm(empty); setEditId(null); setOpen(true); }} className="bg-amber-500 hover:bg-amber-600"><Plus className="w-4 h-4" /> Tilføj medarbejder</Button>
      </div>

      <Input placeholder="Søg på navn, fag, certifikat…" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white max-w-md" />

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">{(e.name || '?').charAt(0)}</div>
                  <div>
                    <div className="font-semibold text-slate-900">{e.name}</div>
                    <div className="text-xs text-slate-500">{e.position || e.trade}</div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[e.status] || STATUS_COLORS.Aktiv}`}>{e.status}</span>
              </div>
              <div className="mt-3 space-y-1.5 text-sm">
                {e.email && <div className="flex items-center gap-2 text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" /> {e.email}</div>}
                {e.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> {e.phone}</div>}
                {e.hire_date && <div className="flex items-center gap-2 text-slate-600"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Ansat {format(new Date(e.hire_date), 'dd. MMM yyyy', { locale: da })}</div>}
                {e.trade && <div className="flex items-center gap-2 text-slate-600"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> {e.trade}</div>}
                {e.certificates && <div className="flex items-start gap-2 text-slate-600"><Award className="w-3.5 h-3.5 text-slate-400 mt-0.5" /> <span className="line-clamp-2">{e.certificates}</span></div>}
              </div>
              {e.competencies && <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500"><span className="font-medium text-slate-700">Kompetencer: </span>{e.competencies}</div>}
              <div className="mt-4 flex gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => edit(e)}><Pencil className="w-3.5 h-3.5" /> Rediger</Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => del(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editId ? 'Rediger medarbejder' : 'Tilføj medarbejder'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
            <div><Label>Navn *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Stillingsbetegnelse</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Adresse</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>Ansættelsesdato</Label><Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></div>
            <div><Label>Fag</Label>
              <Select value={form.trade} onValueChange={(v) => setForm({ ...form, trade: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Timepris (DKK)</Label><Input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Aktiv', 'Orlov', 'Inaktiv'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="col-span-2"><Label>Certifikater</Label><Input value={form.certificates} onChange={(e) => setForm({ ...form, certificates: e.target.value })} placeholder="F.eks. gravemaskinekort, førerbevis,.first aid" /></div>
            <div className="col-span-2"><Label>Kompetencer</Label><Textarea value={form.competencies} onChange={(e) => setForm({ ...form, competencies: e.target.value })} rows={2} /></div>
            <div className="col-span-2"><Label>Ansvarsområder</Label><Textarea value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save} className="bg-amber-500 hover:bg-amber-600">Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}