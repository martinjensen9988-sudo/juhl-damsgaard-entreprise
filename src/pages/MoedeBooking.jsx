import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import { Plus, Pencil, Trash2, Search, Calendar, MapPin, User, Clock, CheckCircle2, X } from 'lucide-react';

const typeColors = { Besigtigelse: 'bg-amber-100 text-amber-700', Kundemøde: 'bg-blue-100 text-blue-700', Tilbudsgennemgang: 'bg-purple-100 text-purple-700', Opfølgning: 'bg-emerald-100 text-emerald-700', Andet: 'bg-slate-100 text-slate-600' };
const statusColors = { Forespurgt: 'bg-amber-100 text-amber-700', Bekræftet: 'bg-blue-100 text-blue-700', Gennemført: 'bg-emerald-100 text-emerald-700', Aflyst: 'bg-red-100 text-red-700' };
const empty = { title: '', customer_name: '', customer_email: '', customer_phone: '', meeting_type: 'Besigtigelse', date: '', time: '', duration_minutes: 60, address: '', employee_name: '', status: 'Forespurgt', notes: '' };

export default function MoedeBooking() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { setItems(await base44.entities.MeetingBooking.list('-date') || []); } catch(e){console.error(e);} setLoading(false); };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => (!search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.customer_name?.toLowerCase().includes(search.toLowerCase())) && (statusFilter === 'all' || i.status === statusFilter));

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({...empty, ...i}); setDialogOpen(true); };
  const field = (k, v) => setForm(f => ({...f, [k]: v}));

  const save = async () => {
    if (!form.title || !form.customer_name || !form.date) { alert('Udfyld titel, kunde og dato'); return; }
    setSaving(true);
    try { const payload = {...form, duration_minutes: Number(form.duration_minutes)||60}; if (editing) await base44.entities.MeetingBooking.update(editing.id, payload); else await base44.entities.MeetingBooking.create(payload); setDialogOpen(false); load(); }
    catch(e){ alert('Fejl'); } setSaving(false);
  };

  const remove = async (i) => { if (confirm(`Slet "${i.title}"?`)) { try { await base44.entities.MeetingBooking.delete(i.id); load(); } catch(e){} } };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Calendar className="w-5 h-5 text-amber-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Mødebooker</h1><p className="text-slate-500 mt-0.5">Booking af kundemøder og besigtigelser</p></div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Book møde</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Søg..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle statusser</SelectItem>{Object.keys(statusColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen møder booket</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(i => (
            <div key={i.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[i.meeting_type]||typeColors.Andet}`}>{i.meeting_type}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[i.status]||statusColors.Forespurgt}`}>{i.status}</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{i.title}</h3>
              <div className="space-y-1.5 text-sm text-slate-500">
                <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {i.customer_name}</div>
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(i.date)}{i.time && ` kl. ${i.time}`}</div>
                {i.duration_minutes && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {i.duration_minutes} min</div>}
                {i.address && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> <span className="truncate">{i.address}</span></div>}
                {i.employee_name && <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> {i.employee_name}</div>}
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onClick={()=>openEdit(i)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition"><Pencil className="w-3.5 h-3.5" /> Rediger</button>
                <button onClick={()=>remove(i)} className="flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-amber-600" />{editing ? 'Rediger møde' : 'Book nyt møde'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Titel *</Label><Input value={form.title} onChange={e=>field('title',e.target.value)} placeholder="f.eks. Besigtigelse af indkørsel" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kunde *</Label><Input value={form.customer_name} onChange={e=>field('customer_name',e.target.value)} /></div>
              <div><Label>Type</Label><Select value={form.meeting_type} onValueChange={v=>field('meeting_type',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(typeColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={form.customer_email} onChange={e=>field('customer_email',e.target.value)} /></div>
              <div><Label>Telefon</Label><Input value={form.customer_phone} onChange={e=>field('customer_phone',e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Dato *</Label><Input type="date" value={form.date} onChange={e=>field('date',e.target.value)} /></div>
              <div><Label>Tidspunkt</Label><Input type="time" value={form.time} onChange={e=>field('time',e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Varighed (min)</Label><Input type="number" value={form.duration_minutes} onChange={e=>field('duration_minutes',e.target.value)} /></div>
              <div><Label>Ansvarlig</Label><Input value={form.employee_name} onChange={e=>field('employee_name',e.target.value)} /></div>
            </div>
            <div><Label>Adresse</Label><Input value={form.address} onChange={e=>field('address',e.target.value)} /></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={v=>field('status',v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(statusColors).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Noter</Label><Textarea value={form.notes} onChange={e=>field('notes',e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=>setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving}>{saving?'Gemmer...':'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}