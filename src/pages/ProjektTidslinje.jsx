import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { GitBranch, Plus, Pencil, Trash2, Flag, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';

const STATUS_BADGE = {
  'Ikke startet': 'bg-slate-100 text-slate-600',
  'I gang': 'bg-blue-100 text-blue-700',
  'Gennemført': 'bg-emerald-100 text-emerald-700',
  'Forsinket': 'bg-red-100 text-red-700',
};
const STATUS_ICON = { 'Ikke startet': Clock, 'I gang': AlertCircle, 'Gennemført': CheckCircle2, 'Forsinket': Flag };
const empty = { project_id: '', project_name: '', title: '', description: '', due_date: '', status: 'Ikke startet', completed_date: '', order: 0 };

export default function ProjektTidslinje() {
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const load = async () => {
    try {
      const [m, p] = await Promise.all([
        base44.entities.Milestone.list('-created_date', 500),
        base44.entities.Project.filter({ status: 'I gang' }, '-created_date', 200),
      ]);
      setMilestones(m); setProjects(p);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => milestones
    .filter((m) => filterProject === 'all' || m.project_id === filterProject)
    .sort((a, b) => (a.order || 0) - (b.order || 0) || (a.due_date || '').localeCompare(b.due_date || '')),
    [milestones, filterProject]);

  const byProject = useMemo(() => {
    const map = {};
    filtered.forEach((m) => { const k = m.project_name || 'Uden projekt'; (map[k] = map[k] || []).push(m); });
    return map;
  }, [filtered]);

  const today = new Date();
  const setProject = (id) => { const p = projects.find((x) => x.id === id); setForm((f) => ({ ...f, project_id: id, project_name: p?.name || '' })); };

  const save = async () => {
    if (!form.title || !form.project_id) return;
    const payload = { ...form, order: Number(form.order) || 0 };
    if (editId) await base44.entities.Milestone.update(editId, payload);
    else await base44.entities.Milestone.create(payload);
    setOpen(false); setForm(empty); setEditId(null); load();
  };
  const del = async (id) => { if (confirm('Slet milepæl?')) { await base44.entities.Milestone.delete(id); load(); } };
  const edit = (m) => { setForm({ ...empty, ...m }); setEditId(m.id); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><GitBranch className="w-7 h-7 text-amber-500" /> Projekt-tidslinje</h1>
          <p className="text-slate-500 mt-1">Visuel tidslinje af milepæle, deadlines og fremdrift for igangværende projekter</p>
        </div>
        <Button onClick={() => { setForm(empty); setEditId(null); setOpen(true); }} className="bg-amber-500 hover:bg-amber-600"><Plus className="w-4 h-4" /> Tilføj milepæl</Button>
      </div>

      <Select value={filterProject} onValueChange={setFilterProject}>
        <SelectTrigger className="sm:w-72 bg-white"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Alle projekter</SelectItem>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
      </Select>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>
      ) : Object.keys(byProject).length === 0 ? (
        <div className="text-center py-12 text-slate-400">Ingen milepæle fundet</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byProject).map(([proj, ms]) => {
            const done = ms.filter((m) => m.status === 'Gennemført').length;
            const pct = ms.length ? Math.round((done / ms.length) * 100) : 0;
            return (
              <div key={proj} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">{proj}</h2>
                    <span className="text-xs text-slate-500">{done}/{ms.length} gennemført · {pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                </div>
                <div className="p-5">
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200" />
                    <div className="space-y-4">
                      {ms.map((m) => {
                        const Icon = STATUS_ICON[m.status] || Clock;
                        const days = m.due_date ? differenceInDays(new Date(m.due_date), today) : null;
                        return (
                          <div key={m.id} className="relative pl-10 group">
                            <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${m.status === 'Gennemført' ? 'bg-emerald-500 border-emerald-500' : m.status === 'Forsinket' ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300'}`}>
                              <Icon className={`w-3 h-3 ${m.status === 'Gennemført' ? 'text-white' : m.status === 'Forsinket' ? 'text-white' : 'text-slate-500'}`} />
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="font-medium text-slate-900">{m.title}</div>
                                {m.description && <div className="text-sm text-slate-500 mt-0.5">{m.description}</div>}
                                <div className="flex items-center gap-3 mt-1.5 text-xs">
                                  {m.due_date && <span className="text-slate-500">Deadline: {format(new Date(m.due_date), 'dd. MMM yyyy', { locale: da })}</span>}
                                  {days !== null && m.status !== 'Gennemført' && (
                                    <span className={`font-medium ${days < 0 ? 'text-red-600' : days <= 7 ? 'text-amber-600' : 'text-slate-400'}`}>
                                      {days < 0 ? `${Math.abs(days)} dage forsinket` : `${days} dage tilbage`}
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[m.status] || STATUS_BADGE['Ikke startet']}`}>{m.status}</span>
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={() => edit(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="text-red-600" onClick={() => del(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Rediger milepæl' : 'Tilføj milepæl'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Titel *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Projekt *</Label>
              <Select value={form.project_id} onValueChange={setProject}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><Label>Beskrivelse</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Deadline</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Ikke startet', 'I gang', 'Gennemført', 'Forsinket'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Gennemført dato</Label><Input type="date" value={form.completed_date} onChange={(e) => setForm({ ...form, completed_date: e.target.value })} /></div>
              <div><Label>Rækkefølge</Label><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save} className="bg-amber-500 hover:bg-amber-600">Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}