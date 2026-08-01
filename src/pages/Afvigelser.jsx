import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertOctagon, Plus, Loader2, Trash2, Pencil } from 'lucide-react';
import { formatDKK, formatDate } from '@/lib/format';

const TYPES = ['Merarbejde', 'Materialefejl', 'Forsinkelse', 'Klage', 'Fejl udførelse', 'Andet'];
const SEVERITIES = ['Lav', 'Mellem', 'Høj', 'Kritisk'];
const STATUSES = ['Åben', 'Under behandling', 'Lukket'];

const SEVERITY_BADGE = { Lav: 'bg-slate-100 text-slate-600', Mellem: 'bg-amber-100 text-amber-700', Høj: 'bg-orange-100 text-orange-700', Kritisk: 'bg-red-500 text-white' };
const STATUS_BADGE = { Åben: 'bg-red-100 text-red-700', 'Under behandling': 'bg-amber-100 text-amber-700', Lukket: 'bg-emerald-100 text-emerald-700' };
const TYPE_BADGE = { Merarbejde: 'bg-blue-100 text-blue-700', Materialefejl: 'bg-orange-100 text-orange-700', Forsinkelse: 'bg-amber-100 text-amber-700', Klage: 'bg-red-100 text-red-700', 'Fejl udførelse': 'bg-purple-100 text-purple-700', Andet: 'bg-slate-100 text-slate-600' };

const EMPTY = { title: '', project_id: '', project_name: '', customer_name: '', type: 'Merarbejde', severity: 'Mellem', status: 'Åben', extra_cost: 0, extra_hours: 0, date: new Date().toISOString().slice(0, 10), reported_by: '', description: '', resolution: '' };

export default function Afvigelser() {
  const [devs, setDevs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = async () => {
    try {
      const [d, p] = await Promise.all([
        base44.entities.Deviation.list('-created_date', 200),
        base44.entities.Project.list(),
      ]);
      setDevs(d); setProjects(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowDialog(true); };
  const openEdit = (d) => { setEditing(d); setForm({ ...EMPTY, ...d }); setShowDialog(true); };
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const save = async () => {
    if (!form.title || !form.project_id) return;
    setSaving(true);
    try {
      const proj = projects.find((p) => p.id === form.project_id);
      const payload = { ...form, project_name: proj?.name || '', customer_name: proj?.customer_name || '', extra_cost: Number(form.extra_cost) || 0, extra_hours: Number(form.extra_hours) || 0 };
      if (editing) await base44.entities.Deviation.update(editing.id, payload);
      else await base44.entities.Deviation.create(payload);
      setShowDialog(false); load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const remove = async (id) => { await base44.entities.Deviation.delete(id); load(); };

  const filtered = devs.filter((d) => filterStatus === 'all' || d.status === filterStatus);
  const totalCost = devs.reduce((s, d) => s + (d.extra_cost || 0), 0);
  const openCount = devs.filter((d) => d.status === 'Åben').length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><AlertOctagon className="w-6 h-6 text-amber-500" /> Afvigelseshåndtering</h1>
          <p className="text-sm text-slate-500 mt-1">Registrering af uventede problemer og merarbejde</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Ny afvigelse</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1">Åbne</div><div className="text-2xl font-bold text-amber-600">{openCount}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1">Samlede</div><div className="text-2xl font-bold text-slate-900">{devs.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1">Meromkostning</div><div className="text-2xl font-bold text-red-600">{formatDKK(totalCost)}</div></Card>
      </div>

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle statusser</SelectItem>
          {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="space-y-3">
        {filtered.map((d) => (
          <Card key={d.id} className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_BADGE[d.type] || ''}`}>{d.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_BADGE[d.severity] || ''}`}>{d.severity}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[d.status] || ''}`}>{d.status}</span>
                </div>
                <div className="font-semibold text-slate-900">{d.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatDate(d.date)} • {d.project_name || '—'} {d.customer_name ? `(${d.customer_name})` : ''}
                  {d.reported_by && ` • ${d.reported_by}`}
                </div>
                {d.description && <p className="text-sm text-slate-600 mt-2">{d.description}</p>}
                <div className="flex flex-wrap gap-4 mt-2 text-xs">
                  {(d.extra_cost || 0) > 0 && <span className="text-red-600 font-medium">Meromkostning: {formatDKK(d.extra_cost)}</span>}
                  {(d.extra_hours || 0) > 0 && <span className="text-amber-600 font-medium">Mertimer: {d.extra_hours} t</span>}
                </div>
                {d.resolution && <div className="mt-2 text-sm"><span className="text-xs text-slate-400">Løsning: </span><span className="text-slate-700">{d.resolution}</span></div>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(d.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400"><AlertOctagon className="w-12 h-12 mx-auto mb-2 text-slate-300" />Ingen afvigelser</div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger afvigelse' : 'Ny afvigelse'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Titel</Label><Input value={form.title} onChange={set('title')} /></div>
            <div className="space-y-1.5"><Label>Projekt</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Alvorlighed</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Dato</Label><Input type="date" value={form.date} onChange={set('date')} /></div>
              <div className="space-y-1.5"><Label>Meromkostning</Label><Input type="number" value={form.extra_cost} onChange={(e) => setForm({ ...form, extra_cost: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Mertimer</Label><Input type="number" value={form.extra_hours} onChange={(e) => setForm({ ...form, extra_hours: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Rapporteret af</Label><Input value={form.reported_by} onChange={set('reported_by')} /></div>
            <div className="space-y-1.5"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={set('description')} rows={3} /></div>
            <div className="space-y-1.5"><Label>Løsning</Label><Textarea value={form.resolution} onChange={set('resolution')} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.title || !form.project_id}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Gem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}