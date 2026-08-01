import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDate, formatDKK } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileCheck, Plus, Pencil, Trash2, Check, X, FileText, Clock } from 'lucide-react';

const STATUSES = ['Afventer', 'Godkendt', 'Afvist', 'Betalt'];
const statusBadge = { 'Afventer': 'bg-amber-100 text-amber-700', 'Godkendt': 'bg-emerald-100 text-emerald-700', 'Afvist': 'bg-red-100 text-red-700', 'Betalt': 'bg-blue-100 text-blue-700' };
const today = new Date().toISOString().slice(0, 10);
const empty = { invoice_number: '', supplier_name: '', project_name: '', amount: 0, vat_amount: 0, date: today, due_date: '', status: 'Afventer', description: '', file_url: '', approved_by: '', notes: '' };

export default function Leverandoerfakturaer() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => { try { setInvoices(await base44.entities.SupplierInvoice.list('-date')); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true); };
  const openEdit = (i) => { setEditing(i); setForm({ ...empty, ...i }); setDialogOpen(true); };
  const save = async () => { if (editing) await base44.entities.SupplierInvoice.update(editing.id, form); else await base44.entities.SupplierInvoice.create(form); setDialogOpen(false); load(); };
  const remove = async (id) => { if (!confirm('Slet faktura?')) return; await base44.entities.SupplierInvoice.delete(id); load(); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setStatus = async (inv, status) => { await base44.entities.SupplierInvoice.update(inv.id, { status, ...(status === 'Godkendt' ? { approved_by: 'Admin' } : {}) }); load(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  const pending = invoices.filter((i) => i.status === 'Afventer');
  const approved = invoices.filter((i) => i.status === 'Godkendt');
  const totalPending = pending.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalApproved = approved.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Leverandørfakturaer</h1><p className="text-sm text-slate-500 mt-1">Registrering og godkendelse af fakturaer fra leverandører</p></div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Tilføj faktura</Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><FileCheck className="w-4 h-4" /> Total</div><div className="text-2xl font-bold text-slate-900">{invoices.length}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Clock className="w-4 h-4" /> Afventer</div><div className="text-2xl font-bold text-amber-600">{pending.length}</div><div className="text-xs text-slate-500 mt-1">{formatDKK(totalPending)}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Check className="w-4 h-4" /> Godkendte</div><div className="text-2xl font-bold text-emerald-600">{approved.length}</div><div className="text-xs text-slate-500 mt-1">{formatDKK(totalApproved)}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><FileText className="w-4 h-4" /> Betalte</div><div className="text-2xl font-bold text-blue-600">{invoices.filter((i) => i.status === 'Betalt').length}</div></div>
      </div>

      <div className="space-y-3">
        {invoices.map((inv) => (
          <div key={inv.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><FileText className="w-5 h-5 text-slate-600" /></div>
                <div>
                  <div className="font-semibold text-slate-900">{inv.invoice_number} — {inv.supplier_name}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{inv.project_name || '—'} • {inv.date ? formatDate(inv.date) : '—'}{inv.due_date ? ` • Forfald: ${formatDate(inv.due_date)}` : ''}</div>
                  {inv.description && <div className="text-xs text-slate-400 mt-1">{inv.description}</div>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">{formatDKK(Number(inv.amount) || 0)}</div>
                {inv.vat_amount > 0 && <div className="text-xs text-slate-500 mt-0.5">+{formatDKK(Number(inv.vat_amount) || 0)} moms</div>}
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge[inv.status] || statusBadge['Afventer']} inline-block mt-1`}>{inv.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
              {inv.status === 'Afventer' && (<><button onClick={() => setStatus(inv, 'Godkendt')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"><Check className="w-4 h-4" /> Godkend</button><button onClick={() => setStatus(inv, 'Afvist')} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"><X className="w-4 h-4" /> Afvis</button></>)}
              {inv.status === 'Godkendt' && <button onClick={() => setStatus(inv, 'Betalt')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"><Check className="w-4 h-4" /> Marker betalt</button>}
              {inv.file_url && <a href={inv.file_url} target="_blank" rel="noreferrer" className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 ml-auto"><FileText className="w-4 h-4" /> Vis fil</a>}
              <button onClick={() => openEdit(inv)} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 ml-auto"><Pencil className="w-3.5 h-3.5" /> Rediger</button>
              <button onClick={() => remove(inv.id)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      {invoices.length === 0 && <div className="text-center py-16 text-slate-400"><FileCheck className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Ingen leverandørfakturaer registreret</p></div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Rediger faktura' : 'Tilføj leverandørfaktura'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Fakturanr. *</Label><Input value={form.invoice_number} onChange={(e) => set('invoice_number', e.target.value)} /></div>
            <div><Label>Leverandør *</Label><Input value={form.supplier_name} onChange={(e) => set('supplier_name', e.target.value)} /></div>
            <div><Label>Beløb (DKK) *</Label><Input type="number" value={form.amount} onChange={(e) => set('amount', Number(e.target.value))} /></div>
            <div><Label>Moms (DKK)</Label><Input type="number" value={form.vat_amount} onChange={(e) => set('vat_amount', Number(e.target.value))} /></div>
            <div><Label>Dato</Label><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
            <div><Label>Forfaldsdato</Label><Input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} /></div>
            <div><Label>Projekt</Label><Input value={form.project_name} onChange={(e) => set('project_name', e.target.value)} /></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Beskrivelse</Label><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} /></div>
            <div className="col-span-2"><Label>Fil-URL</Label><Input value={form.file_url} onChange={(e) => set('file_url', e.target.value)} placeholder="https://..." /></div>
            <div className="col-span-2"><Label>Noter</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button><Button onClick={save} disabled={!form.invoice_number || !form.supplier_name}>Gem</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}