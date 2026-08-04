import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ClipboardList, Plus, Pencil, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const TYPES = ['Merarbejde', 'Materialefejl', 'Forsinkelse', 'Klage', 'Fejl udførelse', 'Andet'];
const SEVERITY_BADGE = { Lav: 'bg-slate-100 text-slate-600', Mellem: 'bg-amber-100 text-amber-700', Høj: 'bg-orange-100 text-orange-700', Kritisk: 'bg-red-100 text-red-700' };
const STATUS_BADGE = { Åben: 'bg-red-100 text-red-700', 'Under behandling': 'bg-amber-100 text-amber-700', Lukket: 'bg-emerald-100 text-emerald-700' };
const STATUS_ICON = { Åben: AlertCircle, 'Under behandling': Clock, Lukket: CheckCircle2 };
const empty = { title: '', project_id: '', project_name: '', customer_name: '', type: 'Klage', severity: 'Mellem', status: 'Åben', extra_cost: '', extra_hours: '', date: '', reported_by: '', description: '', resolution: '' };

export default function MangelListe() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const load = async () => {
    try {
      const [d, p] = await Promise.all([
        base44.entities.Deviation.list('-created_date', 500),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setItems(d); setProjects(p);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((d) => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    const q = search.toLowerCase();
    if (q && ![d.title, d.customer_name, d.project_name, d.description].some((v) => (v || '').toLowerCase().includes(q))) return false;
    return true;
  }), [items, filterStatus, search]);

  const counts = useMemo(() => ({
    open: items.filter((d) => d.status === 'Åben').length,
    inProgress: items.filter((d) => d.status === 'Under behandling').length,
    closed: items.filter((d) => d.status === 'Lukket').length,
  }), [items]);

  const setProject = (id) => { const p = projects.find((x) => x.id === id); setForm((f) => ({ ...f, project_id: id, project_name: p?.name || '', customer_name: p?.customer_name || f.customer_name })); };

  const save = async () => {
    if (!form.title || !form.project_id) return;
    const payload = { ...form, extra_cost: Number(form.extra_cost) || 0, extra_hours: Number(form.extra_hours) || 0, date: form.date || format(new Date(), 'yyyy-MM-dd') };
    if (editId) await base44.entities.Deviation.update(editId, payload);
    else await base44.entities.Deviation.create(payload);
    setOpen(false); setForm(empty); setEditId(null); load();
  };
  const del = async (id) => { if (confirm('Slet mangel?')) { await base44.entities.Deviation.delete(id); load(); } };
  const edit = (d) => { setForm({ ...empty, ...d, extra_cost: d.extra_cost ?? '', extra_hours: d.extra_hours ?? '' }); setEditId(d.id); setOpen(true); };
  const setStatus = async (d, status) => { await base44.entities.Deviation.update(d.id, { status }); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><ClipboardList className="w-7 h-7 text-amber-500" /> Mangel-oversigt</h1>
          <p className="text-slate-500 mt-1">Registrering og opfølgning på mangler og reklamationer ved projektets afslutning</p>
        </div>
        <Button onClick={() => { setForm(empty); setEditId(null); setOpen(true); }} className="bg-amber-500 hover:bg-amber-600"><Plus className="w-4 h-4" /> Registrer mangel</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={AlertCircle} color="bg-red-50 text-red-600" label="Åbne" value={counts.open} />
        <Stat icon={Clock} color="bg-amber-50 text-amber-600" label="Under behandling" value={counts.inProgress} />
        <Stat icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" label="Lukkede" value={counts.closed} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Søg på titel, kunde, beskrivelse…" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white sm:max-w-md" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="sm:w-48 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Alle statusser</SelectItem>{['Åben', 'Under behandling', 'Lukket'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Ingen mangler fundet</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const Icon = STATUS_ICON[d.status] || AlertCircle;
            return (
              <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mt-0.5 ${d.status === 'Åben' ? 'bg-red-50 text-red-600' : d.status === 'Under behandling' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{d.title}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_BADGE[d.severity] || SEVERITY_BADGE.Mellem}`}>{d.severity}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[d.status] || STATUS_BADGE.Åben}`}>{d.status}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{d.project_name}{d.customer_name ? ` · ${d.customer_name}` : ''}{d.date ? ` · ${format(new Date(d.date), 'dd. MMM yyyy', { locale: da })}` : ''}</div>
                      {d.description && <div className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{d.description}</div>}
                      {d.resolution && <div className="text-sm mt-2 pt-2 border-t border-slate-100"><span className="font-medium text-emerald-700">Løsning: </span><span className="text-slate-600">{d.resolution}</span></div>}
                      {(d.extra_cost > 0 || d.extra_hours > 0) && (
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">{d.extra_cost > 0 && <span>Meromkostning: {d.extra_cost} kr</span>}{d.extra_hours > 0 && <span>Mertimer: {d.extra_hours} t</span>}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => edit(d)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => del(d.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    {d.status !== 'Lukket' && (
                      <Button variant="outline" size="sm" onClick={() => setStatus(d, d.status === 'Åben' ? 'Under behandling' : 'Lukket')}>
                        {d.status === 'Åben' ? 'Start behandling' : 'Afslut mangel'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Rediger mangel' : 'Registrer mangel'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Titel *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Projekt *</Label>
              <Select value={form.project_id} onValueChange={setProject}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Alvorlighed</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Lav', 'Mellem', 'Høj', 'Kritisk'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Rapporteret af</Label><Input value={form.reported_by} onChange={(e) => setForm({ ...form, reported_by: e.target.value })} /></div>
            </div>
            <div><Label>Beskrivelse</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Meromkostning (DKK)</Label><Input type="number" value={form.extra_cost} onChange={(e) => setForm({ ...form, extra_cost: e.target.value })} /></div>
              <div><Label>Mertimer</Label><Input type="number" value={form.extra_hours} onChange={(e) => setForm({ ...form, extra_hours: e.target.value })} /></div>
            </div>
            <div><Label>Løsning</Label><Textarea value={form.resolution} onChange={(e) => setForm({ ...form, resolution: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save} className="bg-amber-500 hover:bg-amber-600">Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon: Icon, color, label, value }) {
  return <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div><div><div className="text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div>;
}