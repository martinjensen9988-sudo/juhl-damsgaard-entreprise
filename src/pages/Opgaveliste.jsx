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
import { Plus, Pencil, Trash2, ListChecks, Loader2, Calendar, User } from 'lucide-react';
import { formatDate } from '@/lib/format';
import PullToRefresh from '@/components/PullToRefresh';

const STATUSES = ['Ikke startet', 'I gang', 'Afventer', 'Gennemført'];
const PRIORITIES = ['Lav', 'Normal', 'Høj'];

const STATUS_BADGE = {
  'Ikke startet': 'bg-slate-100 text-slate-600',
  'I gang': 'bg-blue-100 text-blue-700',
  'Afventer': 'bg-amber-100 text-amber-700',
  'Gennemført': 'bg-emerald-100 text-emerald-700',
};

const PRIORITY_BADGE = {
  Lav: 'bg-slate-100 text-slate-500',
  Normal: 'bg-blue-100 text-blue-600',
  Høj: 'bg-red-100 text-red-700',
};

const EMPTY = {
  title: '',
  description: '',
  assigned_to: '',
  status: 'Ikke startet',
  priority: 'Normal',
  due_date: '',
  completed_date: '',
};

export default function Opgaveliste() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const [t, e] = await Promise.all([
        base44.entities.Task.list('-created_date', 200),
        base44.entities.Employee.list('-created_date', 100),
      ]);
      setTasks(t);
      setEmployees(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refresh = async () => {
    try {
      const [t, e] = await Promise.all([
        base44.entities.Task.list('-created_date', 200),
        base44.entities.Employee.list('-created_date', 100),
      ]);
      setTasks(t);
      setEmployees(e);
    } catch (err) {
      console.error(err);
    }
  };

  const openNew = () => {
    setForm(EMPTY);
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (t) => {
    setForm({ ...EMPTY, ...t });
    setEditing(t);
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing) {
        await base44.entities.Task.update(editing.id, payload);
      } else {
        await base44.entities.Task.create(payload);
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
    if (!confirm('Slet denne opgave?')) return;
    const prev = tasks;
    setTasks(tasks.filter((t) => t.id !== id));
    try {
      await base44.entities.Task.delete(id);
    } catch (err) {
      console.error(err);
      setTasks(prev);
      alert('Kunne ikke slette opgaven');
    }
  };

  const quickStatus = async (task, status) => {
    const completed_date = status === 'Gennemført' ? new Date().toISOString().slice(0, 10) : '';
    const prev = tasks;
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status, completed_date } : t)));
    try {
      await base44.entities.Task.update(task.id, { status, completed_date });
    } catch (err) {
      console.error(err);
      setTasks(prev);
      alert('Kunne ikke opdatere status');
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const filtered = tasks.filter((t) => filterStatus === 'all' || t.status === filterStatus);

  const stats = STATUSES.map((s) => ({ status: s, count: tasks.filter((t) => t.status === s).length }));

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Opgaveliste</h1>
          <p className="text-slate-500 mt-1">Interne opgaver – tildel og overvåg mindre opgaver</p>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Ny opgave
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.status} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{s.count}</div>
            <div className="text-sm text-slate-500">{s.status}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statusser</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-slate-500">{filtered.length} opgaver</div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <ListChecks className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen opgaver fundet. Opret den første opgave.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className={`font-semibold text-slate-900 ${t.status === 'Gennemført' ? 'line-through text-slate-400' : ''}`}>{t.title}</h3>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_BADGE[t.priority] || 'bg-slate-100 text-slate-500'}`}>
                      {t.priority}
                    </span>
                  </div>
                  {t.description && <p className="text-sm text-slate-600 mb-2">{t.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    {t.assigned_to && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> {t.assigned_to}
                      </span>
                    )}
                    {t.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(t.due_date)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={t.status} onValueChange={(v) => quickStatus(t, v)}>
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                    <Pencil className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger opgave' : 'Ny opgave'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Titel *</Label>
              <Input value={form.title} onChange={set('title')} placeholder="F.eks. Bestil nyt stillads" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Beskrivelse</Label>
              <Textarea value={form.description} onChange={set('description')} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Tildelt til</Label>
              <Select value={form.assigned_to} onValueChange={(v) => setForm({ ...form, assigned_to: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg medarbejder" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioritet</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Input type="date" value={form.due_date || ''} onChange={set('due_date')} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.title}>
              {saving ? 'Gemmer...' : 'Gem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PullToRefresh>
  );
}