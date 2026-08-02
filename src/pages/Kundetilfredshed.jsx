import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Star, Heart, ThumbsUp } from 'lucide-react';
import { formatDate } from '@/lib/format';

const empty = { project_id: '', project_name: '', customer_name: '', overall_rating: 5, quality_rating: 5, communication_rating: 5, punctuality_rating: 5, would_recommend: true, comment: '', date: '', status: 'Modtaget' };
const statusColor = { Modtaget: 'bg-blue-100 text-blue-700', Opfølget: 'bg-emerald-100 text-emerald-700' };

function Stars({ value, onChange, size = 'w-4 h-4' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange?.(n)}>
          <Star className={`${size} ${n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
        </button>
      ))}
    </div>
  );
}

export default function Kundetilfredshed() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const [f, p] = await Promise.all([base44.entities.CustomerFeedback.list(), base44.entities.Project.list().catch(() => [])]); setItems(f || []); setProjects(p || []); } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const setProject = (id) => { const p = projects.find((x) => x.id === id); setForm((s) => ({ ...s, project_id: id, project_name: p?.name || '' })); };
  const openCreate = () => { setEditing(null); setForm({ ...empty, date: new Date().toISOString().split('T')[0] }); setOpen(true); };
  const openEdit = (f) => { setEditing(f); setForm({ ...empty, ...f }); setOpen(true); };

  const save = async () => {
    if (!form.customer_name || !form.overall_rating) return alert('Angiv kunde og karakter');
    setSaving(true);
    try { editing ? await base44.entities.CustomerFeedback.update(editing.id, form) : await base44.entities.CustomerFeedback.create(form); setOpen(false); load(); }
    catch (e) { console.error(e); alert('Fejl'); }
    setSaving(false);
  };
  const remove = async (f) => { if (!confirm('Slet feedback?')) return; try { await base44.entities.CustomerFeedback.delete(f.id); load(); } catch (e) {} };

  const stats = useMemo(() => {
    const n = items.length;
    const avg = n ? items.reduce((s, i) => s + (Number(i.overall_rating) || 0), 0) / n : 0;
    const recommend = items.filter((i) => i.would_recommend).length;
    const avgQuality = n ? items.reduce((s, i) => s + (Number(i.quality_rating) || 0), 0) / n : 0;
    return { n, avg, recommend, pct: n ? Math.round(recommend / n * 100) : 0, avgQuality };
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center"><Heart className="w-5 h-5 text-pink-600" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Kundetilfredshed</h1>
            <p className="text-slate-500 mt-0.5">Feedback fra kunder efter endte projekter — karakterer og kommentarer</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Registrer feedback</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Besvarelser</div><div className="text-2xl font-bold text-slate-900">{stats.n}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Gennemsnit</div><div className="flex items-center gap-1.5"><span className="text-2xl font-bold text-amber-600">{stats.avg.toFixed(1)}</span><Star className="w-5 h-5 text-amber-400 fill-amber-400" /></div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Kvalitet</div><div className="text-2xl font-bold text-emerald-600">{stats.avgQuality.toFixed(1)}</div></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">Anbefaler</div><div className="text-2xl font-bold text-pink-600">{stats.pct}%</div></div>
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen feedback endnu</p></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{f.customer_name}</div>{f.project_name && <div className="text-xs text-slate-500 truncate">{f.project_name}</div>}</div>
                <Stars value={Number(f.overall_rating) || 0} size="w-4 h-4" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                {[['Kvalitet', f.quality_rating], ['Kommunikation', f.communication_rating], ['Punktualitet', f.punctuality_rating]].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 rounded-lg p-2 text-center"><div className="text-slate-400">{l}</div><div className="font-semibold text-slate-700 mt-0.5">{Number(v || 0).toFixed(1)} ★</div></div>
                ))}
              </div>
              {f.comment && <p className="text-sm text-slate-600 mt-3 italic">"{f.comment}"</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {f.would_recommend && <span className="flex items-center gap-1 text-xs text-emerald-600"><ThumbsUp className="w-3 h-3" /> Anbefaler</span>}
                  <span className="text-xs text-slate-400">{formatDate(f.date)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[f.status] || 'bg-slate-100'}`}>{f.status}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(f)} className="text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(f)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger feedback' : 'Registrer feedback'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kunde *</Label><Input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} /></div>
              <div><Label>Projekt</Label><Select value={form.project_id} onValueChange={setProject}><SelectTrigger><SelectValue placeholder="Vælg" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Samlet karakter</Label><Stars value={Number(form.overall_rating) || 0} onChange={(v) => set('overall_rating', v)} size="w-6 h-6" /></div>
            <div className="grid grid-cols-3 gap-3">
              {[['Kvalitet', 'quality_rating'], ['Kommunikation', 'communication_rating'], ['Punktualitet', 'punctuality_rating']].map(([l, f]) => (
                <div key={f}><Label className="text-xs">{l}</Label><Stars value={Number(form[f]) || 0} onChange={(v) => set(f, v)} /></div>
              ))}
            </div>
            <div className="flex items-center gap-2"><input type="checkbox" id="rec" checked={!!form.would_recommend} onChange={(e) => set('would_recommend', e.target.checked)} className="w-4 h-4" /><Label htmlFor="rec" className="cursor-pointer">Vil anbefale os</Label></div>
            <div><Label>Kommentar</Label><Textarea value={form.comment} onChange={(e) => set('comment', e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(statusColor).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}