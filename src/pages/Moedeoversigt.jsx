import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CalendarDays, Clock, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/format';

const TYPES = ['Besigtigelse', 'Kundemøde', 'Tilbudsgennemgang', 'Opfølgning', 'Byggemøde', 'Andet'];
const STATUSES = ['Forespurgt', 'Bekræftet', 'Gennemført', 'Aflyst'];
const STATUS_BADGE = { Forespurgt: 'bg-amber-100 text-amber-700', Bekræftet: 'bg-blue-100 text-blue-700', Gennemført: 'bg-emerald-100 text-emerald-700', Aflyst: 'bg-red-100 text-red-700' };

const EMPTY = { title: '', customer_name: '', customer_email: '', customer_phone: '', meeting_type: 'Byggemøde', date: new Date().toISOString().split('T')[0], time: '', duration_minutes: 60, address: '', employee_name: '', attendees: '', agenda: '', minutes: '', status: 'Forespurgt', notes: '' };

export default function Moedeoversigt() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setItems((await base44.entities.MeetingBooking.list('-date', 200)) || []); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const openNew = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (i) => { setForm({ ...EMPTY, ...i }); setEditing(i); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, duration_minutes: Number(form.duration_minutes) || 60 };
      if (editing) { await base44.entities.MeetingBooking.update(editing.id, payload); } else { await base44.entities.MeetingBooking.create(payload); }
      setDialogOpen(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const remove = async (id) => { if (!confirm('Slet dette møde?')) return; await base44.entities.MeetingBooking.delete(id); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center"><CalendarDays className="w-6 h-6 text-indigo-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Mødeoversigt</h1><p className="text-slate-500 mt-0.5">Planlæg byggemøder, opret dagsordener og gem referater</p></div>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> nyt møde</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen møder planlagt.</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900">{i.title}</div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(i.date)}</span>
                    {i.time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{i.time}</span>}
                    {i.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{i.address}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[i.status]}`}>{i.status}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{i.meeting_type}</span>
                </div>
              </div>
              {i.attendees && <div className="text-xs text-slate-500 mt-2"><span className="font-medium">Deltagere: </span>{i.attendees}</div>}
              {(i.agenda || i.minutes) && (
                <button onClick={() => setExpanded(expanded === i.id ? null : i.id)} className="text-sm text-indigo-600 mt-2 hover:underline">
                  {expanded === i.id ? 'Skjul detaljer' : 'Vis dagsorden og referat'}
                </button>
              )}
              {expanded === i.id && (
                <div className="mt-2 space-y-2 pt-2 border-t border-slate-100">
                  {i.agenda && <div><div className="text-xs font-medium text-slate-700 mb-0.5">Dagsorden</div><p className="text-sm text-slate-600 whitespace-pre-wrap">{i.agenda}</p></div>}
                  {i.minutes && <div><div className="text-xs font-medium text-slate-700 mb-0.5">Referat</div><p className="text-sm text-slate-600 whitespace-pre-wrap">{i.minutes}</p></div>}
                </div>
              )}
              <div className="flex justify-end gap-1 pt-2"><Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4 text-slate-500" /></Button><Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger møde' : 'Nyt møde'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Titel *</Label><Input value={form.title} onChange={set('title')} /></div>
            <div className="space-y-1.5"><Label>Kunde *</Label><Input value={form.customer_name} onChange={set('customer_name')} /></div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={form.meeting_type} onValueChange={(v) => setForm({ ...form, meeting_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Dato *</Label><Input type="date" value={form.date} onChange={set('date')} /></div>
            <div className="space-y-1.5"><Label>Tidspunkt</Label><Input type="time" value={form.time || ''} onChange={set('time')} /></div>
            <div className="space-y-1.5"><Label>Varighed (min)</Label><Input type="number" value={form.duration_minutes} onChange={set('duration_minutes')} /></div>
            <div className="space-y-1.5"><Label>Ansvarlig</Label><Input value={form.employee_name} onChange={set('employee_name')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Adresse</Label><Input value={form.address} onChange={set('address')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Deltagere</Label><Input value={form.attendees} onChange={set('attendees')} placeholder="Kommasepareret liste" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Dagsorden</Label><Textarea value={form.agenda} onChange={set('agenda')} rows={3} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Referat</Label><Textarea value={form.minutes} onChange={set('minutes')} rows={3} /></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Noter</Label><Input value={form.notes} onChange={set('notes')} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving || !form.title || !form.customer_name}>{saving ? 'Gemmer...' : 'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}