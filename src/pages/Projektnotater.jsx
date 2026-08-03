import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, NotebookPen, CloudSun } from 'lucide-react';
import { formatDate } from '@/lib/format';

const EMPTY = { project_id: '', project_name: '', date: new Date().toISOString().split('T')[0], author_name: '', weather: '', content: '', events: '' };

export default function Projektnotater() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [n, p] = await Promise.all([base44.entities.ProjectNote.list('-date', 200), base44.entities.Project.list('-created_date', 100)]);
      setItems(n || []); setProjects(p || []);
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
      const payload = { ...form, project_name: proj?.name || '' };
      if (editing) { await base44.entities.ProjectNote.update(editing.id, payload); } else { await base44.entities.ProjectNote.create(payload); }
      setDialogOpen(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const remove = async (id) => { if (!confirm('Slet dette notat?')) return; await base44.entities.ProjectNote.delete(id); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center"><NotebookPen className="w-6 h-6 text-teal-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projektnotater</h1><p className="text-slate-500 mt-0.5">Dagsnotater, vejrforhold og vigtige hændelser på byggepladsen</p></div>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Nyt notat</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><NotebookPen className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen notater endnu.</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0"><div className="font-semibold text-slate-900">{i.project_name}</div><div className="text-xs text-slate-500">{formatDate(i.date)} • {i.author_name || 'Ukendt'}</div></div>
                <div className="flex gap-1 flex-shrink-0"><Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4 text-slate-500" /></Button><Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
              </div>
              {i.weather && <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full mb-2"><CloudSun className="w-3.5 h-3.5" />{i.weather}</div>}
              {i.content && <p className="text-sm text-slate-700 whitespace-pre-wrap mb-2">{i.content}</p>}
              {i.events && <div className="text-sm text-slate-600 bg-amber-50 rounded-lg p-2 mt-2"><span className="font-medium text-amber-700">Hændelser: </span>{i.events}</div>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger notat' : 'Nyt dagsnotat'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Projekt *</Label><Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Dato *</Label><Input type="date" value={form.date} onChange={set('date')} /></div>
            <div className="space-y-1.5"><Label>Forfatter</Label><Input value={form.author_name} onChange={set('author_name')} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Vejrforhold</Label><Input value={form.weather} onChange={set('weather')} placeholder="F.eks. Sol, 18°C, let vind" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Dagsnotat *</Label><Textarea value={form.content} onChange={set('content')} rows={4} placeholder="Hvad er der lavet i dag?" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Vigtige hændelser</Label><Textarea value={form.events} onChange={set('events')} rows={2} placeholder="Særlige hændelser, besøg, problemer..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving || !form.project_id || !form.content}>{saving ? 'Gemmer...' : 'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}