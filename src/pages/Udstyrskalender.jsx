import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { Calendar, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Wrench, Filter } from 'lucide-react';

const statusColors = {
  Reserveret: 'bg-blue-500',
  Udleveret: 'bg-amber-500',
  Returneret: 'bg-emerald-500',
  Annulleret: 'bg-slate-400',
};

const statusBadge = {
  Reserveret: 'bg-blue-100 text-blue-700',
  Udleveret: 'bg-amber-100 text-amber-700',
  Returneret: 'bg-emerald-100 text-emerald-700',
  Annulleret: 'bg-slate-100 text-slate-500',
};

const WEEKDAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

function getMonthMatrix(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  const day = (start.getDay() + 6) % 7; // Monday-first
  start.setDate(start.getDate() - day);
  const cells = [];
  const cursor = new Date(start);
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

function dateStr(d) {
  return d.toISOString().split('T')[0];
}

function bookingOnDate(booking, date) {
  const d = dateStr(date);
  return d >= booking.start_date && d <= booking.end_date;
}

const emptyForm = {
  equipment_id: '',
  equipment_name: '',
  project_id: '',
  project_name: '',
  employee_name: '',
  start_date: '',
  end_date: '',
  status: 'Reserveret',
  notes: '',
};

export default function Udstyrskalender() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(new Date());
  const [equipFilter, setEquipFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, eq, pr] = await Promise.all([
        base44.entities.EquipmentBooking.list(),
        base44.entities.Equipment.list().catch(() => []),
        base44.entities.Project.list().catch(() => []),
      ]);
      setBookings(b || []);
      setEquipment(eq || []);
      setProjects(pr || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => getMonthMatrix(year, month), [year, month]);

  const filteredBookings = useMemo(
    () => equipFilter === 'all' ? bookings : bookings.filter((b) => b.equipment_id === equipFilter),
    [bookings, equipFilter]
  );

  const handleField = (f, v) => setForm((s) => ({ ...s, [f]: v }));

  const handleEquipment = (id) => {
    const eq = equipment.find((e) => e.id === id);
    if (eq) setForm((f) => ({ ...f, equipment_id: eq.id, equipment_name: eq.name }));
    else setForm((f) => ({ ...f, equipment_id: '', equipment_name: '' }));
  };

  const handleProject = (id) => {
    const p = projects.find((x) => x.id === id);
    if (p) setForm((f) => ({ ...f, project_id: p.id, project_name: p.name }));
    else setForm((f) => ({ ...f, project_id: '', project_name: '' }));
  };

  const openCreate = (date) => {
    setSelectedDate(date);
    setEditing(null);
    setForm({ ...emptyForm, start_date: date || dateStr(new Date()) });
    setDialogOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({ ...emptyForm, ...b });
    setSelectedDate(null);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.equipment_name || !form.start_date || !form.end_date) {
      alert('Angiv materiel, start- og slutdato');
      return;
    }
    if (form.end_date < form.start_date) { alert('Slutdato skal være efter startdato'); return; }
    setSaving(true);
    try {
      if (editing) await base44.entities.EquipmentBooking.update(editing.id, form);
      else await base44.entities.EquipmentBooking.create(form);
      setDialogOpen(false);
      loadData();
    } catch (e) { console.error(e); alert('Fejl ved lagring'); }
    setSaving(false);
  };

  const remove = async (b) => {
    if (!confirm(`Slet booking af ${b.equipment_name}?`)) return;
    try { await base44.entities.EquipmentBooking.delete(b.id); loadData(); }
    catch (e) { console.error(e); }
  };

  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));
  const today = () => setCursor(new Date());

  const upcoming = useMemo(() => {
    const now = dateStr(new Date());
    return [...filteredBookings]
      .filter((b) => b.end_date >= now && b.status !== 'Annulleret')
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 8);
  }, [filteredBookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Udstyrskalender</h1>
              <p className="text-slate-500 mt-0.5">Se hvornår firmaets maskiner og værktøj er booket</p>
            </div>
          </div>
        </div>
        <Button onClick={() => openCreate()}><Plus className="w-4 h-4" /> Ny booking</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
              <h2 className="text-lg font-semibold text-slate-900 w-44 text-center">
                {cursor.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' })}
              </h2>
              <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={equipFilter} onValueChange={setEquipFilter}>
                <SelectTrigger className="w-44"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Alt udstyr" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alt udstyr</SelectItem>
                  {equipment.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={today}>I dag</Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-500 py-1.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              const inMonth = date.getMonth() === month;
              const isToday = dateStr(date) === dateStr(new Date());
              const dayBookings = filteredBookings.filter((b) => bookingOnDate(b, date));
              return (
                <div
                  key={i}
                  onClick={() => openCreate(dateStr(date))}
                  className={`min-h-[80px] rounded-lg border p-1.5 cursor-pointer hover:border-amber-300 transition ${
                    inMonth ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-50 text-slate-400'
                  } ${isToday ? 'ring-2 ring-amber-400' : ''}`}
                >
                  <div className={`text-xs font-medium mb-1 ${isToday ? 'text-amber-600' : 'text-slate-600'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map((b) => (
                      <div key={b.id} className={`text-[10px] leading-tight px-1 py-0.5 rounded text-white truncate ${statusColors[b.status] || 'bg-slate-400'}`}>
                        {b.equipment_name}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[10px] text-slate-500 px-1">+{dayBookings.length - 3} mere</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
            {Object.entries(statusColors).map(([s, c]) => (
              <div key={s} className="flex items-center gap-1.5 text-xs text-slate-600">
                <div className={`w-3 h-3 rounded ${c}`} /> {s}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming bookings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-600" /> Kommende bookinger
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Ingen kommende bookinger</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((b) => (
                <div key={b.id} className="border border-slate-100 rounded-lg p-3 hover:border-slate-200 transition group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-slate-900 truncate">{b.equipment_name}</div>
                      {b.project_name && <div className="text-xs text-slate-500 truncate mt-0.5">{b.project_name}</div>}
                      {b.employee_name && <div className="text-xs text-slate-500 truncate">👤 {b.employee_name}</div>}
                      <div className="text-xs text-slate-400 mt-1">{formatDate(b.start_date)} – {formatDate(b.end_date)}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge[b.status]}`}>{b.status}</span>
                  </div>
                  <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEdit(b)} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Pencil className="w-3 h-3" /> Rediger</button>
                    <button onClick={() => remove(b)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Slet</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger booking' : 'Ny booking'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Materiel *</Label>
              <Select value={form.equipment_id} onValueChange={handleEquipment}>
                <SelectTrigger><SelectValue placeholder="Vælg udstyr" /></SelectTrigger>
                <SelectContent>
                  {equipment.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.category})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Projekt</Label>
              <Select value={form.project_id} onValueChange={handleProject}>
                <SelectTrigger><SelectValue placeholder="Valgfrit" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Booket af</Label>
              <Input value={form.employee_name} onChange={(e) => handleField('employee_name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fra dato *</Label>
                <Input type="date" value={form.start_date} onChange={(e) => handleField('start_date', e.target.value)} />
              </div>
              <div>
                <Label>Til dato *</Label>
                <Input type="date" value={form.end_date} onChange={(e) => handleField('end_date', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => handleField('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(statusColors).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Noter</Label>
              <Textarea value={form.notes} onChange={(e) => handleField('notes', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}