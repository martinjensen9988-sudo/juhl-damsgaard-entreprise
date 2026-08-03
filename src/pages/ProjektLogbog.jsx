import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  BookOpen, Plus, Pencil, Trash2, CloudSun, Calendar, User, CalendarDays as Event
} from 'lucide-react';
import { formatDate } from '@/lib/format';

const weatherOptions = ['Solrigt', 'Skyet', 'Regn', 'Storm', 'Frost/Sne', 'Diset', 'Vejrigt'];

export default function Projektlogbog() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const empty = { project_id: '', project_name: '', date: new Date().toISOString().split('T')[0], author_name: '', weather: '', content: '', events: '' };

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Project.list();
      setProjects(data || []);
      if (data?.length && !selectedProject) setSelectedProject(data[0].id);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadNotes = async () => {
    if (!selectedProject) return;
    try {
      const data = await base44.entities.ProjectNote.filter({ project_id: selectedProject }, '-date', 100);
      setNotes(data || []);
    } catch (e) { console.error(e); setNotes([]); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadNotes(); }, [selectedProject]);

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));

  const openCreate = () => {
    setEditing(null);
    const proj = projects.find((p) => p.id === selectedProject);
    setForm({ ...empty, project_id: selectedProject, project_name: proj?.name || '' });
    setOpen(true);
  };
  const openEdit = (n) => {
    setEditing(n);
    setForm({ ...empty, ...n });
    setOpen(true);
  };

  const save = async () => {
    if (!form.content) return toast({ title: 'Angiv dagsnotat', variant: 'destructive' });
    setSaving(true);
    try {
      if (editing) await base44.entities.ProjectNote.update(editing.id, form);
      else await base44.entities.ProjectNote.create(form);
      setOpen(false);
      loadNotes();
      toast({ title: 'Logbog gemt' });
    } catch (e) { console.error(e); toast({ title: 'Fejl ved gem', variant: 'destructive' }); }
    setSaving(false);
  };

  const remove = async (n) => {
    if (!confirm('Slet logbogsnotat?')) return;
    try { await base44.entities.ProjectNote.delete(n.id); loadNotes(); } catch (e) {}
  };

  const currentProject = projects.find((p) => p.id === selectedProject);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Projektlogbog</h1>
            <p className="text-slate-500 mt-0.5">Daglige noter, vejrobservationer og begivenheder — skrevet direkte på projektet</p>
          </div>
        </div>
        <Button onClick={openCreate} disabled={!selectedProject}><Plus className="w-4 h-4" /> Ny notat</Button>
      </div>

      {/* Project selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <Label className="text-sm font-medium">Projekt:</Label>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {currentProject && <span className="text-sm text-slate-500">{currentProject.status}</span>}
      </div>

      {/* Notes */}
      {!selectedProject ? <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Vælg et projekt for at se logbog</p></div> :
       loading ? <div className="text-center py-20 text-slate-400">Indlæser…</div> :
       notes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Ingen logbogsnotater på dette projekt endnu</p>
          <Button onClick={openCreate} className="mt-4"><Plus className="w-4 h-4" /> Opret første notat</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <Calendar className="w-4 h-4 text-slate-400" /> {formatDate(n.date)}
                  </div>
                  {n.author_name && (
                    <span className="flex items-center gap-1 text-xs text-slate-500"><User className="w-3.5 h-3.5" /> {n.author_name}</span>
                  )}
                  {n.weather && (
                    <span className="flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full"><CloudSun className="w-3.5 h-3.5" /> {n.weather}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(n)} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Pencil className="w-3 h-3" /> Rediger</button>
                  <button onClick={() => remove(n)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{n.content}</div>
              {n.events && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-start gap-1.5 text-sm">
                    <Event className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-0.5">Vigtige hændelser</div>
                      <div className="text-slate-700 whitespace-pre-wrap">{n.events}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Rediger notat' : 'Nyt logbogsnotat'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Dato</Label><Input type="date" value={form.date || ''} onChange={(e) => set('date', e.target.value)} /></div>
                <div><Label>Forfatter (formand)</Label><Input value={form.author_name || ''} onChange={(e) => set('author_name', e.target.value)} /></div>
              </div>
              <div>
                <Label>Vejrforhold</Label>
                <Select value={form.weather || ''} onValueChange={(v) => set('weather', v)}>
                  <SelectTrigger><SelectValue placeholder="Vælg vejrlag" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Ingen</SelectItem>
                    {weatherOptions.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Dagsnotat *</Label><Textarea value={form.content || ''} onChange={(e) => set('content', e.target.value)} rows={5} placeholder="Beskriv dagens arbejde, fremdrift, udfordringer…" /></div>
              <div><Label>Vigtige hændelser</Label><Textarea value={form.events || ''} onChange={(e) => set('events', e.target.value)} rows={3} placeholder="Leverancer, besigtigelser, afvigelser, besøg…" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Gemmer…' : 'Gem notat'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}