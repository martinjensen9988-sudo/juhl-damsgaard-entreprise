import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate, formatDKK } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';

const TYPES = ['Merarbejde', 'Materialefejl', 'Forsinkelse', 'Klage', 'Fejl udførelse', 'Andet'];
const SEVERITIES = ['Lav', 'Mellem', 'Høj', 'Kritisk'];
const STATUSES = ['Åben', 'Under behandling', 'Lukket'];
const sevBadge = { 'Lav': 'bg-slate-100 text-slate-600', 'Mellem': 'bg-amber-100 text-amber-700', 'Høj': 'bg-orange-100 text-orange-700', 'Kritisk': 'bg-red-100 text-red-700' };
const statusBadge = { 'Åben': 'bg-red-100 text-red-700', 'Under behandling': 'bg-amber-100 text-amber-700', 'Lukket': 'bg-emerald-100 text-emerald-700' };
const today = new Date().toISOString().slice(0, 10);
const empty = { title: '', project_name: '', customer_name: '', type: 'Merarbejde', severity: 'Mellem', status: 'Åben', extra_cost: 0, extra_hours: 0, date: today, reported_by: '', description: '', resolution: '' };

export default function Afvigelsesrapport() {
  const [deviations, setDeviations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState('all');

  const load = async () => { try { setDeviations(await base44.entities.Deviation.list('-date')); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (d) => { setEditing(d); setForm({ ...empty, ...d }); setDialogOpen(true); };
  const save = async () => { if (editing) await base44.entities.Deviation.update(editing.id, form); else await base44.entities.Deviation.create(form); setDialogOpen(false); load(); };
  const remove = async (id) => { if (!confirm('Slet afvigelse?')) return; await base44.entities.Deviation.delete(id); load(); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = deviations.filter((d) => filter === 'all' || d.status === filter);
  const openCount = deviations.filter((d) => d.status === 'Åben').length;
  const totalCost = deviations.reduce((s, d) => s + (Number(d.extra_cost) || 0), 0);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Afvigelsesrapport</h1><p className="text-sm text-slate-500 mt-1">Opret og spor sager vedrørende reklamationer, fejl og mangler</p></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Ny afvigelse</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><AlertCircle className="w-4 h-4" /> Total</div><div className="text-2xl font-bold text-slate-900">{deviations.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><AlertTriangle className="w-4 h-4" /> Åbne</div><div className="text-2xl font-bold text-red-600">{openCount}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><AlertTriangle className="w-4 h-4" /> Meromkostninger</div><div className="text-2xl font-bold text-slate-900">{formatDKK(totalCost)}</div></div>
      </div>

      <div className="flex gap-3 mb-4">
        {['all', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{s === 'all' ? 'Alle' : s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((d) => (
          <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div><div className="font-semibold text-slate-900">{d.title}</div><div className="text-sm text-slate-500 mt-0.5">{d.project_name || '—'} • {d.customer_name || '—'} • {formatDate(d.date)}</div></div>
              <div className="flex items-center gap-2"><span className={`text-xs px-2 py-1 rounded-full font-medium ${sevBadge[d.severity] || sevBadge['Mellem']}`}>{d.severity}</span><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge[d.status] || statusBadge['Åben']}`}>{d.status}</span></div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{d.type}</span>
              {d.extra_cost > 0 && <span className="text-amber-600">Merkost: {formatDKK(d.extra_cost)}</span>}
              {d.extra_hours > 0 && <span className="text-amber-600">Mertimer: {d.extra_hours}t</span>}
            </div>
            {d.description && <p className="text-sm text-slate-600 mt-2">{d.description}</p>}
            {d.resolution && <div className="text-sm text-emerald-600 mt-2 bg-emerald-50 rounded-lg px-3 py-2">Løsning: {d.resolution}</div>}
            <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100"><button onClick={() => openEdit(d)} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Rediger</button><button onClick={() => remove(d.id)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 ml-4"><Trash2 className="w-3.5 h-3.5" /> Slet</button></div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-16 text-slate-400"><AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Ingen afvigelser</p></div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger afvigelse' : 'Ny afvigelse'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Titel *</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
            <div><Label>Projekt</Label><Input value={form.project_name} onChange={(e) => set('project_name', e.target.value)} /></div>
            <div><Label>Kunde</Label><Input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} /></div>
            <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => set('type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Alvorlighed</Label><Select value={form.severity} onValueChange={(v) => set('severity', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
            <div><Label>Merkost (DKK)</Label><Input type="number" value={form.extra_cost} onChange={(e) => set('extra_cost', Number(e.target.value))} /></div>
            <div><Label>Mertimer</Label><Input type="number" value={form.extra_hours} onChange={(e) => set('extra_hours', Number(e.target.value))} /></div>
            <div className="col-span-2"><Label>Rapporteret af</Label><Input value={form.reported_by} onChange={(e) => set('reported_by', e.target.value)} /></div>
            <div className="col-span-2"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} /></div>
            <div className="col-span-2"><Label>Løsning</Label><Textarea value={form.resolution} onChange={(e) => set('resolution', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={!form.title}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}