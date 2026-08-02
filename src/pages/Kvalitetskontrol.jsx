import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CheckSquare, Square, ClipboardCheck } from 'lucide-react';

const types = ['Færdigmelding', 'AR-bevis', 'Sikkerhedsinspektion', 'Selvangivelse', 'Varmeinstallation', 'Andet'];
const statuses = ['Ikke startet', 'I gang', 'Godkendt', 'Afvigelse'];
const statusColor = {
  'Ikke startet': 'bg-slate-100 text-slate-600',
  'I gang': 'bg-blue-100 text-blue-700',
  Godkendt: 'bg-emerald-100 text-emerald-700',
  Afvigelse: 'bg-amber-100 text-amber-700',
};

const empty = { title: '', project_id: '', project_name: '', type: 'Færdigmelding', status: 'Ikke startet', checked_by: '', check_date: '', notes: '', items: [] };

export default function Kvalitetskontrol() {
  const [checks, setChecks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([base44.entities.QualityCheck.list(), base44.entities.Project.list().catch(() => [])]);
      setChecks(c || []); setProjects(p || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...empty, check_date: new Date().toISOString().split('T')[0] }); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...empty, ...c, items: c.items || [] }); setOpen(true); };
  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const setProject = (id) => { const p = projects.find((x) => x.id === id); setForm((s) => ({ ...s, project_id: id, project_name: p?.name || '' })); };
  const addItem = () => setForm((s) => ({ ...s, items: [...s.items, { description: '', checked: false, notes: '' }] }));
  const updateItem = (i, patch) => setForm((s) => ({ ...s, items: s.items.map((it, idx) => idx === i ? { ...it, ...patch } : it) }));
  const removeItem = (i) => setForm((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.title) return alert('Angiv titel');
    setSaving(true);
    try { editing ? await base44.entities.QualityCheck.update(editing.id, form) : await base44.entities.QualityCheck.create(form); setOpen(false); load(); }
    catch (e) { console.error(e); alert('Fejl'); }
    setSaving(false);
  };
  const remove = async (c) => { if (!confirm('Slet tjekliste?')) return; try { await base44.entities.QualityCheck.delete(c.id); load(); } catch (e) {} };

  const stats = useMemo(() => ({
    total: checks.length,
    approved: checks.filter((c) => c.status === 'Godkendt').length,
    pending: checks.filter((c) => c.status === 'I gang' || c.status === 'Ikke startet').length,
    deviations: checks.filter((c) => c.status === 'Afvigelse').length,
  }), [checks]);

  const progress = (items) => items?.length ? Math.round(items.filter((i) => i.checked).length / items.length * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><ClipboardCheck className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Kvalitetskontrol</h1>
            <p className="text-slate-500 mt-0.5">Tjeklister der sikrer at alt arbejde lever op til firmaets standarder før aflevering</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Ny tjekliste</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Total', stats.total, 'text-slate-900'], ['Godkendt', stats.approved, 'text-emerald-600'], ['Igangværende', stats.pending, 'text-blue-600'], ['Afvigelser', stats.deviations, 'text-amber-600']].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">{l}</div><div className={`text-2xl font-bold ${c}`}>{v}</div></div>
        ))}
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : checks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen tjeklister endnu</p></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checks.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{c.title}</div>
                  {c.project_name && <div className="text-xs text-slate-500 truncate">{c.project_name}</div>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] || 'bg-slate-100'}`}>{c.status}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">{c.type} · {c.check_date || '—'}</div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">{(c.items || []).length} punkter</span><span className="font-medium text-slate-700">{progress(c.items)}%</span></div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${progress(c.items)}%` }} /></div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <button onClick={() => openEdit(c)} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Pencil className="w-3 h-3" /> Rediger</button>
                <button onClick={() => remove(c)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3" /> Slet</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger tjekliste' : 'Ny tjekliste'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Titel *</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Projekt</Label>
                <Select value={form.project_id} onValueChange={setProject}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => set('type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Tjekket af</Label><Input value={form.checked_by} onChange={(e) => set('checked_by', e.target.value)} /></div>
              <div><Label>Dato</Label><Input type="date" value={form.check_date} onChange={(e) => set('check_date', e.target.value)} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Tjekpunkter</Label><Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3" /> Tilføj</Button></div>
              <div className="space-y-2">
                {form.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                    <button onClick={() => updateItem(i, { checked: !it.checked })}>{it.checked ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}</button>
                    <Input className="flex-1 h-8" placeholder="Beskrivelse" value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} />
                    <button onClick={() => removeItem(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {form.items.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Ingen punkter — tilføj nogle</p>}
              </div>
            </div>
            <div><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} /></div>
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