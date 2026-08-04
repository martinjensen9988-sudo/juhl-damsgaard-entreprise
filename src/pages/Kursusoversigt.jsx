import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Award } from 'lucide-react';

const TYPES = ['Maskinførerbevis', 'Førstehjælp', 'Arbejdsmiljø', 'Svejsebevis', 'Kranbevis', 'Truckbevis', 'Håndværk', 'Andet'];
const empty = { title: '', employee_name: '', type: 'Andet', issue_date: '', expiry_date: '', file_url: '', notes: '' };

function daysTo(d) { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000); }

export default function Kursusoversigt() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => { setItems(await base44.entities.Certificate.list('-expiry_date', 200).catch(() => [])); }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it) => { setEditing(it); setForm({ ...empty, ...it }); setOpen(true); };

  const save = async () => {
    if (!form.title || !form.employee_name) { alert('Udfyld certifikat og medarbejder'); return; }
    if (editing) await base44.entities.Certificate.update(editing.id, form);
    else await base44.entities.Certificate.create(form);
    setOpen(false); load();
  };
  const remove = async (id) => { if (confirm('Slet certifikat?')) { await base44.entities.Certificate.delete(id); load(); } };

  const badge = (d) => {
    const days = daysTo(d);
    if (days === null) return 'bg-slate-100 text-slate-600';
    if (days < 0) return 'bg-red-100 text-red-700';
    if (days < 30) return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kursusoversigt</h1>
          <p className="text-sm text-muted-foreground">Certifikater, kursusudløb og sikkerhedsgodkendelser.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Tilføj certifikat</Button>
      </div>

      <div className="grid gap-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Ingen certifikater registreret.</p>}
        {items.map((it) => {
          const days = daysTo(it.expiry_date);
          return (
            <div key={it.id} className="rounded-lg border bg-card p-4 flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Award className="w-5 h-5 text-slate-500" /></div>
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-xs text-muted-foreground">{it.employee_name} • {it.type}</div>
                  <div className="text-xs text-muted-foreground">Udstedt: {it.issue_date || '—'} • Udløber: {it.expiry_date || '—'}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${badge(it.expiry_date)}`}>
                  {days === null ? 'Ingen udløb' : days < 0 ? 'Udløbet' : `${days} dage`}
                </span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger certifikat' : 'Nyt certifikat'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Certifikat</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Medarbejder</Label><Input value={form.employee_name} onChange={(e) => setForm((f) => ({ ...f, employee_name: e.target.value }))} /></div>
            <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Udstedt</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))} /></div>
            <div><Label>Udløber</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Fil-URL</Label><Input value={form.file_url} onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))} placeholder="https://..." /></div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuller</Button><Button onClick={save}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}