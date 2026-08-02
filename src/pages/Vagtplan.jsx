import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';

const roles = ['Vicevært', 'Snerydning', 'Drift', 'Vagt', 'Andet'];
const roleColor = { Vicevært: 'bg-blue-500', Snerydning: 'bg-cyan-500', Drift: 'bg-amber-500', Vagt: 'bg-emerald-500', Andet: 'bg-slate-400' };
const statusColor = { Planlagt: 'bg-slate-100 text-slate-600', Gennemført: 'bg-emerald-100 text-emerald-700', Aflyst: 'bg-red-100 text-red-700' };

function weekDays(monday) {
  const arr = [];
  const c = new Date(monday);
  for (let i = 0; i < 7; i++) { arr.push(new Date(c)); c.setDate(c.getDate() + 1); }
  return arr;
}
function dStr(d) { return d.toISOString().split('T')[0]; }
function mondayOf(d) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x; }

const empty = { employee_name: '', role: 'Vagt', date: '', start_time: '07:00', end_time: '15:00', location: '', status: 'Planlagt', notes: '' };

export default function Vagtplan() {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(mondayOf(new Date()));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([base44.entities.Shift.list(), base44.entities.Employee.list().catch(() => [])]);
      setShifts(s || []); setEmployees(e || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const todayStr = dStr(new Date());

  const shiftsForDay = (date) => shifts.filter((s) => s.date === dStr(date) && s.status !== 'Aflyst').sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const openCreate = (date) => { setEditing(null); setForm({ ...empty, date: date || dStr(new Date()) }); setOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...empty, ...s }); setOpen(true); };

  const save = async () => {
    if (!form.employee_name || !form.date) return alert('Angiv medarbejder og dato');
    setSaving(true);
    try { editing ? await base44.entities.Shift.update(editing.id, form) : await base44.entities.Shift.create(form); setOpen(false); load(); }
    catch (e) { console.error(e); alert('Fejl'); }
    setSaving(false);
  };
  const remove = async (s) => { if (!confirm('Slet vagt?')) return; try { await base44.entities.Shift.delete(s.id); load(); } catch (e) {} };

  const stats = useMemo(() => ({
    total: shifts.filter((s) => days.some((d) => dStr(d) === s.date)).length,
    today: shifts.filter((s) => s.date === todayStr && s.status !== 'Aflyst').length,
    snow: shifts.filter((s) => s.role === 'Snerydning').length,
    janitor: shifts.filter((s) => s.role === 'Vicevært').length,
  }), [shifts, days, todayStr]);

  const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const WD = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center"><CalendarClock className="w-5 h-5 text-cyan-600" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Vagtplan</h1>
            <p className="text-slate-500 mt-0.5">Se hvem der er på arbejde hvornår — vicevært & snerydning</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * 86400000))}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(mondayOf(new Date()))}>Denne uge</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * 86400000))}><ChevronRight className="w-4 h-4" /></Button>
          <Button onClick={() => openCreate()}><Plus className="w-4 h-4" /> Ny vagt</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Vagter denne uge', stats.total, 'text-slate-900'], ['I dag', stats.today, 'text-emerald-600'], ['Snerydning', stats.snow, 'text-cyan-600'], ['Vicevært', stats.janitor, 'text-blue-600']].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">{l}</div><div className={`text-2xl font-bold ${c}`}>{v}</div></div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[700px]">
          {days.map((d, i) => {
            const ds = dStr(d); const isToday = ds === todayStr;
            const dayShifts = shiftsForDay(d);
            return (
              <div key={i} className={`rounded-xl border p-2 min-h-[180px] ${isToday ? 'border-cyan-400 bg-cyan-50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div><div className="text-xs text-slate-400">{WD[i]}</div><div className={`text-sm font-semibold ${isToday ? 'text-cyan-700' : 'text-slate-700'}`}>{d.getDate()}. {monthNames[d.getMonth()]}</div></div>
                  <button onClick={() => openCreate(ds)} className="text-slate-300 hover:text-slate-600"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="space-y-1.5">
                  {dayShifts.map((s) => (
                    <div key={s.id} className="bg-white rounded-lg p-2 border border-slate-100 group cursor-pointer hover:border-slate-300" onClick={() => openEdit(s)}>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${roleColor[s.role] || 'bg-slate-400'}`} />
                        <span className="text-xs font-medium text-slate-900 truncate flex-1">{s.employee_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 ml-3.5">{s.start_time}–{s.end_time}</div>
                      {s.location && <div className="text-[10px] text-slate-400 ml-3.5 truncate">📍 {s.location}</div>}
                      <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(s); }} className="text-slate-400 hover:text-slate-700"><Pencil className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); remove(s); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                  {dayShifts.length === 0 && <div className="text-[10px] text-slate-300 text-center py-3">Ingen vagter</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger vagt' : 'Ny vagt'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Medarbejder *</Label><Input value={form.employee_name} onChange={(e) => set('employee_name', e.target.value)} placeholder="Navn" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Rolle</Label><Select value={form.role} onValueChange={(v) => set('role', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Dato *</Label><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start</Label><Input type="time" value={form.start_time} onChange={(e) => set('start_time', e.target.value)} /></div>
              <div><Label>Slut</Label><Input type="time" value={form.end_time} onChange={(e) => set('end_time', e.target.value)} /></div>
            </div>
            <div><Label>Lokation</Label><Input value={form.location} onChange={(e) => set('location', e.target.value)} /></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(statusColor).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}