import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BookOpen, Plus, Pencil, Trash2, Sun, Cloud, CloudRain, CloudSnow, Cloudy } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const WEATHER_ICON = { Sol: Sun, Skyet: Cloudy, Overskyet: Cloudy, Regn: CloudRain, Sne: CloudSnow };
const WEATHER_COLOR = { Sol: 'bg-amber-100 text-amber-600', Skyet: 'bg-slate-100 text-slate-500', Overskyet: 'bg-slate-100 text-slate-500', Regn: 'bg-blue-100 text-blue-600', Sne: 'bg-cyan-100 text-cyan-600' };
const empty = { project_id: '', project_name: '', date: '', author_name: '', weather: 'Skyet', content: '', events: '' };

export default function DriftsLogbog() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [filterProject, setFilterProject] = useState('all');

  const load = async () => {
    try {
      const [n, p] = await Promise.all([
        base44.entities.ProjectNote.list('-created_date', 500),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setItems(n); setProjects(p);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items
    .filter((n) => filterProject === 'all' || n.project_id === filterProject)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const setProject = (id) => { const p = projects.find((x) => x.id === id); setForm((f) => ({ ...f, project_id: id, project_name: p?.name || '' })); };

  const save = async () => {
    if (!form.project_id || !form.content) return;
    const payload = { ...form, date: form.date || format(new Date(), 'yyyy-MM-dd') };
    if (editId) await base44.entities.ProjectNote.update(editId, payload);
    else await base44.entities.ProjectNote.create(payload);
    setOpen(false); setForm(empty); setEditId(null); load();
  };
  const del = async (id) => { if (confirm('Slet logpost?')) { await base44.entities.ProjectNote.delete(id); load(); } };
  const edit = (n) => { setForm({ ...empty, ...n }); setEditId(n.id); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><BookOpen className="w-7 h-7 text-amber-500" /> Driftslogbog</h1>
          <p className="text-slate-500 mt-1">Daglig logføring af fremdrift, vejrforhold og hændelser på pladsen</p>
        </div>
        <Button onClick={() => { setForm({ ...empty, date: format(new Date(), 'yyyy-MM-dd') }); setEditId(null); setOpen(true); }} className="bg-amber-500 hover:bg-amber-600"><Plus className="w-4 h-4" /> Ny logpost</Button>
      </div>

      <Select value={filterProject} onValueChange={setFilterProject}>
        <SelectTrigger className="sm:w-64 bg-white"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Alle projekter</SelectItem>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
      </Select>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Ingen logposter</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const Icon = WEATHER_ICON[n.weather] || Cloud;
            return (
              <div key={n.id} className="bg-white rounded-xl border border-slate-200 p-5 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${WEATHER_COLOR[n.weather] || 'bg-slate-100 text-slate-500'}`}><Icon className="w-4 h-4" /></div>
                    <div>
                      <div className="font-semibold text-slate-900">{n.project_name || 'Uden projekt'}</div>
                      <div className="text-xs text-slate-500">{n.date && format(new Date(n.date), 'EEEE dd. MMM yyyy', { locale: da })}{n.author_name ? ` · ${n.author_name}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => edit(n)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => del(n.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{n.content}</div>
                {n.events && <div className="mt-3 pt-3 border-t border-slate-100 text-sm"><span className="font-medium text-slate-700">Hændelser: </span><span className="text-slate-600">{n.events}</span></div>}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Rediger logpost' : 'Ny logpost'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Projekt *</Label>
              <Select value={form.project_id} onValueChange={setProject}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label>Vejrforhold</Label>
                <Select value={form.weather} onValueChange={(v) => setForm({ ...form, weather: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Sol', 'Skyet', 'Overskyet', 'Regn', 'Sne'].map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div><Label>Formand / forfatter</Label><Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} /></div>
            <div><Label>Dagens fremdrift *</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} /></div>
            <div><Label>Vigtige hændelser</Label><Textarea value={form.events} onChange={(e) => setForm({ ...form, events: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save} disabled={!form.project_id || !form.content} className="bg-amber-500 hover:bg-amber-600">Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}