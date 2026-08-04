import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';

export default function MaTid() {
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    project_id: '',
    project_name: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    task_type: 'Håndarbejde',
  });

  const load = useCallback(async () => {
    const [u, te, pr] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.TimeEntry.list('-date', 100).catch(() => []),
      base44.entities.Project.list().catch(() => []),
    ]);
    setUser(u);
    setEntries(te || []);
    setProjects(pr || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const myName = user?.full_name || '';
  const myEntries = entries.filter((e) => !e.user_name || e.user_name === myName);

  const grouped = myEntries.reduce((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const save = async () => {
    if (!form.hours || !form.project_id) { alert('Vælg projekt og angiv timer'); return; }
    try {
      await base44.entities.TimeEntry.create({
        ...form,
        hours: Number(form.hours),
        user_name: myName,
      });
      setOpen(false);
      setForm({ project_id: '', project_name: '', description: '', date: new Date().toISOString().split('T')[0], hours: '', task_type: 'Håndarbejde' });
      load();
    } catch (e) { alert('Kunne ikke gemme'); }
  };

  const remove = async (id) => {
    if (!confirm('Slet tidsregistrering?')) return;
    try { await base44.entities.TimeEntry.delete(id); load(); } catch (e) {}
  };

  const dayTotal = (day) => grouped[day].reduce((s, e) => s + (e.hours || 0), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Tidsregistrering</h1>
        <Button size="sm" onClick={() => setOpen(true)} className="bg-slate-950">
          <Plus className="w-4 h-4" /> Tilføj
        </Button>
      </div>

      {dates.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Ingen tidsregistreringer endnu</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dates.map((day) => (
            <div key={day}>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(day).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="text-sm font-bold text-slate-900">{dayTotal(day)}t</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {grouped[day].map((e) => (
                  <div key={e.id} className="p-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{e.description || e.task_type || 'Arbejde'}</div>
                      <div className="text-[11px] text-slate-500 truncate">{e.project_name || 'Ingen projekt'}</div>
                    </div>
                    <div className="text-sm font-bold text-slate-900">{e.hours}t</div>
                    <button onClick={() => remove(e.id)} className="text-slate-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-w-md mx-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Registrer tid</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Projekt</Label>
              <Select value={form.project_id} onValueChange={(id) => {
                const p = projects.find((x) => x.id === id);
                setForm((f) => ({ ...f, project_id: id, project_name: p?.name || '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arbejdstype</Label>
              <Select value={form.task_type} onValueChange={(v) => setForm((f) => ({ ...f, task_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Gravearbejde', 'Kørsel', 'Maskinarbejde', 'Håndarbejde', 'Møde', 'Andet'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Beskrivelse</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Hvad har du lavet?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dato</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label>Timer</Label>
                <Input type="number" step="0.25" value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} placeholder="0" />
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save} className="bg-slate-950">Gem tid</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}