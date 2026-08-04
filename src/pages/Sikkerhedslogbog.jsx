import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldAlert, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { formatDate } from '@/lib/format';

const TYPES = ['Ulykke', 'Nær-ulykke', 'Sikkerhedsgennemgang', 'Risikovurdering', 'Afvigelse'];
const SEVERITY = { Lav: 'bg-slate-100 text-slate-600', Mellem: 'bg-amber-100 text-amber-700', Høj: 'bg-orange-100 text-orange-700', Kritisk: 'bg-rose-100 text-rose-700' };
const STATUS = { Åben: 'bg-blue-100 text-blue-700', 'Under behandling': 'bg-amber-100 text-amber-700', Lukket: 'bg-emerald-100 text-emerald-700' };
const empty = { title: '', type: 'Sikkerhedsgennemgang', project_id: '', project_name: '', location: '', date: new Date().toISOString().slice(0, 10), severity: 'Lav', status: 'Åben', reported_by: '', description: '', action_taken: '', follow_up: '' };

export default function Sikkerhedslogbog() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [l, p] = await Promise.all([base44.entities.SafetyLog.list('-date', 300), base44.entities.Project.list().catch(() => [])]); setItems(l || []); setProjects(p || []); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEdit(null); setForm(empty); setOpen(true); };
  const openEdit = (s) => { setEdit(s); setForm({ ...empty, ...s }); setOpen(true); };

  const save = async () => {
    if (!form.title || !form.date) { alert('Titel og dato kræves'); return; }
    const proj = projects.find((p) => p.id === form.project_id);
    const payload = { ...form, project_name: proj?.name || form.project_name };
    if (edit) await base44.entities.SafetyLog.update(edit.id, payload);
    else await base44.entities.SafetyLog.create(payload);
    setOpen(false); load();
  };

  const del = async (s) => { if (confirm('Slet post?')) { await base44.entities.SafetyLog.delete(s.id); load(); } };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-900 flex items-center justify-center"><ShieldAlert className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sikkerheds Logbog</h1>
            <p className="text-slate-500">Sikkerhedshændelser, arbejdsulykker og forebyggende tiltag</p>
          </div>
        </div>
        <Button onClick={openNew} className="bg-slate-950"><Plus className="w-4 h-4" /> Registrer</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen sikkerhedsposter.</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{s.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${SEVERITY[s.severity]}`}>{s.severity}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${STATUS[s.status]}`}>{s.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{s.type} · {formatDate(s.date)} {s.project_name ? `· ${s.project_name}` : ''} {s.location ? `· ${s.location}` : ''} {s.reported_by ? `· ${s.reported_by}` : ''}</div>
                  {s.description && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{s.description}</p>}
                  {s.action_taken && <p className="text-sm text-emerald-700 mt-1"><span className="font-medium">Tiltag:</span> {s.action_taken}</p>}
                  {s.follow_up && <p className="text-sm text-amber-700 mt-1"><span className="font-medium">Opfølgning:</span> {s.follow_up}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="w-3.5 h-3.5 text-slate-500" /></button>
                  <button onClick={() => del(s)} className="p-1.5 rounded hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>{edit ? 'Rediger post' : 'Registrer hændelse'}</SheetTitle></SheetHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs">Titel *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs">Alvorlighed</Label><Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(SEVERITY).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Dato *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div><Label className="text-xs">Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(STATUS).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-xs">Projekt</Label><Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}><SelectTrigger><SelectValue placeholder="Vælg projekt..." /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Lokation</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label className="text-xs">Rapporteret af</Label><Input value={form.reported_by} onChange={(e) => setForm({ ...form, reported_by: e.target.value })} /></div>
            <div><Label className="text-xs">Beskrivelse</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div><Label className="text-xs">Tiltag</Label><Textarea value={form.action_taken} onChange={(e) => setForm({ ...form, action_taken: e.target.value })} rows={2} /></div>
            <div><Label className="text-xs">Opfølgning</Label><Textarea value={form.follow_up} onChange={(e) => setForm({ ...form, follow_up: e.target.value })} rows={2} /></div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save} className="bg-slate-950">Gem</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}