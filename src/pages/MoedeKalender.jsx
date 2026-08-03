import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, Users } from 'lucide-react';

const TYPES = ['Besigtigelse', 'Kundemøde', 'Tilbudsgennemgang', 'Opfølgning', 'Byggemøde', 'Andet'];
const STATUSES = ['Forespurgt', 'Bekræftet', 'Gennemført', 'Aflyst'];
const STATUS_COLORS = {
  Forespurgt: 'bg-slate-100 text-slate-600',
  Bekræftet: 'bg-blue-100 text-blue-700',
  Gennemført: 'bg-green-100 text-green-700',
  Aflyst: 'bg-red-100 text-red-700',
};
const TYPE_DOT = {
  Besigtigelse: 'bg-purple-500',
  Kundemøde: 'bg-blue-500',
  Tilbudsgennemgang: 'bg-amber-500',
  Opfølgning: 'bg-teal-500',
  Byggemøde: 'bg-emerald-500',
  Andet: 'bg-slate-400',
};

const emptyForm = {
  title: '', customer_name: '', customer_email: '', customer_phone: '',
  meeting_type: 'Byggemøde', date: new Date().toISOString().slice(0, 10),
  time: '09:00', duration_minutes: 60, address: '', employee_name: '',
  attendees: '', agenda: '', status: 'Forespurgt', notes: '',
};

const monthName = (d) => d.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });

export default function MoedeKalender() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setMeetings(await base44.entities.MeetingBooking.list('-date', 500));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const byDate = useMemo(() => {
    const map = {};
    meetings.forEach((m) => {
      if (!m.date) return;
      const key = m.date;
      (map[key] = map[key] || []).push(m);
    });
    return map;
  }, [meetings]);

  const fmtKey = (d) => d.toISOString().slice(0, 10);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return meetings
      .filter((m) => m.date && m.date >= today && m.status !== 'Aflyst')
      .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
      .slice(0, 6);
  }, [meetings]);

  const openCreate = (date) => {
    setForm({ ...emptyForm, date: date ? fmtKey(date) : new Date().toISOString().slice(0, 10) });
    setEditId(null);
    setShowForm(true);
  };
  const openEdit = (m) => { setForm({ ...emptyForm, ...m }); setEditId(m.id); setShowForm(true); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await base44.entities.MeetingBooking.update(editId, form);
        toast({ title: 'Møde opdateret' });
      } else {
        await base44.entities.MeetingBooking.create(form);
        toast({ title: 'Møde oprettet' });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    }
  };

  const remove = async (m) => {
    if (!window.confirm('Slet møde?')) return;
    try {
      await base44.entities.MeetingBooking.delete(m.id);
      toast({ title: 'Møde slettet' });
      await load();
    } catch (err) {
      toast({ title: 'Fejl', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mødekalender</h1>
          <p className="text-slate-500 text-sm mt-1">Planlægning af byggemøder, pladsgennemgang og kundemøder.</p>
        </div>
        <Button onClick={() => openCreate()}><Plus className="w-4 h-4" /> Opret møde</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 capitalize">{monthName(cursor)}</h2>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>I dag</Button>
              <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-1">
            {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((d, i) => {
              if (!d) return <div key={i} className="min-h-[72px] rounded-lg bg-slate-50/50" />;
              const key = fmtKey(d);
              const dayMeetings = byDate[key] || [];
              const isToday = key === new Date().toISOString().slice(0, 10);
              return (
                <button
                  key={i}
                  onClick={() => openCreate(d)}
                  className={`min-h-[72px] rounded-lg border p-1.5 text-left hover:border-blue-400 transition-colors ${
                    isToday ? 'border-blue-400 bg-blue-50/50' : 'border-slate-100'
                  }`}
                >
                  <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>{d.getDate()}</div>
                  <div className="mt-1 space-y-0.5">
                    {dayMeetings.slice(0, 3).map((m) => (
                      <div key={m.id} className="text-[10px] leading-tight truncate flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[m.meeting_type] || 'bg-slate-400'}`} />
                        <span className="text-slate-700 truncate">{m.time} {m.title}</span>
                      </div>
                    ))}
                    {dayMeetings.length > 3 && <div className="text-[10px] text-slate-400">+{dayMeetings.length - 3} flere</div>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
            {Object.entries(TYPE_DOT).map(([t, c]) => (
              <span key={t} className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${c}`} />{t}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Kommende møder</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Indlæser…</p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">Ingen kommende møder</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((m) => (
                <div key={m.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[m.status] || 'bg-slate-100'}`}>{m.status}</span>
                    <span className="text-xs text-slate-500">{m.date} {m.time && `· ${m.time}`}</span>
                  </div>
                  <div className="font-medium text-slate-900 mt-1">{m.title}</div>
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.meeting_type}</span>
                    {m.customer_name && <span>· {m.customer_name}</span>}
                    {m.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.address}</span>}
                    {m.employee_name && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{m.employee_name}</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(m)}>Rediger</Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => remove(m)}>Slet</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Rediger møde' : 'Opret møde'}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Titel *</Label>
              <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="f.eks. Byggemøde - Hovedgaden 12" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.meeting_type} onValueChange={(v) => setForm({ ...form, meeting_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Dato *</Label>
                <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Tidspunkt</Label>
                <Input type="time" value={form.time || ''} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Varighed (min)</Label>
                <Input type="number" value={form.duration_minutes ?? 60} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Ansvarlig medarbejder</Label>
                <Input value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kunde *</Label>
                <Input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Kunde telefon</Label>
                <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Adresse</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Deltagere</Label>
                <Input value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} placeholder="Kommasepareret liste" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Dagsorden</Label>
                <Textarea rows={2} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Noter</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuller</Button>
              <Button type="submit">Gem</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}