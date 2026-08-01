import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Repeat, Plus, Loader2, Trash2, Pencil, Calendar } from 'lucide-react';
import { formatDKK, formatDate } from '@/lib/format';

const INTERVALS = ['Månedlig', 'Kvartalsvis', 'Halvårlig', 'Årlig'];
const STATUSES = ['Aktiv', 'Pauset', 'Opsagt', 'Udløbet'];
const STATUS_BADGE = {
  Aktiv: 'bg-emerald-100 text-emerald-700',
  Pauset: 'bg-amber-100 text-amber-700',
  Opsagt: 'bg-red-100 text-red-700',
  Udløbet: 'bg-slate-100 text-slate-500',
};

const EMPTY = {
  title: '', customer_id: '', customer_name: '', customer_email: '', description: '',
  amount: 0, interval: 'Månedlig', status: 'Aktiv',
  start_date: new Date().toISOString().slice(0, 10), next_invoice_date: '', end_date: '', last_invoiced_date: '', notes: '',
};

const nextDateFor = (fromStr, interval) => {
  if (!fromStr) return '';
  const d = new Date(fromStr);
  if (interval === 'Månedlig') d.setMonth(d.getMonth() + 1);
  else if (interval === 'Kvartalsvis') d.setMonth(d.getMonth() + 3);
  else if (interval === 'Halvårlig') d.setMonth(d.getMonth() + 6);
  else if (interval === 'Årlig') d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

export default function Abonnementer() {
  const [subs, setSubs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    try {
      const [s, c] = await Promise.all([
        base44.entities.Subscription.list('-created_date', 200),
        base44.entities.Customer.list(),
      ]);
      setSubs(s); setCustomers(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowDialog(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...EMPTY, ...s }); setShowDialog(true); };
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const save = async () => {
    if (!form.title || !form.customer_id) return;
    setSaving(true);
    try {
      const cust = customers.find((c) => c.id === form.customer_id);
      const payload = { ...form, customer_name: cust?.company || cust?.name || '', customer_email: cust?.email || '' };
      if (!payload.next_invoice_date) payload.next_invoice_date = nextDateFor(payload.start_date, payload.interval);
      if (editing) await base44.entities.Subscription.update(editing.id, payload);
      else await base44.entities.Subscription.create(payload);
      setShowDialog(false); load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const remove = async (id) => { if (confirm('Slet abonnement?')) { await base44.entities.Subscription.delete(id); load(); } };

  const markInvoiced = async (s) => {
    const last = new Date().toISOString().slice(0, 10);
    await base44.entities.Subscription.update(s.id, { last_invoiced_date: last, next_invoice_date: nextDateFor(last, s.interval) });
    load();
  };

  const active = subs.filter((s) => s.status === 'Aktiv');
  const monthlyTotal = active.reduce((sum, s) => {
    if (s.interval === 'Månedlig') return sum + (s.amount || 0);
    if (s.interval === 'Kvartalsvis') return sum + (s.amount || 0) / 3;
    if (s.interval === 'Halvårlig') return sum + (s.amount || 0) / 6;
    if (s.interval === 'Årlig') return sum + (s.amount || 0) / 12;
    return sum;
  }, 0);
  const annualTotal = monthlyTotal * 12;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Repeat className="w-6 h-6 text-amber-500" /> Abonnementer</h1>
          <p className="text-sm text-slate-500 mt-1">Faste abonnementsaftaler og tilbagevendende fakturering</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Ny abonnement</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1">Aktive</div><div className="text-2xl font-bold text-emerald-600">{active.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1">Månedlig værdi</div><div className="text-2xl font-bold text-slate-900">{formatDKK(monthlyTotal)}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500 mb-1">Årlig værdi</div><div className="text-2xl font-bold text-slate-900">{formatDKK(annualTotal)}</div></Card>
      </div>

      <div className="space-y-3">
        {subs.map((s) => (
          <Card key={s.id} className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{s.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status] || ''}`}>{s.status}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s.interval}</span>
                </div>
                <div className="text-sm text-slate-500 mt-0.5">{s.customer_name || '—'}</div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                  <span>{formatDKK(s.amount || 0)}</span>
                  {s.start_date && <span>Start: {formatDate(s.start_date)}</span>}
                  {s.next_invoice_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Næste: {formatDate(s.next_invoice_date)}</span>}
                  {s.last_invoiced_date && <span>Sidst: {formatDate(s.last_invoiced_date)}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                {s.status === 'Aktiv' && <Button variant="outline" size="sm" onClick={() => markInvoiced(s)}>Faktureret</Button>}
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
          </Card>
        ))}
        {subs.length === 0 && (
          <div className="text-center py-12 text-slate-400"><Repeat className="w-12 h-12 mx-auto mb-2 text-slate-300" />Ingen abonnementer</div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger abonnement' : 'Nyt abonnement'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Titel</Label><Input value={form.title} onChange={set('title')} placeholder="F.eks. månedlig snerydning" /></div>
            <div className="space-y-1.5"><Label>Kunde</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Vælg kunde" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.company || c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Beløb (DKK)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Interval</Label>
                <Select value={form.interval} onValueChange={(v) => setForm({ ...form, interval: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{INTERVALS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Startdato</Label><Input type="date" value={form.start_date} onChange={set('start_date')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Næste fakturering</Label><Input type="date" value={form.next_invoice_date} onChange={set('next_invoice_date')} /></div>
              <div className="space-y-1.5"><Label>Slutdato</Label><Input type="date" value={form.end_date} onChange={set('end_date')} /></div>
            </div>
            <div className="space-y-1.5"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={set('description')} rows={2} /></div>
            <div className="space-y-1.5"><Label>Noter</Label><Textarea value={form.notes} onChange={set('notes')} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Annuller</Button>
            <Button onClick={save} disabled={saving || !form.title || !form.customer_id}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Gem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}