import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, Mail, Phone, Briefcase, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const TRADES = ['Gravemaskinefører', 'Anlægsgartner', 'Kloakmester', 'Betonarbejder', 'Lastbilchauffør', 'Håndværker', 'Lærling', 'Andet'];
const STATUS_COLORS = { Aktiv: 'bg-emerald-100 text-emerald-700', Orlov: 'bg-amber-100 text-amber-700', Inaktiv: 'bg-slate-100 text-slate-500' };
const empty = { name: '', email: '', phone: '', address: '', trade: 'Håndværker', position: '', hire_date: '', hourly_rate: '', certificates: '', competencies: '', responsibilities: '', status: 'Aktiv', notes: '' };

export default function PersonaleOversigt() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTrade, setFilterTrade] = useState('all');
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
    if (q && ![e.name, e.email, e.phone, e.position, e.certificates].some((v) => (v || '').toLowerCase().includes(q))) return false;
    if (filterTrade !== 'all' && e.trade !== filterTrade) return false;
    return true;
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

  const certs = (c) => (c || '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><Users className="w-7 h-7 text-amber-500" /> Personale-oversigt</h1>
          <p className="text-slate-500 mt-1">Oversigt over ansatte med kontaktoplysninger, stilling og certifikater</p>
        </div>
        <Button onClick={() => { setForm(empty); setEditId(null); setOpen(true); }} className="bg-amber-500 hover:bg-amber-600"><Plus className="w-4 h-4" /> Tilføj medarbejder</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Søg på navn, stilling, certifikat…" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white sm:max-w-md" />
        <Select value={filterTrade} onValueChange={setFilterTrade}>
          <SelectTrigger className="sm:w-56 bg-white"><span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> {filterTrade === 'all' ? 'Alle fag' : filterTrade}</span></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle fag</SelectItem>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Ingen medarbejdere fundet</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-3">Medarbejder</th><th className="px-4 py-3">Stilling</th><th className="px-4 py-3">Kontakt</th>
                <th className="px-4 py-3">Fag</th><th className="px-4 py-3">Certifikater</th><th className="px-4 py-3">Ansat</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">{(e.name || '?').charAt(0)}</div>
                      <div><div className="font-medium text-slate-900">{e.name}</div><span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[e.status] || STATUS_COLORS.Aktiv}`}>{e.status}</span></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{e.position || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {e.email && <div className="flex items-center gap-1.5 text-slate-600"><Mail className="w-3 h-3 text-slate-400" /> {e.email}</div>}
                    {e.phone && <div className="flex items-center gap-1.5 text-slate-600 mt-0.5"><Phone className="w-3 h-3 text-slate-400" /> {e.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{e.trade}</td>
                  <td className="px-4 py-3">
                    {certs(e.certificates).length ? (
                      <div className="flex flex-wrap gap-1">{certs(e.certificates).slice(0, 2).map((c, i) => <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">{c}</span>)}{certs(e.certificates).length > 2 && <span className="text-xs text-slate-400">+{certs(e.certificates).length - 2}</span>}</div>
                    ) : <span className="text-xs text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{e.hire_date ? format(new Date(e.hire_date), 'dd. MMM yyyy', { locale: da }) : '—'}</td>
                  <td className="px-4 py-3"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => edit(e)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="icon" className="text-red-600" onClick={() => del(e.id)}><Trash2 className="w-4 h-4" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Aktiv', 'Orlov', 'Inaktiv'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="col-span-2"><Label>Certifikater (kommasepareret)</Label><Input value={form.certificates} onChange={(e) => setForm({ ...form, certificates: e.target.value })} placeholder="F.eks. gravemaskinekort, førerbevis" /></div>
            <div className="col-span-2"><Label>Kompetencer</Label><Textarea value={form.competencies} onChange={(e) => setForm({ ...form, competencies: e.target.value })} rows={2} /></div>
            <div className="col-span-2"><Label>Ansvarsområder</Label><Textarea value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save} className="bg-amber-500 hover:bg-amber-600">Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}