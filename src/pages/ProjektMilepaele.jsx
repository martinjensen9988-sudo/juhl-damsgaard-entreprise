import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Flag, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const STATUSES = ['Ikke startet', 'I gang', 'Gennemført', 'Forsinket'];
const STATUS_STYLE = {
  'Ikke startet': { color: 'text-slate-400', bg: 'bg-slate-100', icon: Clock },
  'I gang': { color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
  'Gennemført': { color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2 },
  'Forsinket': { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle },
};

const EMPTY = { project_id: '', title: '', description: '', due_date: '', status: 'Ikke startet', order: 0 };

export default function ProjektMilepaele() {
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        base44.entities.Milestone.list('-due_date', 200),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setMilestones(m);
      setProjects(p);
      if (p.length > 0 && !selectedProject) setSelectedProject(p[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const projectMilestones = milestones
    .filter((m) => m.project_id === selectedProject)
    .sort((a, b) => (a.order || 0) - (b.order || 0) || (a.due_date || '').localeCompare(b.due_date || ''));

  const project = projects.find((p) => p.id === selectedProject);

  const openNew = () => { setForm({ ...EMPTY, project_id: selectedProject }); setEditing(null); setDialogOpen(true); };
  const openEdit = (m) => { setForm({ ...EMPTY, ...m }); setEditing(m); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const p = projects.find((p) => p.id === form.project_id);
      const payload = { ...form, project_name: p?.name || '', completed_date: form.status === 'Gennemført' ? new Date().toISOString().slice(0, 10) : form.completed_date || '' };
      if (editing) await base44.entities.Milestone.update(editing.id, payload);
      else await base44.entities.Milestone.create(payload);
      setDialogOpen(false);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const remove = async (id) => { if (confirm('Slet denne milepæl?')) { await base44.entities.Milestone.delete(id); load(); } };
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projektmilepæle</h1>
          <p className="text-slate-500 mt-1">Interaktiv tidslinje over vigtige milepæle</p>
        </div>
        <Button onClick={openNew} disabled={!selectedProject} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Milepæl</Button>
      </div>

      <Select value={selectedProject} onValueChange={setSelectedProject}>
        <SelectTrigger className="max-w-md"><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
        <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
      </Select>

      {projectMilestones.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Flag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen milepæle for dette projekt endnu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 ml-5"></div>
            <div className="space-y-5">
              {projectMilestones.map((m) => {
                const style = STATUS_STYLE[m.status] || STATUS_STYLE['Ikke startet'];
                const Icon = style.icon;
                return (
                  <div key={m.id} className="relative flex items-start gap-4 group">
                    <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center shrink-0 z-10`}>
                      <Icon className={`w-5 h-5 ${style.color}`} />
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-900">{m.title}</div>
                          {m.description && <p className="text-sm text-slate-500 mt-1">{m.description}</p>}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(m.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.color}`}>{m.status}</span>
                        {m.due_date && <span className="text-xs text-slate-500">Deadline: {formatDate(m.due_date)}</span>}
                        {m.completed_date && <span className="text-xs text-emerald-600">Gennemført: {formatDate(m.completed_date)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger milepæl' : 'Ny milepæl'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Titel *</Label><Input value={form.title} onChange={set('title')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={set('description')} rows={2} /></div>
            <div className="space-y-1.5"><Label>Projekt</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Deadline</Label><Input type="date" value={form.due_date || ''} onChange={set('due_date')} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.title || !form.project_id}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}