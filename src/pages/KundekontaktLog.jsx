import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Phone, Mail, Calendar } from 'lucide-react';

const TYPES = ['Opkald', 'Email', 'Møde', 'SMS', 'Besøg', 'Andet'];
const ICON = { Opkald: Phone, Email: Mail, Møde: Calendar, SMS: Mail, Besøg: Calendar, Andet: Phone };
const empty = { customer_name: '', project_name: '', contact_type: 'Opkald', direction: 'Udgående', date: new Date().toISOString().slice(0, 10), subject: '', summary: '', handled_by: '', follow_up: false, follow_up_date: '' };

export default function KundekontaktLog() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      base44.entities.CustomerContactLog.list('-date', 200).catch(() => []),
      base44.entities.Project.list('-created_date', 100).catch(() => []),
    ]);
    setItems(c || []); setProjects(p || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it) => { setEditing(it); setForm({ ...empty, ...it }); setOpen(true); };

  const save = async () => {
    if (!form.customer_name || !form.date) { alert('Udfyld kunde og dato'); return; }
    if (editing) await base44.entities.CustomerContactLog.update(editing.id, form);
    else await base44.entities.CustomerContactLog.create(form);
    setOpen(false); load();
  };
  const remove = async (id) => { if (confirm('Slet logpost?')) { await base44.entities.CustomerContactLog.delete(id); load(); } };

  const shown = items.filter((it) => !filter || (it.customer_name + it.project_name + it.subject).toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kundekontakt Log</h1>
          <p className="text-sm text-muted-foreground">Hele teamets kommunikationshistorik pr. projekt.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Log kontakt</Button>
      </div>

      <Input placeholder="Søg på kunde, projekt eller emne..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-sm" />

      <div className="grid gap-3">
        {shown.length === 0 && <p className="text-sm text-muted-foreground">Ingen kontakter logget.</p>}
        {shown.map((it) => {
          const Icon = ICON[it.contact_type] || Phone;
          return (
            <div key={it.id} className="rounded-lg border bg-card p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><Icon className="w-4 h-4 text-slate-500" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{it.customer_name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{it.contact_type} • {it.direction}</span>
                  {it.follow_up && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Opfølgning</span>}
                </div>
                <div className="text-xs text-muted-foreground">{it.project_name || '—'} • {it.date} {it.handled_by ? `• ${it.handled_by}` : ''}</div>
                {it.subject && <div className="text-sm font-medium mt-1">{it.subject}</div>}
                {it.summary && <p className="text-sm text-muted-foreground mt-0.5">{it.summary}</p>}
                {it.follow_up_date && <div className="text-xs text-amber-700 mt-1">Opfølgning senest: {it.follow_up_date}</div>}
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger kontakt' : 'Log kundekontakt'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Kunde</Label><Input value={form.customer_name} onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))} /></div>
            <div><Label>Projekt</Label><Select value={form.project_name} onValueChange={(v) => setForm((f) => ({ ...f, project_name: v }))}><SelectTrigger><SelectValue placeholder="Vælg projekt" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Type</Label><Select value={form.contact_type} onValueChange={(v) => setForm((f) => ({ ...f, contact_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Retning</Label><Select value={form.direction} onValueChange={(v) => setForm((f) => ({ ...f, direction: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Indgående">Indgående</SelectItem><SelectItem value="Udgående">Udgående</SelectItem></SelectContent></Select></div>
            <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
            <div><Label>Håndteret af</Label><Input value={form.handled_by} onChange={(e) => setForm((f) => ({ ...f, handled_by: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Emne</Label><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Referat</Label><Textarea value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} rows={3} /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.follow_up} onChange={(e) => setForm((f) => ({ ...f, follow_up: e.target.checked }))} id="fu" /><Label htmlFor="fu">Kræver opfølgning</Label></div>
            <div><Label>Opfølgning senest</Label><Input type="date" value={form.follow_up_date} onChange={(e) => setForm((f) => ({ ...f, follow_up_date: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}