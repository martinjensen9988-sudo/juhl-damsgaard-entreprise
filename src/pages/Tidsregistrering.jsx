import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';

const TASK_TYPES = ['Gravearbejde', 'Kørsel', 'Maskinarbejde', 'Håndarbejde', 'Møde', 'Andet'];

const EMPTY = {
  project_id: '',
  project_name: '',
  user_name: '',
  date: new Date().toISOString().slice(0, 10),
  hours: 1,
  description: '',
  task_type: 'Håndarbejde',
};

export default function Tidsregistrering() {
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [e, p] = await Promise.all([
        base44.entities.TimeEntry.list('-created_date', 200),
        base44.entities.Project.list('-created_date', 200),
      ]);
      setEntries(e);
      setProjects(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = filterProject === 'all'
    ? entries
    : entries.filter((e) => e.project_id === filterProject);

  const totalHours = filtered.reduce((sum, e) => sum + (Number(e.hours) || 0), 0);

  const openNew = () => {
    setForm(EMPTY);
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (e) => {
    setForm({ ...EMPTY, ...e });
    setEditing(e);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const project = projects.find((p) => p.id === form.project_id);
      const payload = {
        ...form,
        hours: Number(form.hours) || 0,
        project_name: project ? project.name : '',
      };
      if (editing) {
        await base44.entities.TimeEntry.update(editing.id, payload);
      } else {
        await base44.entities.TimeEntry.create(payload);
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Slet denne tidsregistrering?')) return;
    await base44.entities.TimeEntry.delete(id);
    load();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Tidsregistrering</h1>
          <p className="text-slate-500 mt-1">Registrer timer på projekter</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Registrer tid
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Label className="text-sm text-slate-600">Filtrer projekt:</Label>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle projekter</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">
          <Clock className="w-4 h-4 inline mr-1.5 text-amber-400" />
          Total: <span className="font-bold">{totalHours.toFixed(1)} timer</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen tidsregistreringer endnu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Dato</th>
                  <th className="px-4 py-3">Medarbejder</th>
                  <th className="px-4 py-3">Projekt</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Timer</th>
                  <th className="px-4 py-3">Beskrivelse</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{e.user_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{e.project_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{e.task_type}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{Number(e.hours).toFixed(1)}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{e.description || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(e.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger tidsregistrering' : 'Registrer tid'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Projekt *</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Medarbejder</Label>
              <Input value={form.user_name} onChange={set('user_name')} placeholder="Navn" />
            </div>
            <div className="space-y-1.5">
              <Label>Dato</Label>
              <Input type="date" value={form.date || ''} onChange={set('date')} />
            </div>
            <div className="space-y-1.5">
              <Label>Timer</Label>
              <Input type="number" step="0.5" value={form.hours} onChange={set('hours')} />
            </div>
            <div className="space-y-1.5">
              <Label>Arbejdstype</Label>
              <Select value={form.task_type} onValueChange={(v) => setForm({ ...form, task_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Beskrivelse</Label>
              <Textarea value={form.description || ''} onChange={set('description')} rows={2} placeholder="Hvad er der blevet lavet?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.project_id}>
              {saving ? 'Gemmer...' : 'Gem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}