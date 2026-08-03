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
import { Clock, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

const TASK_TYPES = ['Gravearbejde', 'Kørsel', 'Maskinarbejde', 'Håndarbejde', 'Møde', 'Andet'];

const empty = {
  date: new Date().toISOString().split('T')[0],
  hours: '',
  task_type: 'Håndarbejde',
  description: '',
};

export default function TidsregistreringDialog({ project, onClose }) {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const open = !!project;

  const load = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const me = await base44.auth.me();
      setUser(me);
      const all = await base44.entities.TimeEntry.list('-date', 200);
      setEntries((all || []).filter((t) => t.project_id === project.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setForm(empty);
      load();
    }
  }, [open, project?.id]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const total = entries.reduce((sum, t) => sum + (Number(t.hours) || 0), 0);

  const save = async () => {
    if (!form.hours || Number(form.hours) <= 0) {
      toast({ title: 'Angiv timer', description: 'Indtast et gyldigt antal timer', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const created = await base44.entities.TimeEntry.create({
        project_id: project.id,
        project_name: project.name,
        user_name: user?.full_name || user?.email || '',
        date: form.date,
        hours: Number(form.hours),
        task_type: form.task_type,
        description: form.description,
      });
      setEntries((prev) => [created, ...prev]);
      setForm(empty);
      toast({ title: 'Timer registreret', description: `${project.name}` });
    } catch (e) {
      toast({ title: 'Fejl', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Slet denne tidsregistrering?')) return;
    await base44.entities.TimeEntry.delete(id);
    setEntries((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Tidsregistrering — {project?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">I alt registreret på projektet</span>
            <span className="text-lg font-bold text-slate-900">{total.toFixed(1)} t</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Dato</Label>
              <Input type="date" value={form.date} onChange={set('date')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Timer</Label>
              <Input type="number" step="0.25" value={form.hours} onChange={set('hours')} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Arbejdstype</Label>
              <Select value={form.task_type} onValueChange={(v) => setForm({ ...form, task_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Beskrivelse</Label>
            <Textarea value={form.description} onChange={set('description')} rows={2} placeholder="Hvad er der lavet?" />
          </div>

          <Button onClick={save} disabled={saving} className="w-full bg-slate-950 hover:bg-slate-800">
            <Clock className="w-4 h-4 mr-1.5" /> {saving ? 'Gemmer...' : 'Registrer timer'}
          </Button>

          <div className="border-t border-slate-100 pt-3">
            <div className="text-sm font-medium text-slate-700 mb-2">Seneste registreringer</div>
            {loading ? (
              <div className="text-sm text-slate-400 py-4 text-center">Indlæser...</div>
            ) : entries.length === 0 ? (
              <div className="text-sm text-slate-400 py-4 text-center">Ingen timer registreret endnu</div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {entries.map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-2 bg-white border border-slate-100 rounded-lg p-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-slate-900">{Number(t.hours).toFixed(1)} t</span>
                        <span className="text-xs text-slate-400">{formatDate(t.date)}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{t.task_type}</span>
                      </div>
                      {t.user_name && <div className="text-xs text-slate-500">{t.user_name}</div>}
                      {t.description && <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</div>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => remove(t.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Luk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}