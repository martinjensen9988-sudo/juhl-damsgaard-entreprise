import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ShieldCheck, Search } from 'lucide-react';
import { formatDate } from '@/lib/format';

const TYPES = ['Ulykke', 'Nær-ulykke', 'Sikkerhedsgennemgang', 'Risikovurdering', 'Afvigelse'];
const SEVERITIES = ['Lav', 'Mellem', 'Høj', 'Kritisk'];
const STATUSES = ['Åben', 'Under behandling', 'Lukket'];

const SEV_BADGE = { Lav: 'bg-slate-100 text-slate-600', Mellem: 'bg-amber-100 text-amber-700', Høj: 'bg-orange-100 text-orange-700', Kritisk: 'bg-red-100 text-red-700' };
const STATUS_BADGE = { 'Åben': 'bg-blue-100 text-blue-700', 'Under behandling': 'bg-amber-100 text-amber-700', 'Lukket': 'bg-emerald-100 text-emerald-700' };

const EMPTY = { title: '', type: 'Sikkerhedsgennemgang', project_id: '', project_name: '', location: '', date: new Date().toISOString().split('T')[0], severity: 'Lav', status: 'Åben', reported_by: '', description: '', action_taken: '', follow_up: '' };

export default function Sikkerhedsarkiv() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([base44.entities.SafetyLog.list('-date', 200), base44.entities.Project.list('-created_date', 100)]);
      setItems(s || []);
      setProjects(p || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const openNew = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (i) => { setForm({ ...EMPTY, ...i }); setEditing(i); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const proj = projects.find((p) => p.id === form.project_id);
      const payload = { ...form, project_name: proj ? proj.name : form.project_name };
      if (editing) { await base44.entities.SafetyLog.update(editing.id, payload); } else { await base44.entities.SafetyLog.create(payload); }
      setDialogOpen(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const remove = async (id) => { if (!confirm('Slet denne post?')) return; await base44.entities.SafetyLog.delete(id); load(); };

  const filtered = items.filter((i) => !filter || i.title?.toLowerCase().includes(filter.toLowerCase()) || i.type === filter || i.project_name?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-emerald-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Sikkerhedsarkiv</h1><p className="text-slate-500 mt-0.5">APV-rapporter, sikkerhedsgodkendelser og arbejdsmiljøcertifikater</p></div>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Ny post</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Søg på titel, type eller projekt..." className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen poster i sikkerhedsarkivet.</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((i) => (
            <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{i.title}</div><div className="text-xs text-slate-500">{i.project_name || 'Generelt'}</div></div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${SEV_BADGE[i.severity]}`}>{i.severity}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{i.type}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[i.status]}`}>{i.status}</span>
              </div>
              {i.description && <p className="text-sm text-slate-600 line-clamp-2 mb-2">{i.description}</p>}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400">{formatDate(i.date)}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger post' : 'Ny sikkerhedspost'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Titel *</Label><Input value={form.title} onChange={set('title')} /></div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Projekt</Label><Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}><SelectTrigger><SelectValue placeholder="Generelt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Dato</Label><Input type="date" value={form.date} onChange={set('date')} /></div>
            <div className="space-y-1.5"><Label>Lokation</Label><Input value={form.location} onChange={set('location')} /></div>
            <div className="space-y-1.5"><Label>Alvorlighed</Label><Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Rapporteret af</Label><Input value={form.reported_by} onChange={set('reported_by')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={set('description')} rows={3} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Tiltag</Label><Textarea value={form.action_taken} onChange={set('action_taken')} rows={2} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Opfølgning</Label><Input value={form.follow_up} onChange={set('follow_up')} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving || !form.title}>{saving ? 'Gemmer...' : 'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}