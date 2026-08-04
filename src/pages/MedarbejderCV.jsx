import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { IdCard, Plus, Award, Briefcase, Mail, Phone, Calendar, Shield, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const TRADES = ['Gravemaskinefører', 'Anlægsgartner', 'Kloakmester', 'Betonarbejder', 'Lastbilchauffør', 'Håndværker', 'Lærling', 'Andet'];
const STATUS_COLORS = { Aktiv: 'bg-emerald-100 text-emerald-700', Orlov: 'bg-amber-100 text-amber-700', Inaktiv: 'bg-slate-100 text-slate-500' };
const empty = { name: '', email: '', phone: '', address: '', trade: 'Håndværker', position: '', hire_date: '', hourly_rate: '', certificates: '', competencies: '', responsibilities: '', status: 'Aktiv', notes: '' };

export default function MedarbejderCV() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const load = async () => {
    try { setItems(await base44.entities.Employee.list('-created_date', 500)); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((e) => {
    const q = search.toLowerCase();
    return !q || [e.name, e.position, e.trade, e.competencies, e.certificates].some((v) => (v || '').toLowerCase().includes(q));
  });

  const selected = items.find((e) => e.id === selectedId);

  const save = async () => {
    if (!form.name) return;
    const payload = { ...form, hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null };
    if (editId) await base44.entities.Employee.update(editId, payload);
    else await base44.entities.Employee.create(payload);
    setOpen(false); setForm(empty); setEditId(null); load();
  };
  const del = async (id) => { if (confirm('Slet CV?')) { await base44.entities.Employee.delete(id); if (selectedId === id) setSelectedId(null); load(); } };
  const edit = (e) => { setForm({ ...empty, ...e, hourly_rate: e.hourly_rate ?? '' }); setEditId(e.id); setOpen(true); };

  const certs = (c) => (c || '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><IdCard className="w-7 h-7 text-amber-500" /> Medarbejder-CV</h1>
          <p className="text-slate-500 mt-1">Faglige kvalifikationer, certifikater og ansvarsområder for hver ansat</p>
        </div>
        <Button onClick={() => { setForm(empty); setEditId(null); setOpen(true); }} className="bg-amber-500 hover:bg-amber-600"><Plus className="w-4 h-4" /> Tilføj CV</Button>
      </div>

      <Input placeholder="Søg på kompetence, certifikat, fag…" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white max-w-md" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
          ) : filtered.map((e) => (
            <button key={e.id} onClick={() => setSelectedId(e.id)} className={`w-full text-left bg-white rounded-xl border p-4 hover:border-amber-300 transition-colors ${selectedId === e.id ? 'border-amber-400 ring-1 ring-amber-200' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">{(e.name || '?').charAt(0)}</div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{e.name}</div>
                  <div className="text-xs text-slate-500 truncate">{e.position || e.trade}</div>
                </div>
              </div>
              {e.certificates && <div className="text-xs text-slate-500 mt-2 line-clamp-1">{certs(e.certificates).length} certifikater</div>}
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Vælg en medarbejder for at se CV</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xl">{(selected.name || '?').charAt(0)}</div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
                    <div className="text-sm text-slate-500">{selected.position || selected.trade}</div>
                    <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status] || STATUS_COLORS.Aktiv}`}>{selected.status}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => edit(selected)}><Pencil className="w-3.5 h-3.5" /> Rediger</Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => del(selected.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                {selected.email && <div className="flex items-center gap-2 text-slate-600"><Mail className="w-4 h-4 text-slate-400" /> {selected.email}</div>}
                {selected.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-4 h-4 text-slate-400" /> {selected.phone}</div>}
                {selected.hire_date && <div className="flex items-center gap-2 text-slate-600"><Calendar className="w-4 h-4 text-slate-400" /> Ansat {format(new Date(selected.hire_date), 'dd. MMM yyyy', { locale: da })}</div>}
                {selected.trade && <div className="flex items-center gap-2 text-slate-600"><Briefcase className="w-4 h-4 text-slate-400" /> {selected.trade}</div>}
              </div>

              <CVSection icon={Award} title="Certifikater" content={selected.certificates} list={certs(selected.certificates)} />
              <CVSection icon={Shield} title="Kompetencer" content={selected.competencies} />
              <CVSection icon={Briefcase} title="Ansvarsområder" content={selected.responsibilities} />
              {selected.notes && <CVSection icon={IdCard} title="Noter" content={selected.notes} />}
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editId ? 'Rediger CV' : 'Tilføj CV'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
            <div><Label>Navn *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Stillingsbetegnelse</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Fag</Label>
              <Select value={form.trade} onValueChange={(v) => setForm({ ...form, trade: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Ansættelsesdato</Label><Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Aktiv', 'Orlov', 'Inaktiv'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Timepris (DKK)</Label><Input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} /></div>
            <div className="col-span-2"><Label>Certifikater (kommasepareret)</Label><Input value={form.certificates} onChange={(e) => setForm({ ...form, certificates: e.target.value })} placeholder="F.eks. gravemaskinekort, førerbevis, first aid" /></div>
            <div className="col-span-2"><Label>Kompetencer</Label><Textarea value={form.competencies} onChange={(e) => setForm({ ...form, competencies: e.target.value })} rows={3} /></div>
            <div className="col-span-2"><Label>Ansvarsområder</Label><Textarea value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} rows={3} /></div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save} className="bg-amber-500 hover:bg-amber-600">Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CVSection({ icon: Icon, title, content, list }) {
  if (!content && !list?.length) return null;
  return (
    <div className="mt-5 pt-5 border-t border-slate-100">
      <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><Icon className="w-4 h-4 text-amber-500" /> {title}</h3>
      {list?.length ? (
        <div className="flex flex-wrap gap-2">{list.map((c, i) => <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">{c}</span>)}</div>
      ) : (
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{content}</p>
      )}
    </div>
  );
}