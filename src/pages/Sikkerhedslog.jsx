import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShieldAlert, Plus, Loader2, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/format';

const TYPES = ['Ulykke', 'Nær-ulykke', 'Sikkerhedsgennemgang', 'Risikovurdering', 'Afvigelse'];
const SEVERITIES = ['Lav', 'Mellem', 'Høj', 'Kritisk'];
const STATUSES = ['Åben', 'Under behandling', 'Lukket'];

const TYPE_BADGE = {
  Ulykke: 'bg-red-100 text-red-700 border-red-200',
  'Nær-ulykke': 'bg-orange-100 text-orange-700 border-orange-200',
  Sikkerhedsgennemgang: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Risikovurdering: 'bg-blue-100 text-blue-700 border-blue-200',
  Afvigelse: 'bg-amber-100 text-amber-700 border-amber-200',
};

const SEVERITY_BADGE = {
  Lav: 'bg-slate-100 text-slate-600',
  Mellem: 'bg-amber-100 text-amber-700',
  Høj: 'bg-orange-100 text-orange-700',
  Kritisk: 'bg-red-500 text-white',
};

const STATUS_BADGE = {
  Åben: 'bg-red-100 text-red-700',
  'Under behandling': 'bg-amber-100 text-amber-700',
  Lukket: 'bg-emerald-100 text-emerald-700',
};

const EMPTY = {
  title: '',
  type: 'Sikkerhedsgennemgang',
  project_id: '',
  project_name: '',
  location: '',
  date: new Date().toISOString().slice(0, 10),
  severity: 'Lav',
  status: 'Åben',
  reported_by: '',
  description: '',
  action_taken: '',
  follow_up: '',
};

export default function Sikkerhedslog() {
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    try {
      const [l, p] = await Promise.all([
        base44.entities.SafetyLog.list('-created_date', 200),
        base44.entities.Project.list(),
      ]);
      setLogs(l);
      setProjects(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = logs
    .filter((l) => filterType === 'all' || l.type === filterType)
    .filter((l) => filterStatus === 'all' || l.status === filterStatus);

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowDialog(true); };
  const openEdit = (log) => {
    setEditing(log);
    setForm({ ...EMPTY, ...log });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.title || !form.type || !form.date) return;
    setSaving(true);
    try {
      const proj = projects.find((p) => p.id === form.project_id);
      const payload = { ...form, project_name: proj?.name || form.project_name };
      if (editing) {
        await base44.entities.SafetyLog.update(editing.id, payload);
      } else {
        await base44.entities.SafetyLog.create(payload);
      }
      setShowDialog(false);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await base44.entities.SafetyLog.delete(id);
    await load();
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const openCount = logs.filter((l) => l.status === 'Åben').length;
  const accidentCount = logs.filter((l) => l.type === 'Ulykke').length;
  const criticalCount = logs.filter((l) => l.severity === 'Kritisk').length;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ShieldAlert className="w-6 h-6 text-amber-500" /> Sikkerhedslog</h1>
          <p className="text-sm text-slate-500 mt-1">Ulykkesrapportering og sikkerhedsgennemgange</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Ny registrering</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Åbne</div>
          <div className="text-2xl font-bold text-amber-600">{openCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Ulykker</div>
          <div className="text-2xl font-bold text-red-600">{accidentCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Kritiske</div>
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle typer</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statusser</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((log) => (
          <Card key={log.id} className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_BADGE[log.type] || ''}`}>{log.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_BADGE[log.severity] || ''}`}>{log.severity}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[log.status] || ''}`}>{log.status}</span>
                </div>
                <div className="font-semibold text-slate-900">{log.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatDate(log.date)}
                  {log.project_name && ` • ${log.project_name}`}
                  {log.location && ` • ${log.location}`}
                  {log.reported_by && ` • Rapport af ${log.reported_by}`}
                </div>
                {log.description && <p className="text-sm text-slate-600 mt-2">{log.description}</p>}
                {log.action_taken && (
                  <div className="mt-2 text-sm">
                    <span className="text-xs font-medium text-slate-400">Tiltag: </span>
                    <span className="text-slate-700">{log.action_taken}</span>
                  </div>
                )}
                {log.follow_up && (
                  <div className="text-sm">
                    <span className="text-xs font-medium text-slate-400">Opfølgning: </span>
                    <span className="text-slate-700">{log.follow_up}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(log)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(log.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <ShieldAlert className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            Ingen registreringer
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger registrering' : 'Ny sikkerhedsregistrering'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Titel</Label>
              <Input value={form.title} onChange={set('title')} placeholder="Kort beskrivelse" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Alvorlighed</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dato</Label>
                <Input type="date" value={form.date} onChange={set('date')} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Projekt</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Ingen projekt" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Lokation</Label>
                <Input value={form.location} onChange={set('location')} placeholder="Adresse/område" />
              </div>
              <div className="space-y-1.5">
                <Label>Rapporteret af</Label>
                <Input value={form.reported_by} onChange={set('reported_by')} placeholder="Navn" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Beskrivelse</Label>
              <Textarea value={form.description} onChange={set('description')} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Tiltag</Label>
              <Textarea value={form.action_taken} onChange={set('action_taken')} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Opfølgning</Label>
              <Textarea value={form.follow_up} onChange={set('follow_up')} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.title}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Gem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}