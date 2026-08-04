import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CheckCircle2, ListTodo } from 'lucide-react';
import { formatDate } from '@/lib/format';

const PRIORITIES = ['Lav', 'Normal', 'Høj'];
const STATUSES = ['Ikke startet', 'I gang', 'Afventer', 'Gennemført'];
const PRIO_BADGE = { Lav: 'bg-slate-100 text-slate-600', Normal: 'bg-blue-100 text-blue-700', Høj: 'bg-red-100 text-red-700' };
const STATUS_BADGE = { 'Ikke startet': 'bg-slate-100 text-slate-600', 'I gang': 'bg-blue-100 text-blue-700', Afventer: 'bg-amber-100 text-amber-700', Gennemført: 'bg-emerald-100 text-emerald-700' };

const EMPTY = { title: '', description: '', assigned_to: '', assigned_user_id: '', status: 'Ikke startet', priority: 'Normal', due_date: '', completed_date: '' };

export default function Opgavestyring() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [taskList, userList] = await Promise.all([
        base44.entities.Task.list('-created_date', 200).catch(() => []),
        base44.entities.User.list().catch(() => []),
      ]);
      setItems(taskList || []);
      setUsers(userList || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const openNew = () => { setForm(EMPTY); setEditing(null); setDialogOpen(true); };
  const openEdit = (i) => { setForm({ ...EMPTY, ...i }); setEditing(i); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, completed_date: form.status === 'Gennemført' ? (form.completed_date || new Date().toISOString().split('T')[0]) : '' };
      if (editing) { await base44.entities.Task.update(editing.id, payload); } else { await base44.entities.Task.create(payload); }
      setDialogOpen(false); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const remove = async (id) => { if (!confirm('Slet denne opgave?')) return; await base44.entities.Task.delete(id); load(); };
  const toggleDone = async (i) => { const status = i.status === 'Gennemført' ? 'Ikke startet' : 'Gennemført'; await base44.entities.Task.update(i.id, { status, completed_date: status === 'Gennemført' ? new Date().toISOString().split('T')[0] : '' }); load(); };

  const sorted = [...items].sort((a, b) => { const pr = { Høj: 0, Normal: 1, Lav: 2 }; return (pr[a.priority] ?? 1) - (pr[b.priority] ?? 1); });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-100 flex items-center justify-center"><ListTodo className="w-6 h-6 text-cyan-600" /></div>
          <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Opgavestyring</h1><p className="text-slate-500 mt-0.5">Daglige opgaver med prioritering og tildeling til medarbejdere</p></div>
        </div>
        <Button onClick={openNew} className="bg-slate-950 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Ny opgave</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-cyan-500 rounded-full animate-spin" /></div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center"><ListTodo className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Ingen opgaver endnu.</p></div>
      ) : (
        <div className="space-y-2">
          {sorted.map((i) => (
            <div key={i.id} className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${i.status === 'Gennemført' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'}`}>
              <button onClick={() => toggleDone(i)} className="mt-0.5 flex-shrink-0"><CheckCircle2 className={`w-5 h-5 ${i.status === 'Gennemført' ? 'text-emerald-500 fill-emerald-500' : 'text-slate-300'}`} /></button>
              <div className="min-w-0 flex-1">
                <div className={`font-medium ${i.status === 'Gennemført' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{i.title}</div>
                {i.description && <p className="text-sm text-slate-500 line-clamp-1">{i.description}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${PRIO_BADGE[i.priority]}`}>{i.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[i.status]}`}>{i.status}</span>
                  {i.assigned_to && <span className="text-xs text-slate-500">👤 {i.assigned_to}</span>}
                  {i.due_date && <span className="text-xs text-slate-400">⏰ {formatDate(i.due_date)}</span>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0"><Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4 text-slate-500" /></Button><Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger opgave' : 'Ny opgave'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Titel *</Label><Input value={form.title} onChange={set('title')} /></div>
            <div className="space-y-1.5"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={set('description')} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tildelt til</Label>
                <Select value={form.assigned_user_id} onValueChange={(uid) => {
                  const u = users.find((x) => x.id === uid);
                  setForm({ ...form, assigned_user_id: uid, assigned_to: u?.full_name || '' });
                }}>
                  <SelectTrigger><SelectValue placeholder="Vælg medarbejder" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Deadline</Label><Input type="date" value={form.due_date || ''} onChange={set('due_date')} /></div>
              <div className="space-y-1.5"><Label>Prioritet</Label><Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={saving || !form.title}>{saving ? 'Gemmer...' : 'Gem'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}