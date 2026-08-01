import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CalendarDays, Wrench, Plus, Loader2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/format';

const STATUS_COLORS = {
  Reserveret: 'bg-blue-100 text-blue-700 border-blue-200',
  Udleveret: 'bg-amber-100 text-amber-700 border-amber-200',
  Returneret: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Annulleret: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function MaterielBooking() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    equipment_id: '',
    equipment_name: '',
    project_id: '',
    project_name: '',
    employee_name: '',
    start_date: '',
    end_date: '',
    notes: '',
  });

  const loadAll = async () => {
    try {
      const [b, e, p] = await Promise.all([
        base44.entities.EquipmentBooking.list(),
        base44.entities.Equipment.list(),
        base44.entities.Project.list(),
      ]);
      setBookings(b);
      setEquipment(e);
      setProjects(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const startOffset = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
  const isInRange = (date, start, end) => {
    if (!date || !start || !end) return false;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(new Date(start).getFullYear(), new Date(start).getMonth(), new Date(start).getDate());
    const e = new Date(new Date(end).getFullYear(), new Date(end).getMonth(), new Date(end).getDate());
    return d >= s && d <= e;
  };

  const bookingsForDay = (day) => {
    if (!day) return [];
    return bookings.filter((b) => isInRange(day, b.start_date, b.end_date));
  };

  const monthName = currentMonth.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);

  const openNew = () => {
    setForm({ equipment_id: '', equipment_name: '', project_id: '', project_name: '', employee_name: '', start_date: '', end_date: '', notes: '' });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.equipment_id || !form.start_date || !form.end_date) return;
    setSaving(true);
    try {
      const eq = equipment.find((e) => e.id === form.equipment_id);
      const proj = projects.find((p) => p.id === form.project_id);
      await base44.entities.EquipmentBooking.create({
        ...form,
        equipment_name: eq?.name || form.equipment_name,
        project_name: proj?.name || form.project_name,
        status: 'Reserveret',
      });
      setShowDialog(false);
      await loadAll();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const removeBooking = async (id) => {
    await base44.entities.EquipmentBooking.delete(id);
    await loadAll();
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Wrench className="w-6 h-6 text-amber-500" /> Værktøjsbooking</h1>
          <p className="text-sm text-slate-500 mt-1">Book materiel og værktøj til igangværende projekter</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Ny booking</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 capitalize flex items-center gap-2"><CalendarDays className="w-5 h-5 text-amber-500" />{monthName}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const dayBookings = bookingsForDay(day);
              const isToday = sameDay(day, new Date());
              return (
                <div
                  key={idx}
                  className={`min-h-[80px] p-1.5 rounded-lg border ${day ? 'border-slate-200' : 'border-transparent'} ${isToday ? 'bg-amber-50 border-amber-300' : 'bg-white'}`}
                >
                  {day && (
                    <>
                      <div className={`text-xs font-medium mb-1 ${isToday ? 'text-amber-600' : 'text-slate-500'}`}>{day.getDate()}</div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 2).map((b) => (
                          <div key={b.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate ${STATUS_COLORS[b.status] || 'bg-slate-100'}`} title={`${b.equipment_name} • ${b.project_name || ''}`}>
                            {b.equipment_name}
                          </div>
                        ))}
                        {dayBookings.length > 2 && <div className="text-[10px] text-slate-400">+{dayBookings.length - 2} flere</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Kommende bookinger</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {bookings
              .filter((b) => new Date(b.end_date || b.start_date) >= new Date(new Date().toDateString()))
              .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
              .map((b) => (
                <div key={b.id} className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-slate-900">{b.equipment_name}</div>
                      <div className="text-xs text-slate-500">{b.project_name || 'Ingen projekt'}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {formatDate(b.start_date)} – {formatDate(b.end_date)}
                      </div>
                      {b.employee_name && <div className="text-xs text-slate-400">Booket af: {b.employee_name}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[b.status] || 'bg-slate-100'}`}>{b.status}</span>
                      <button onClick={() => removeBooking(b.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            {bookings.length === 0 && <div className="text-center text-sm text-slate-400 py-8">Ingen bookinger</div>}
          </div>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ny værktøjsbooking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Materiel / værktøj</Label>
              <Select value={form.equipment_id} onValueChange={(v) => setForm({ ...form, equipment_id: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg materiel" /></SelectTrigger>
                <SelectContent>
                  {equipment.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} {e.serial_number ? `(${e.serial_number})` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fra dato</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Til dato</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Projekt</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg projekt (valgfrit)" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Booket af</Label>
              <Input value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} placeholder="Medarbejder" />
            </div>
            <div className="space-y-1.5">
              <Label>Noter</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.equipment_id || !form.start_date || !form.end_date}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Opret booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}