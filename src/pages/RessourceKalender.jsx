import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Users, Wrench, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function RessourceKalender() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [cursor, setCursor] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ type: 'udstyr', resourceId: '', projectId: '', startDate: '', endDate: '' });

  useEffect(() => {
    (async () => {
      try {
        const [b, a, p, eq, emps] = await Promise.all([
          base44.entities.EquipmentBooking.list('-created_date', 300).catch(() => []),
          base44.entities.Assignment.list('-created_date', 300).catch(() => []),
          base44.entities.Project.list('-created_date', 200).catch(() => []),
          base44.entities.Equipment.list('-created_date', 200).catch(() => []),
          base44.entities.Employee.list('-created_date', 200).catch(() => []),
        ]);
        setBookings(b); setAssignments(a); setProjects(p); setEquipment(eq); setEmployees(emps);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  const events = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      if (!b.start_date || !b.end_date) return;
      const s = new Date(b.start_date); const e = new Date(b.end_date);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() === month && d.getFullYear() === year) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          map[day].push({ type: 'udstyr', title: b.equipment_name, project: b.project_name, person: b.employee_name });
        }
      }
    });
    assignments.forEach((a) => {
      if (!a.date) return;
      const d = new Date(a.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push({ type: 'medarbejder', title: a.employee_name, project: a.project_name });
      }
    });
    return map;
  }, [bookings, assignments, month, year]);

  async function createBooking() {
    try {
      if (form.type === 'udstyr') {
        const eq = equipment.find((e) => e.id === form.resourceId);
        const proj = projects.find((p) => p.id === form.projectId);
        await base44.entities.EquipmentBooking.create({
          equipment_id: form.resourceId,
          equipment_name: eq?.name || '',
          project_id: form.projectId,
          project_name: proj?.name || '',
          start_date: form.startDate,
          end_date: form.endDate,
          status: 'Reserveret',
        });
      } else {
        const emp = employees.find((e) => e.id === form.resourceId);
        const proj = projects.find((p) => p.id === form.projectId);
        await base44.entities.Assignment.create({
          employee_name: emp?.name || '',
          project_id: form.projectId,
          project_name: proj?.name || '',
          date: form.startDate,
          notes: `Allokering ${form.startDate}${form.endDate !== form.startDate ? ` til ${form.endDate}` : ''}`,
        });
      }
      setDialogOpen(false);
      setForm({ type: 'udstyr', resourceId: '', projectId: '', startDate: '', endDate: '' });
      const [b, a] = await Promise.all([
        base44.entities.EquipmentBooking.list('-created_date', 300),
        base44.entities.Assignment.list('-created_date', 300),
      ]);
      setBookings(b); setAssignments(a);
    } catch (err) { alert(err.message); }
  }

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" /></div>;

  const monthName = ['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December'][month];
  const weekdays = ['Man','Tir','Ons','Tor','Fre','Lør','Søn'];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Ressource Kalender</h1>
          <p className="text-slate-500 mt-1">Planlagt brug af udstyr og medarbejderallokering på tværs af alle projekter</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Ny allokering</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-amber-600" /> {monthName} {year}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>I dag</Button>
              <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdays.map((w) => <div key={w} className="text-center text-xs font-medium text-slate-400 py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} className="min-h-[80px] rounded-lg bg-slate-50/50" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = events[day] || [];
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
              return (
                <div key={day} className={`min-h-[80px] rounded-lg border p-1.5 ${isToday ? 'border-amber-400 bg-amber-50/50' : 'border-slate-100'}`}>
                  <div className={`text-xs font-medium mb-1 ${isToday ? 'text-amber-600' : 'text-slate-500'}`}>{day}</div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev, j) => (
                      <div key={j} className={`text-[10px] px-1.5 py-0.5 rounded truncate ${ev.type === 'udstyr' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {ev.type === 'udstyr' ? <Wrench className="w-2.5 h-2.5 inline mr-0.5" /> : <Users className="w-2.5 h-2.5 inline mr-0.5" />}
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && <div className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 3} flere</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-blue-100" /> Udstyrsbooking</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-emerald-100" /> Medarbejderallokering</div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ny allokering</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-1">
                <Button variant={form.type === 'udstyr' ? 'default' : 'outline'} size="sm" onClick={() => setForm((f) => ({ ...f, type: 'udstyr', resourceId: '' }))}>Udstyr</Button>
                <Button variant={form.type === 'medarbejder' ? 'default' : 'outline'} size="sm" onClick={() => setForm((f) => ({ ...f, type: 'medarbejder', resourceId: '' }))}>Medarbejder</Button>
              </div>
            </div>
            <div>
              <Label>{form.type === 'udstyr' ? 'Udstyr' : 'Medarbejder'}</Label>
              <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={form.resourceId} onChange={(e) => setForm((f) => ({ ...f, resourceId: e.target.value }))}>
                <option value="">Vælg…</option>
                {form.type === 'udstyr' ? equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>) : employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Projekt</Label>
              <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}>
                <option value="">— ingen —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{form.type === 'medarbejder' ? 'Dato' : 'Fra dato'}</Label><Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></div>
              {form.type === 'udstyr' && <div><Label>Til dato</Label><Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} /></div>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={createBooking} disabled={!form.resourceId || !form.startDate || (form.type === 'udstyr' && !form.endDate)}>Opret</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}