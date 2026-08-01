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
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';

const TASK_COLORS = {
  Gravearbejde: 'bg-amber-100 text-amber-700 border-amber-200',
  Kørsel: 'bg-blue-100 text-blue-700 border-blue-200',
  Maskinarbejde: 'bg-purple-100 text-purple-700 border-purple-200',
  Håndarbejde: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Møde: 'bg-slate-100 text-slate-700 border-slate-200',
  Andet: 'bg-slate-100 text-slate-600 border-slate-200',
};

const DAY_NAMES = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

export default function Planlaegning() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ project_id: '', user_name: '', date: '', hours: '', task_type: 'Håndarbejde', description: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [e, p, t] = await Promise.all([
        base44.entities.Employee.list('-created_date', 100),
        base44.entities.Project.list('-created_date', 100),
        base44.entities.TimeEntry.list('-created_date', 200),
      ]);
      setEmployees(e.filter((emp) => emp.status === 'Aktiv'));
      setProjects(p);
      setEntries(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 + weekOffset * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fmt = (d) => d.toISOString().slice(0, 10);
  const entriesFor = (empName, date) =>
    entries.filter((t) => t.user_name === empName && t.date === fmt(date));

  const totalWeekHours = entries
    .filter((t) => {
      const d = new Date(t.date);
      return d >= weekStart && d < new Date(weekStart.getTime() + 7 * 86400000);
    })
    .reduce((sum, t) => sum + (t.hours || 0), 0);

  const openAdd = (empName, date) => {
    setForm({ project_id: '', user_name: empName, date: fmt(date), hours: '', task_type: 'Håndarbejde', description: '' });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.project_id || !form.hours) return;
    setSaving(true);
    try {
      const project = projects.find((p) => p.id === form.project_id);
      await base44.entities.TimeEntry.create({
        project_id: project.id,
        project_name: project.name,
        user_name: form.user_name,
        date: form.date,
        hours: Number(form.hours),
        task_type: form.task_type,
        description: form.description || '',
      });
      setDialogOpen(false);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Planlægning</h1>
          <p className="text-slate-500 mt-1">Ugeplan for medarbejdere og projektopgaver</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setWeekOffset(0)}>I dag</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(weekOffset + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Uge {weekStart.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })} –{' '}
          {new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className="font-medium text-slate-700">{totalWeekHours} timer registreret</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-40">Medarbejder</th>
                {weekDays.map((d, i) => (
                  <th key={i} className="px-2 py-3 text-center">
                    <div className="text-xs font-semibold text-slate-500 uppercase">{DAY_NAMES[i]}</div>
                    <div className={`text-sm font-bold mt-0.5 ${d.getTime() === today.getTime() ? 'text-amber-600' : 'text-slate-700'}`}>
                      {d.getDate()}/{d.getMonth() + 1}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-2">
                    <div className="font-medium text-sm text-slate-900">{emp.name}</div>
                    <div className="text-xs text-slate-400">{emp.trade}</div>
                  </td>
                  {weekDays.map((d, i) => {
                    const cellEntries = entriesFor(emp.name, d);
                    const isToday = d.getTime() === today.getTime();
                    return (
                      <td key={i} className={`px-1.5 py-1.5 align-top ${isToday ? 'bg-amber-50/50' : ''}`}>
                        <div className="space-y-1 min-h-[60px]">
                          {cellEntries.map((t) => (
                            <div key={t.id} className={`text-xs rounded px-1.5 py-1 border ${TASK_COLORS[t.task_type] || TASK_COLORS.Andet}`}>
                              <div className="font-medium truncate">{t.project_name || '—'}</div>
                              <div className="flex justify-between mt-0.5">
                                <span className="opacity-70">{t.task_type}</span>
                                <span className="font-semibold">{t.hours}t</span>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => openAdd(emp.name, d)}
                            className="w-full text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded py-1 transition-colors flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  Ingen aktive medarbejdere. Tilføj medarbejdere under Medarbejdere.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tilføj opgave – {form.user_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Projekt *</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dato</Label>
                <Input type="date" value={form.date} onChange={set('date')} />
              </div>
              <div className="space-y-1.5">
                <Label>Timer *</Label>
                <Input type="number" value={form.hours} onChange={set('hours')} placeholder="8" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Arbejdstype</Label>
              <Select value={form.task_type} onValueChange={(v) => setForm({ ...form, task_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(TASK_COLORS).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Beskrivelse</Label>
              <Textarea value={form.description} onChange={set('description')} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.project_id || !form.hours}>
              {saving ? 'Gemmer...' : 'Gem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}