import React, { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { Calendar, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Wrench, Filter, GripVertical, FolderInput, CheckCircle2 } from 'lucide-react';

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
  const day = (start.getDay() + 6) % 7;
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function bookingOnDate(booking, date) {
  const d = dateStr(date);
  return d >= booking.start_date && d <= booking.end_date;
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
function addDaysStr(dateStrVal, n) {
  const d = new Date(dateStrVal);
  d.setDate(d.getDate() + n);
  return dateStr(d);
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
  const dragId = useRef(null);
  const [dragOver, setDragOver] = useState(null);

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

  // active (non-archived) projects for the board columns
  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== 'Afsluttet' && p.status !== 'På hold'),
    [projects]
  );

  // bookings grouped by project (only active bookings)
  const bookingsByProject = useMemo(() => {
    const map = {};
    filteredBookings.filter((b) => b.status !== 'Annulleret').forEach((b) => {
      const key = b.project_id || '__none';
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return map;
  }, [filteredBookings]);

  // For a given equipment id, is it free on a given date?
  const isEquipmentFreeOn = (eqId, date) => {
    const d = dateStr(date);
    return !bookings.some((b) => b.equipment_id === eqId && b.status !== 'Annulleret' && d >= b.start_date && d <= b.end_date);
  };

  const showAvailability = equipFilter !== 'all';

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
    const start = date || dateStr(new Date());
    setForm({ ...emptyForm, start_date: start, end_date: start, equipment_id: equipFilter !== 'all' ? equipFilter : '', equipment_name: equipFilter !== 'all' ? (equipment.find((e) => e.id === equipFilter)?.name || '') : '' });
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

  // Drag & drop: move booking to a new start date (preserve duration)
  const moveBookingToDate = async (bookingId, newStartStr) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return;
    if (b.start_date === newStartStr) return;
    const duration = daysBetween(b.start_date, b.end_date);
    const newEnd = addDaysStr(newStartStr, duration);
    try {
      await base44.entities.EquipmentBooking.update(bookingId, { start_date: newStartStr, end_date: newEnd });
      loadData();
    } catch (e) { console.error(e); alert('Kunne ikke flytte bookingen'); }
  };

  // Drag & drop: reassign booking to a different project
  const moveBookingToProject = async (bookingId, projectId) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return;
    let projectIdVal = projectId;
    let projectName = '';
    if (projectId && projectId !== '__none') {
      const p = projects.find((x) => x.id === projectId);
      projectName = p?.name || '';
    } else {
      projectIdVal = '';
    }
    if (b.project_id === projectIdVal) return;
    try {
      await base44.entities.EquipmentBooking.update(bookingId, { project_id: projectIdVal, project_name: projectName });
      loadData();
    } catch (e) { console.error(e); alert('Kunne ikke omtildele bookingen'); }
  };

  const onChipDragStart = (e, b) => {
    dragId.current = b.id;
    e.dataTransfer.effectAllowed = 'move';
  };
  const onCellDrop = (e, date) => {
    e.preventDefault();
    setDragOver(null);
    if (dragId.current) moveBookingToDate(dragId.current, dateStr(date));
    dragId.current = null;
  };
  const onColumnDrop = (e, projectKey) => {
    e.preventDefault();
    setDragOver(null);
    if (dragId.current) moveBookingToProject(dragId.current, projectKey);
    dragId.current = null;
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

  // free-day count this month for selected equipment
  const freeCount = useMemo(() => {
    if (!showAvailability) return 0;
    let n = 0;
    cells.forEach((d) => { if (d.getMonth() === month && isEquipmentFreeOn(equipFilter, d)) n++; });
    return n;
  }, [cells, month, equipFilter, showAvailability, bookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Udstyrskalender</h1>
            <p className="text-slate-500 mt-0.5">Træk bookinger mellem datoer og projekter · se ledige datoer</p>
          </div>
        </div>
        <Button onClick={() => openCreate()}><Plus className="w-4 h-4" /> Ny booking</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
              <h2 className="text-lg font-semibold text-slate-900 w-44 text-center">
                {cursor.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' })}
              </h2>
              <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={equipFilter} onValueChange={setEquipFilter}>
                <SelectTrigger className="w-48"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Alt udstyr" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alt udstyr</SelectItem>
                  {equipment.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={today}>I dag</Button>
            </div>
          </div>

          {showAvailability && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-50 rounded-lg text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              {freeCount} ledige dage i denne måned for {equipment.find((e) => e.id === equipFilter)?.name || 'valgt udstyr'}
            </div>
          )}

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-500 py-1.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              const inMonth = date.getMonth() === month;
              const isToday = dateStr(date) === dateStr(new Date());
              const dayBookings = filteredBookings.filter((b) => bookingOnDate(b, date) && b.status !== 'Annulleret');
              const free = showAvailability && isEquipmentFreeOn(equipFilter, date);
              const over = dragOver === `cell-${i}`;
              return (
                <div
                  key={i}
                  onClick={() => openCreate(dateStr(date))}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(`cell-${i}`); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => onCellDrop(e, date)}
                  className={`min-h-[80px] rounded-lg border p-1.5 cursor-pointer transition ${
                    inMonth ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-50 text-slate-400'
                  } ${isToday ? 'ring-2 ring-amber-400' : ''} ${over ? 'border-amber-400 bg-amber-50' : ''} ${free && inMonth ? 'border-l-2 border-l-emerald-400' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${isToday ? 'text-amber-600' : 'text-slate-600'}`}>{date.getDate()}</span>
                    {free && inMonth && <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1 rounded">Ledig</span>}
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {dayBookings.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        draggable
                        onDragStart={(e) => onChipDragStart(e, b)}
                        onClick={(e) => { e.stopPropagation(); openEdit(b); }}
                        className={`text-[10px] leading-tight px-1 py-0.5 rounded text-white truncate flex items-center gap-0.5 cursor-grab active:cursor-grabbing ${statusColors[b.status] || 'bg-slate-400'}`}
                        title={`${b.equipment_name} · ${b.project_name || 'Uden projekt'} · ${formatDate(b.start_date)} – ${formatDate(b.end_date)}`}
                      >
                        <GripVertical className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />
                        <span className="truncate">{b.equipment_name}</span>
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
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
            {Object.entries(statusColors).map(([s, c]) => (
              <div key={s} className="flex items-center gap-1.5 text-xs text-slate-600">
                <div className={`w-3 h-3 rounded ${c}`} /> {s}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <div className="w-3 h-3 rounded border-l-2 border-emerald-400 bg-white border border-slate-200" /> Ledig dato
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
              <GripVertical className="w-3 h-3" /> Træk chips for at flytte
            </div>
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

      {/* Project board — drag bookings between projects */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <FolderInput className="w-4 h-4 text-amber-600" /> Træk bookinger mellem projekter
        </h3>
        <p className="text-sm text-slate-500 mb-4">Træk en booking-chip fra kalenderen eller fra en kolonne over i et andet projekt for at omtildele den.</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {/* Unassigned column */}
          <ProjectColumn
            title="Uden projekt"
            count={(bookingsByProject['__none'] || []).length}
            bookings={bookingsByProject['__none'] || []}
            onDrop={(e) => onColumnDrop(e, '__none')}
            onDragOver={(e) => { e.preventDefault(); setDragOver('col-none'); }}
            onDragLeave={() => setDragOver(null)}
            highlight={dragOver === 'col-none'}
            onChipDragStart={onChipDragStart}
            onEdit={openEdit}
            onDelete={remove}
            accent="bg-slate-200"
          />
          {activeProjects.map((p) => (
            <ProjectColumn
              key={p.id}
              title={p.name}
              count={(bookingsByProject[p.id] || []).length}
              bookings={bookingsByProject[p.id] || []}
              onDrop={(e) => onColumnDrop(e, p.id)}
              onDragOver={(e) => { e.preventDefault(); setDragOver(`col-${p.id}`); }}
              onDragLeave={() => setDragOver(null)}
              highlight={dragOver === `col-${p.id}`}
              onChipDragStart={onChipDragStart}
              onEdit={openEdit}
              onDelete={remove}
              accent="bg-amber-400"
            />
          ))}
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

function ProjectColumn({ title, count, bookings, onDrop, onDragOver, onDragLeave, highlight, onChipDragStart, onEdit, onDelete, accent }) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`flex-shrink-0 w-64 rounded-xl border p-3 transition ${highlight ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full ${accent}`} />
          <span className="font-medium text-sm text-slate-900 truncate">{title}</span>
        </div>
        <span className="text-xs font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-1.5 min-h-[60px]">
        {bookings.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-lg">Slip her</div>
        ) : bookings.map((b) => (
          <div
            key={b.id}
            draggable
            onDragStart={(e) => onChipDragStart(e, b)}
            className="bg-white border border-slate-200 rounded-lg p-2 cursor-grab active:cursor-grabbing hover:border-slate-300 hover:shadow-sm transition group"
          >
            <div className="flex items-center gap-1">
              <GripVertical className="w-3 h-3 text-slate-300 flex-shrink-0" />
              <span className="text-xs font-medium text-slate-900 truncate flex-1">{b.equipment_name}</span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[b.status] || 'bg-slate-400'}`} />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 ml-4">{formatDate(b.start_date)} – {formatDate(b.end_date)}</div>
            <div className="flex gap-1.5 mt-1 ml-4 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => onEdit(b)} className="text-[10px] text-slate-500 hover:text-slate-900 flex items-center gap-0.5"><Pencil className="w-2.5 h-2.5" /> Rediger</button>
              <button onClick={() => onDelete(b)} className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-0.5"><Trash2 className="w-2.5 h-2.5" /> Slet</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}