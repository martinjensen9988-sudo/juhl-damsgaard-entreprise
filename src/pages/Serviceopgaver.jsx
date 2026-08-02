import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Wrench, Snowflake, MapPin, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/format';

const types = ['Snerydning', 'Vicevært', 'Skadeservice', 'Drift', 'Andet'];
const typeIcon = { Snerydning: Snowflake, Vicevært: Wrench, Skadeservice: Wrench, Drift: Wrench, Andet: Wrench };
const typeColor = { Snerydning: 'bg-cyan-100 text-cyan-700', Vicevært: 'bg-blue-100 text-blue-700', Skadeservice: 'bg-red-100 text-red-700', Drift: 'bg-amber-100 text-amber-700', Andet: 'bg-slate-100 text-slate-600' };
const priorities = ['Lav', 'Normal', 'Høj', 'Akut'];
const prioColor = { Lav: 'bg-slate-100 text-slate-600', Normal: 'bg-blue-100 text-blue-700', Høj: 'bg-amber-100 text-amber-700', Akut: 'bg-red-100 text-red-700' };
const statuses = ['Oprettet', 'Tildelt', 'I gang', 'Gennemført', 'Aflyst'];
const statusColor = { Oprettet: 'bg-slate-100 text-slate-600', Tildelt: 'bg-blue-100 text-blue-700', 'I gang': 'bg-amber-100 text-amber-700', Gennemført: 'bg-emerald-100 text-emerald-700', Aflyst: 'bg-red-100 text-red-700' };
const empty = { title: '', type: 'Vicevært', customer_name: '', address: '', assigned_to: '', priority: 'Normal', status: 'Oprettet', due_date: '', completed_date: '', notes: '' };

export default function Serviceopgaver() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try { const [t, e] = await Promise.all([base44.entities.ServiceTask.list(), base44.entities.Employee.list().catch(() => [])]); setTasks(t || []); setEmployees(e || []); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...empty, ...t }); setOpen(true); };

  const save = async () => {
    if (!form.title) return alert('Angiv titel');
    setSaving(true);
    try { editing ? await base44.entities.ServiceTask.update(editing.id, form) : await base44.entities.ServiceTask.create(form); setOpen(false); load(); }
    catch (e) { console.error(e); alert('Fejl'); }
    setSaving(false);
  };
  const remove = async (t) => { if (!confirm('Slet opgave?')) return; try { await base44.entities.ServiceTask.delete(t.id); load(); } catch (e) {} };
  const quickStatus = async (t, status) => { try { await base44.entities.ServiceTask.update(t.id, { status, completed_date: status === 'Gennemført' ? new Date().toISOString().split('T')[0] : '' }); load(); } catch (e) {} };

  const filtered = useMemo(() => filter === 'all' ? tasks : tasks.filter((t) => t.type === filter), [tasks, filter]);
  const stats = useMemo(() => ({
    total: tasks.length, open: tasks.filter((t) => !['Gennemført', 'Aflyst'].includes(t.status)).length,
    done: tasks.filter((t) => t.status === 'Gennemført').length, acute: tasks.filter((t) => t.priority === 'Akut' && t.status !== 'Gennemført').length,
  }), [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Wrench className="w-5 h-5 text-blue-600" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Serviceopgaver</h1>
            <p className="text-slate-500 mt-0.5">Snerydning og vicevært-service — opret, tildel og følg op på udførelsen</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Ny opgave</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['Total', stats.total, 'text-slate-900'], ['Åbne', stats.open, 'text-blue-600'], ['Gennemført', stats.done, 'text-emerald-600'], ['Akutte', stats.acute, 'text-red-600']].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-sm text-slate-500 mb-1">{l}</div><div className={`text-2xl font-bold ${c}`}>{v}</div></div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Alle</Button>
        {types.map((t) => <Button key={t} variant={filter === t ? 'default' : 'outline'} size="sm" onClick={() => setFilter(t)}>{t}</Button>)}
      </div>

      {loading ? <div className="text-center py-20 text-slate-400">Indlæser...</div> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200"><Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen opgaver</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const Icon = typeIcon[t.type] || Wrench;
            return (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor[t.type] || 'bg-slate-100'}`}><Icon className="w-4 h-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="font-medium text-slate-900 truncate">{t.title}</span><span className={`px-1.5 py-0.5 rounded text-xs ${prioColor[t.priority] || 'bg-slate-100'}`}>{t.priority}</span></div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                    {t.customer_name && <span>{t.customer_name}</span>}
                    {t.address && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {t.address}</span>}
                    {t.assigned_to && <span>👤 {t.assigned_to}</span>}
                    {t.due_date && <span>📅 {formatDate(t.due_date)}</span>}
                  </div>
                </div>
                <Select value={t.status} onValueChange={(v) => quickStatus(t, v)}>
                  <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="text-slate-400 hover:text-slate-700"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(t)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger opgave' : 'Ny serviceopgave'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Titel *</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="fx Snerydning parkeringsplads" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => set('type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Prioritet</Label><Select value={form.priority} onValueChange={(v) => set('priority', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kunde</Label><Input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} /></div>
              <div><Label>Tildelt til</Label><Select value={form.assigned_to} onValueChange={(v) => set('assigned_to', v)}><SelectTrigger><SelectValue placeholder="Vælg" /></SelectTrigger><SelectContent><SelectItem value={null}>Ingen</SelectItem>{employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label>Adresse</Label><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Deadline</Label><Input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} /></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
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